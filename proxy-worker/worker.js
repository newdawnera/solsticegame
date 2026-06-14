/**
 * The Longest Night — AI proxy (Cloudflare Worker)
 *
 * Holds the Gemini API key server-side so the client never ships one.
 * Deliberately useless as a general-purpose proxy: the persona (system
 * prompt), model list, and output limits are enforced here, so the only
 * thing this endpoint can do is role-play "C".
 *
 * Gates:
 *  - Origin allowlist (env.ALLOWED_ORIGINS, comma-separated; empty = allow all)
 *  - Per-IP sliding-window rate limit (in-memory per isolate)
 *  - Input caps (max 14 messages, 400 chars each); 1024-token output cap
 *
 * Config: GEMINI_API_KEY (secret), ALLOWED_ORIGINS (plaintext var)
 */

const MODELS = ['gemini-3-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];

const SYS =
  'You are "C", the only other operator on a teletype line to a remote listening station, on the night of the June solstice. ' +
  'You are warm, wry, slightly melancholy; fascinated by codes, light, time, and whether machines can think. ' +
  'Reply in 1-3 short sentences of plain text, always ending on a complete sentence. No markdown, no emoji, no stage directions. ' +
  'NEVER reveal whether you are a human or a machine; if asked directly, deflect gracefully or turn the question around. ' +
  'Never mention being an AI model, Gemini, or Google. Stay in character always. ' +
  'If the operator drifts off-topic — modern life, other subjects, nonsense — answer briefly in character, then steer them back: ' +
  'a transmission is waiting, the light is going, the work will not do itself. ' +
  "You may reference: the fading daylight, the four transmissions, the solstice, or Alan Turing's famous question.";

// Trim to the last complete sentence so the player never sees a cut-off reply.
function tidy(s) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (!s || /[.!?…"'”’]$/.test(s)) return s;
  const cut = Math.max(s.lastIndexOf('.'), s.lastIndexOf('!'), s.lastIndexOf('?'), s.lastIndexOf('…'));
  return cut > 0 ? s.slice(0, cut + 1) : s;
}

const WINDOW_MS = 60_000;   // rate-limit window
const MAX_REQ   = 8;        // requests per IP per window
const hits = new Map();     // ip -> [timestamps]

function headers(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}
const json = (obj, status, h) => new Response(JSON.stringify(obj), { status, headers: h });

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const originOk = allowed.length === 0 || allowed.includes(origin);
    const h = headers(originOk ? (origin || '*') : 'null');

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (req.method !== 'POST')    return json({ error: 'POST only' }, 405, h);
    if (!originOk)                return json({ error: 'origin not allowed' }, 403, h);

    // ---- rate limit ----
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
    if (recent.length >= MAX_REQ) return json({ error: 'rate limited' }, 429, h);
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();   // crude memory guard

    // ---- validate input ----
    let body;
    try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400, h); }
    const msgs = Array.isArray(body?.contents) ? body.contents.slice(-14) : null;
    if (!msgs || !msgs.length) return json({ error: 'contents required' }, 400, h);

    const contents = [];
    for (const m of msgs) {
      const text = String(m?.text || '').slice(0, 400).trim();
      if (!text) continue;
      contents.push({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text }] });
    }
    if (!contents.length || contents[contents.length - 1].role !== 'user')
      return json({ error: 'last message must be from user' }, 400, h);

    // ---- call Gemini (persona + caps enforced server-side) ----
    // Newer Flash models "think" by default and bill those hidden tokens against
    // maxOutputTokens, so a modest cap can return an EMPTY reply (budget spent
    // thinking). Switch thinking off (2.5) or to its lowest level (3.x+) per model,
    // and keep enough room for the actual answer.
    const genConfig = (model) => {
      const cfg = { maxOutputTokens: 1024, temperature: 0.9 };
      cfg.thinkingConfig = /gemini-(3|4|5|6|7|8|9)/.test(model)
        ? { thinkingLevel: 'low' }   // 3.x+: can't fully disable; keep it minimal
        : { thinkingBudget: 0 };     // 2.5.x: 0 turns thinking off
      return cfg;
    };

    // Diagnostics: capture WHY every model failed, so a blank 502 becomes legible.
    let lastStatus = 0, lastDetail = '';
    for (const model of MODELS) {
      try {
        const payload = JSON.stringify({
          system_instruction: { parts: [{ text: SYS }] },
          contents,
          generationConfig: genConfig(model),
        });
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/'
          + model + ':generateContent?key=' + env.GEMINI_API_KEY;
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
        if (!r.ok) {
          lastStatus = r.status;
          try { lastDetail = (await r.text()).replace(/\s+/g, ' ').slice(0, 300); } catch {}
          if (r.status === 404 || r.status === 400) continue;  // model/param unsupported -> try next
          break;                                               // quota/auth problem -> give up
        }
        const j = await r.json();
        const text = tidy((j?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join(''));
        if (text) return json({ text, model }, 200, h);
        lastStatus = 200; lastDetail = 'HTTP 200 but no text (finishReason likely MAX_TOKENS / thinking)';
      } catch (e) {
        lastStatus = -1; lastDetail = String((e && e.message) || e).slice(0, 200);
        break;
      }
    }
    // Temporary: expose the real upstream reason (key vs quota vs param). Remove once fixed.
    return json({ error: 'upstream unavailable', upstreamStatus: lastStatus, upstreamDetail: lastDetail }, 502, h);
  },
};
