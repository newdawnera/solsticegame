# The Longest Night

A solstice codebreaking game for the [June Solstice Game Jam](https://dev.to/challenges/june-game-jam-2026-06-03).

You are the night-shift cryptanalyst at a remote listening station on June 21. Four encrypted transmissions must be broken before the sun goes down. Between ciphers, you talk to **C** — a colleague on the teletype line — and at dawn you must answer Turing's question: was C human, or machine?

## Play it

Open `index.html` in any modern browser. No build, no server, no dependencies — it's one file.

## The mechanics

- **Daylight is your resource.** It drains in real time (~10 minutes of sun). Wrong transmissions cost 20s, hints cost 45s. If the sun sets, you finish by starlight — the ending remembers.
- **Four ciphers, rising difficulty:** Caesar shift → Atbash mirror → Vigenère (find the keyword from narrative clues) → rotor cipher (progressive shift, an Enigma nod).
- **The Turing Test, playable.** C chats with you between levels and never says what it is. At the end, you decide.

## Optional: make C a live AI (free)

1. Go to [aistudio.google.com](https://aistudio.google.com) → **Get API key** (free tier, no credit card).
2. In the game, click **⚙ KEY** and paste it. The chip switches to `C: LIVE AI`.
3. C is now powered by Gemini Flash (free-tier models, auto-detected). The key never leaves your browser (stored in localStorage only).

No key? C speaks from a script. The game is fully playable either way, and the ending honestly discloses which one you talked to.

## Prize categories targeted

- **Main theme** — solstice, light vs. darkness as the core resource, the passage of time
- **Best Ode to Alan Turing** — codebreaking mechanics, the Imitation Game as the narrative climax, epilogue honoring Turing
- **Best Google AI Usage** — Gemini API embedded as the character C (the Turing Test, run on an actual AI)

## Deploying for the submission

Judges need a playable link. Two free options:

**GitHub Pages:** push this folder to a repo → Settings → Pages → deploy from branch → main / root. Game lives at `https://<you>.github.io/<repo>/`.

**itch.io:** zip the folder → create new project → "HTML" type → upload zip, check "this file will be played in the browser".

## Remaining TODO before June 21

- [ ] Playtest and tune daylight timing / difficulty
- [ ] Deploy to a public URL
- [ ] Record demo video with voiceover (judges strongly encouraged this)
- [ ] Write the DEV submission post using the official template
- [ ] Submit before June 21, 11:59 PM PDT
