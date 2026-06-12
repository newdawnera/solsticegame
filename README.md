# The Longest Night

A solstice codebreaking game for the [June Solstice Game Jam](https://dev.to/challenges/june-game-jam-2026-06-03).

You are the night-shift cryptanalyst at a remote listening station on June 21. Four encrypted transmissions must be broken before the sun goes down. Between ciphers, you talk to **C** — a colleague on the teletype line — and at dawn you must answer Turing's question: was C human, or machine?

**Play it:** [newdawnera.github.io/solsticegame](https://newdawnera.github.io/solsticegame/) — or open `index.html` in any modern browser. No build, no dependencies, one file.

## The mechanics

- **Daylight is your resource.** It drains in real time (~8 minutes of sun). Wrong transmissions cost 20s, hints cost 45s. If the sun sets, you finish by starlight — the ending remembers.
- **Four ciphers, rising difficulty:** Caesar shift → lens cipher (mirror, half-turn, or backwards) → Vigenère (find the keyword from narrative clues) → rotor cipher (progressive shift, an Enigma nod). The dial shift, lens, and rotor start are drawn fresh every watch, and the hints adapt to whatever was drawn.
- **The Turing Test, playable.** C chats with you between levels and never says what it is. At the end, you decide.
- **A score that follows the sun.** The procedural soundtrack (one of three tracks, picked per visit) dims in tone as daylight fades. Music volume is adjustable independently of the game's sound effects.

## How C talks: three tiers

1. **Hosted proxy** — a Cloudflare Worker (`proxy-worker/`) holds the Gemini key server-side, locked to this game's origin and rate-limited per IP. Visitors get live AI with zero setup.
2. **Bring your own key** — click **⚙ KEY** in-game and paste a free [AI Studio](https://aistudio.google.com) key. It stays in your browser (localStorage) and is sent only to Google.
3. **Scripted fallback** — no proxy, no key, no problem: C speaks from a script and the game stays fully playable.

The ending honestly discloses which C you talked to.

## Prize categories targeted

- **Main theme** — solstice, light vs. darkness as the core resource, the passage of time
- **Best Ode to Alan Turing** — codebreaking mechanics, the Imitation Game as the narrative climax, epilogue honoring Turing
- **Best Google AI Usage** — Gemini API embedded as the character C (the Turing Test, run on an actual AI), behind a security-gated proxy
