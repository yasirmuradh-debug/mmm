// ─────────────────────────────────────────────────────────────────────────────
// Voice — speech-to-text (with a wake word), text-to-speech, and a live mic
// level meter that makes the orb react. Uses the browser Speech APIs built into
// Electron/Chromium, so there's nothing extra to install to get started.
//
// Upgrade path (see README): swap this for Whisper (offline STT), Porcupine /
// openWakeWord (reliable wake word) and ElevenLabs / Piper (realistic voice).
// ─────────────────────────────────────────────────────────────────────────────

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

// ── Live mic level → drives the orb ─────────────────────────────────────────
export async function createMicMeter(onLevel) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      onLevel(Math.min(1, sum / data.length / 90));
      requestAnimationFrame(tick);
    };
    tick();
    return true;
  } catch (e) {
    console.warn('Mic unavailable:', e.message);
    return false;
  }
}

// ── Speech recognition with wake word ───────────────────────────────────────
// Emits:
//   onWake()              — the wake word was heard
//   onCommand(text)       — a full utterance after waking / while active
//   onPartial(text)       — live partial transcript
export function createRecognizer({ wakeWord, onWake, onCommand, onPartial }) {
  if (!SR) {
    console.warn('SpeechRecognition not supported in this build.');
    return { start() {}, stop() {}, listenOnce() {}, supported: false };
  }

  const recog = new SR();
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = 'en-US';

  let active = false;      // true once woken, until a command completes
  let running = false;
  let manualOnce = false;

  recog.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }
    const partial = (final || interim).trim();
    if (partial) onPartial && onPartial(partial);

    const lower = partial.toLowerCase();
    if (!active && !manualOnce && wakeWord && lower.includes(wakeWord.toLowerCase())) {
      active = true;
      onWake && onWake();
      // strip the wake word so the rest counts as the command
      return;
    }

    if (final && (active || manualOnce)) {
      let cmd = final.trim();
      if (wakeWord) {
        const idx = cmd.toLowerCase().indexOf(wakeWord.toLowerCase());
        if (idx >= 0) cmd = cmd.slice(idx + wakeWord.length).trim();
      }
      if (cmd) onCommand && onCommand(cmd);
      active = false;
      manualOnce = false;
    }
  };

  recog.onend = () => {
    // Chromium stops periodically; restart to keep always-listening alive.
    if (running) {
      try { recog.start(); } catch (_) {}
    }
  };

  return {
    supported: true,
    start() { running = true; try { recog.start(); } catch (_) {} },
    stop() { running = false; try { recog.stop(); } catch (_) {} },
    // Push-to-talk: treat the next utterance as a command with no wake word.
    listenOnce() { manualOnce = true; active = true; try { recog.start(); } catch (_) {} },
  };
}

// ── Text to speech ──────────────────────────────────────────────────────────
export function speak(text, { voiceName, onStart, onEnd } = {}) {
  if (!('speechSynthesis' in window)) { onEnd && onEnd(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.02;
  u.pitch = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => voiceName && v.name === voiceName) ||
    voices.find((v) => /google|natural|premium/i.test(v.name)) || voices[0];
  if (preferred) u.voice = preferred;
  u.onstart = () => onStart && onStart();
  u.onend = () => onEnd && onEnd();
  window.speechSynthesis.speak(u);
}
