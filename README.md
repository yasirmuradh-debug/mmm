# JARVIS — Desktop AI Assistant

A glassmorphism desktop assistant with a reactive 3D particle orb, voice
(wake word + speech + text-to-speech), an AI brain, weather, tasks &
reminders, an offline music player, and a notifications panel.

Built with **Electron** (so it's one language — JavaScript — for the whole
thing, using the Node.js you already have installed). No build step, no
bundler, beginner-friendly.

```
┌──────────────────────────── JARVIS ──────────────── ⚙ — ▢ ✕ ┐
│  ┌── Weather ──┐        ╭───────────────╮        ┌ Notifications ┐│
│  │ 18°  ⛅       │        │    · · · · ·   │        │ WhatsApp msgs │ │
│  │ H29° L12°   │        │  ·  the ORB  · │        └───────────────┘ │
│  └─────────────┘        │   · · · · ·   │        ┌──── Music ─────┐ │
│  ┌── Tasks ────┐        ╰───────────────╯        │ ▶ your library │ │
│  │ ☐ Call mom  │      "Say Jarvis to wake me"    │ ⏮  ⏯  ⏭        │ │
│  │ ☐ …tomorrow │   ┌ 🎙  Ask Jarvis…      ➤ ┐    └────────────────┘ │
│  └─────────────┘   └────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. What's in the box right now (works today)

| Feature | Status | Notes |
|---|---|---|
| Glassmorphism dashboard UI | ✅ Working | Matches the reference design |
| 3D particle orb that reacts to your voice | ✅ Working | Three.js; pulses when you talk & when Jarvis speaks |
| Wake word ("Jarvis…") + voice commands | ✅ Working | Uses the built-in browser speech engine |
| Jarvis speaks back (text-to-speech) | ✅ Working | Built-in voice; upgradeable to a realistic one |
| AI brain (chat, understands your plans) | ✅ Working* | *Needs a free Claude API key — see step 3 |
| Memory ("remind me what I said yesterday") | ✅ Working | Stored on disk, fed back to the AI |
| Tasks & reminders + OS notifications | ✅ Working | Say/type "…tomorrow" to set a due date |
| Weather panel (current + 6-day) | ✅ Working | Free, no API key (Open-Meteo) |
| Offline music player | ✅ Working | Point it at your music folder |
| Notifications / WhatsApp panel | 🧩 Placeholder | UI is ready; wiring in the roadmap below |
| File access | ✅ Working (API) | Main process can browse/open any folder |

---

## 2. Run it (step by step)

You need **Node.js** (you have it). In a terminal, inside this folder:

```bash
npm install      # downloads Electron + one small helper (one-time, a few minutes)
npm start        # launches Jarvis
```

That's it — the app window opens. The first time, allow microphone access
when your OS asks.

> On Windows/Mac the window has custom minimise/close buttons in the top-right.

---

## 3. Turn on the brain (2 minutes)

The orb, voice, weather, tasks and music all work with **zero** setup. To let
Jarvis actually *think* and hold a conversation, give it a Claude API key:

1. Go to **console.anthropic.com** → sign in → **API Keys** → create one.
2. In Jarvis, click the **⚙ gear** (top-right) → paste the key into
   **Claude API key** → **Save**.

Your key is stored locally and never leaves your machine except to call
Claude. Now try: say **"Jarvis, what's the weather like?"** or type in the bar.

Optional in the same Settings panel:
- **City + latitude/longitude** → your local weather (find coords by Googling
  "my city latitude longitude").
- **Wake word** → change "jarvis" to anything.
- **ElevenLabs key** → for a realistic voice (wiring in the roadmap).

---

## 4. How the pieces fit (so you can learn/extend)

```
main.js        The "back end". Full Node.js: files, weather, notifications,
               storage, and the Claude API call. Secrets live here only.
preload.js     A safe, tiny bridge. The only things the UI is allowed to call.
src/index.html The layout (title bar, panels, orb canvas, settings).
src/styles.css The glassmorphism look.
src/orb.js     The 3D particle orb (Three.js).
src/voice.js   Wake word, speech-to-text, text-to-speech, mic level meter.
src/renderer.js Glue: wires the orb, voice, weather, tasks, music and chat.
```

Rule of thumb: anything touching your files, network or keys goes in
`main.js`; anything visual goes in `src/`.

---

## 5. Roadmap — the harder features, in the order I'd build them

Each step is self-contained. Do them one at a time.

### A. Realistic voice (ElevenLabs)
Replace `speak()` in `src/voice.js` with a call to a new main-process handler
that hits the ElevenLabs API and plays the returned audio. ~30 lines.

### B. Better wake word & offline speech
The browser speech engine needs internet and can be flaky. For a rock-solid,
offline wake word use **Porcupine** (`@picovoice/porcupine-node`) or
**openWakeWord**, and **whisper.cpp** / `nodejs-whisper` for offline
speech-to-text. This is where your **Python** install can help — Whisper runs
great in Python; Electron can talk to a small local Python script.

### C. WhatsApp notifications
Two options:
- **Easiest:** use **whatsapp-web.js** (Node). It logs into WhatsApp Web via a
  QR code and emits an event on every message. In `main.js`, on each message,
  send the sender + unread count to the UI's notifications panel and call
  `J.notify(...)`. Jarvis can then say "You have 3 unread messages, 2 from Mom."
- Add it as a new module `main.js` → `whatsapp.js` and push events to the
  renderer with `mainWindow.webContents.send('whatsapp:message', …)`.

### D. YouTube / online music
Add a search box that uses the YouTube Data API (or `ytdl-core` to stream), and
route playback through the same `<audio>`/`<video>` element the offline player
uses.

### E. Deeper computer control
`main.js` already has file browse/open. Extend it with an "actions" layer the
AI can call (open apps, search files, control volume). Give Claude a list of
allowed tools and let it request them — that turns Jarvis into a true agent.

### F. Package as a real app
```bash
npm run dist     # builds an installer (.exe / .dmg) via electron-builder
```

---

## 6. About "Antigravity"

You mentioned Antigravity (an AI coding IDE). You can absolutely open **this
folder** in it and ask it to implement the roadmap steps above — the code is
organised and commented so an AI assistant can extend it cleanly. Node.js runs
the app; Python is only needed if/when you add offline Whisper (step B).

---

## Troubleshooting

- **"electron: command not found"** → run `npm install` first.
- **No microphone / wake word** → check OS mic permissions; the mic button
  (push-to-talk) always works as a fallback.
- **Jarvis won't answer** → add your Claude API key in Settings (step 3).
- **Weather says unavailable** → check your internet / the lat-long in Settings.
