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
| Jarvis speaks back (text-to-speech) | ✅ Working | Built-in voice, or a **realistic ElevenLabs voice** with a key |
| AI brain (chat, understands your plans) | ✅ Working* | *Needs a free Claude API key — see step 3 |
| Memory ("remind me what I said yesterday") | ✅ Working | Stored on disk, fed back to the AI |
| Tasks & reminders + OS notifications | ✅ Working | Say/type "…tomorrow" to set a due date |
| Weather panel (current + 6-day) | ✅ Working | Free, no API key (Open-Meteo) |
| Offline music player | ✅ Working | Point it at your music folder |
| WhatsApp notifications | ✅ Working | Link via QR; new messages + unread counts, Jarvis announces them |
| File access | ✅ Working (API) | Main process can browse/open any folder |
| Computer control (agent) | ✅ Working | Jarvis opens apps/files/URLs, searches files & adds tasks on command |

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
- **ElevenLabs key + Voice** → for a realistic voice. Paste a key from
  elevenlabs.io (Profile → API key). Leave the Voice field on the default for
  "Rachel", or paste any voice ID from your ElevenLabs Voice Library. When a key
  is present Jarvis uses it automatically and the orb pulses to the real
  waveform; with no key it uses the free built-in voice.

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

### A. Realistic voice (ElevenLabs) — ✅ done
Add your ElevenLabs key in Settings and Jarvis speaks with a realistic voice
(low-latency `eleven_turbo_v2_5` model), with the orb pulsing to the real
waveform. Implemented in `main.js` (`voice:tts` handler), `src/voice.js`
(`playVoiceClip`) and `src/renderer.js` (`jarvisSpeak`), with automatic
fallback to the built-in voice when no key is set.

### B. Better wake word & offline speech
The browser speech engine needs internet and can be flaky. For a rock-solid,
offline wake word use **Porcupine** (`@picovoice/porcupine-node`) or
**openWakeWord**, and **whisper.cpp** / `nodejs-whisper` for offline
speech-to-text. This is where your **Python** install can help — Whisper runs
great in Python; Electron can talk to a small local Python script.

### C. WhatsApp notifications — ✅ done
Click **Connect WhatsApp** in the panel, scan the QR (WhatsApp → Linked
Devices → Link a device), and you're linked — the session is remembered so you
won't scan again. New messages appear in the panel with sender + preview, the
badge shows total unread, you get an OS notification, and Jarvis speaks a short
"New message from …" (throttled). Ask **"Jarvis, any messages?"** and it reads
your unread counts (they're fed into its context). Implemented in `whatsapp.js`
(whatsapp-web.js client), `main.js` (`whatsapp:*` handlers) and `src/renderer.js`.

> The WhatsApp packages (`whatsapp-web.js`, `qrcode`) are **optional** and large
> (they pull in a headless browser). `npm install` grabs them automatically; if
> that step fails, the rest of Jarvis still runs and the panel will tell you to
> run `npm install whatsapp-web.js qrcode` when you click Connect.

### D. YouTube / online music
Add a search box that uses the YouTube Data API (or `ytdl-core` to stream), and
route playback through the same `<audio>`/`<video>` element the offline player
uses.

### E. Deeper computer control — ✅ done
Jarvis is now an agent. Say things like *"Jarvis, open Spotify"*, *"open my
Downloads folder"*, *"find my resume"*, *"open youtube.com"* or *"remind me to
pay rent tomorrow"* and it does it. Implemented with Claude **tool use**: the
model picks from a set of safe tools (`open_app`, `open_path`, `open_url`,
`search_files`, `list_folder`, `add_task`, `remember`) that `main.js` executes,
looping until the task is done. Apps launch with argument arrays (no raw shell),
and there are no delete/exec tools, so it can't run arbitrary commands. To add a
new capability, add one entry to `TOOLS` and a `case` in `runTool()`.

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
