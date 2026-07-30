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
| Wake word ("Jarvis…") + voice commands | ✅ Working | Built-in engine, or **offline Whisper** (Python) for the mic button |
| Jarvis speaks back (text-to-speech) | ✅ Working | Built-in voice, or a **realistic ElevenLabs voice** with a key |
| AI brain (chat, understands your plans) | ✅ Working* | *Needs a free key (Groq or Gemini) — see step 3 |
| Memory ("remind me what I said yesterday") | ✅ Working | Stored on disk, fed back to the AI |
| Tasks & reminders + OS notifications | ✅ Working | Say/type "…tomorrow" to set a due date |
| Weather panel (current + 6-day) | ✅ Working | Free, no API key (Open-Meteo) |
| Offline music player | ✅ Working | Point it at your music folder |
| YouTube music (search + play) | ✅ Working | Search in the panel or say "Jarvis, play …" |
| WhatsApp notifications | ✅ Working | Link via QR; new messages + unread counts, Jarvis announces them |
| File access | ✅ Working (API) | Main process can browse/open any folder |
| Computer control (agent) | ✅ Working | Jarvis opens apps/files/URLs, searches files & adds tasks on command |

---

## 2. Run it

You need **Node.js** installed first (get it from https://nodejs.org — the
"LTS" button). That's the only requirement — Jarvis runs as a small local web
app in your browser, so there's nothing heavy to download.

### Easiest — one click
- **Windows:** double-click **`Start-Jarvis.bat`**
- **Mac/Linux:** double-click **`start-jarvis.command`** (first time you may
  need to right-click → Open, or run `chmod +x start-jarvis.command`)

It installs dependencies the first time, then opens Jarvis in your browser at
**http://localhost:4321**. Leave the little black window open while you use it
(closing it stops Jarvis). Allow **microphone** and **notification** access
when the browser asks.

### Or by hand
```bash
npm install
npm run web        # opens http://localhost:4321 in your browser
```

> **Why a browser, not a desktop window?** It runs entirely on your machine at
> `localhost` — a private Node server does all the file/voice/WhatsApp work; the
> browser just shows the interface. This avoids the large Electron download
> (which some Node setups block). An Electron desktop-window version is still in
> the repo (`npm start`) if you ever want it.

---

## 3. Turn on the brain — 100% free (2 minutes)

The orb, voice, weather, tasks and music all work with **zero** setup. To let
Jarvis actually *think* and hold a conversation, give it a **free** API key —
no credit card, no billing. Pick either one:

**Option A — Groq (recommended, free & fast)**
1. Go to **console.groq.com** → sign in (Google/GitHub) → **API Keys** →
   **Create API Key** → copy it (starts with `gsk_…`).
2. In Jarvis: **⚙ gear** → set **AI brain** to *Groq* → paste into
   **Groq API key** → **Save**.

**Option B — Google Gemini (free)**
1. Go to **aistudio.google.com** → sign in with Google → **Get API key** →
   **Create API key** → copy it (starts with `AIza…`).
2. In Jarvis: **⚙ gear** → set **AI brain** to *Google Gemini* → paste into
   **Gemini API key** → **Save**.

Both are free tiers with generous limits — plenty for personal use. Your key is
stored locally and only used to call that provider. Now try: say
**"Jarvis, what's the weather like?"** or type in the bar. (Claude is also
available in the dropdown, but it's paid — the two above are free.)

Optional in the same Settings panel:
- **City + latitude/longitude** → your local weather (find coords by Googling
  "my city latitude longitude").
- **Wake word** → change "jarvis" to anything.
- **Realistic voice (free):** Jarvis already speaks with the browser's built-in
  voice for free. For a more realistic one, ElevenLabs has a **free tier** — get
  a key at elevenlabs.io (Profile → API key), paste it into **ElevenLabs key**,
  and optionally set a **Voice** ID (default is "Rachel"). It's used only within
  the free monthly limit; leave it blank to stick with the free browser voice.

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

### B. Offline speech (Whisper) — ✅ done (optional)
Uses your **Python** install for private, no-internet speech-to-text. One-time
setup:

```bash
pip install -r python/requirements.txt
```

Then in Jarvis: ⚙ Settings → tick **Offline speech (Whisper)** → Save. Now the
🎙 mic button records what you say and transcribes it locally with
`faster-whisper` (default model `base.en`; the first use downloads it). If
Python isn't found, type your Python command (e.g. `python` or a full path) in
the Python field in Settings.

How it works: `python/whisper_server.py` is a tiny local server that Jarvis
starts automatically; `main.js` sends it audio clips and gets text back;
`src/voice.js` (`recordUtterance`) does the recording. It's fully optional — with
the toggle off, Jarvis uses the built-in browser voice and no Python is needed.

Still on the wish-list for later: a fully offline **wake word** (the "Jarvis"
trigger still uses the browser engine). Add **Porcupine**
(`@picovoice/porcupine-node`) or **openWakeWord** for that.

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

### D. YouTube / online music — ✅ done
Type in the **Search YouTube…** box in the Music panel to find songs/videos and
click a result to play it in the embedded player, or just say
*"Jarvis, play lofi hip hop"*. Search uses `yt-search` (no API key), playback
uses YouTube's official IFrame embed, and the same ⏮ ⏯ ⏭ controls drive both
YouTube and your offline files. Implemented in `main.js` (`youtube:search` +
`play_youtube` tool) and `src/renderer.js`. `yt-search` is an optional
dependency; the panel tells you to `npm install yt-search` if it's missing.

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
