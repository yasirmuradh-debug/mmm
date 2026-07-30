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

// ── Record one spoken utterance (for offline Whisper) ───────────────────────
// Records from the mic and stops automatically after a pause (or maxMs). Calls
// onLevel so the orb reacts, and resolves with the audio as an ArrayBuffer.
export async function recordUtterance({ maxMs = 7000, silenceMs = 1200, onLevel } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);

  return new Promise((resolve) => {
    const start = Date.now();
    let lastLoud = start;
    rec.start();

    const check = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const level = sum / data.length;
      onLevel && onLevel(Math.min(1, level / 90));
      if (level > 12) lastLoud = Date.now();
      const now = Date.now();
      // stop on a long enough pause after some speech, or at the hard cap
      if (now - start > maxMs || (now - start > 900 && now - lastLoud > silenceMs)) {
        if (rec.state !== 'inactive') rec.stop();
      } else {
        requestAnimationFrame(check);
      }
    };

    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      ctx.close();
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      resolve(await blob.arrayBuffer());
    };
    requestAnimationFrame(check);
  });
}

// ── Speech recognition with wake word ───────────────────────────────────────
// Emits:
//   onWake()              — the wake word was heard
//   onCommand(text)       — a full utterance after waking / while active
//   onPartial(text)       — live partial transcript
export function createRecognizer({ wakeWord, onWake, onCommand, onPartial, onError, onStart }) {
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
  let fatal = false;       // mic blocked etc. — stop trying to restart

  recog.onstart = () => onStart && onStart();
  recog.onerror = (e) => {
    // 'no-speech' and 'aborted' are normal during always-on listening — ignore.
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
      fatal = true;
      running = false;
    }
    if (e.error !== 'no-speech' && e.error !== 'aborted') onError && onError(e.error);
  };

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
    if (running && !fatal) {
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

// ── Realistic voice playback ────────────────────────────────────────────────
// Plays a base64 MP3 (from ElevenLabs via the main process) and reports the
// real, live amplitude so the orb pulses to the actual voice. Returns a promise
// that resolves when playback finishes.
let ttsCtx;
export function playVoiceClip(base64, { onLevel, onStart, onEnd } = {}) {
  return new Promise((resolve) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    ttsCtx = ttsCtx || new AudioContext();
    if (ttsCtx.state === 'suspended') ttsCtx.resume();
    const src = ttsCtx.createMediaElementSource(audio);
    const analyser = ttsCtx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    analyser.connect(ttsCtx.destination);
    const data = new Uint8Array(analyser.frequencyBinCount);

    let raf;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      onLevel && onLevel(Math.min(1, sum / data.length / 70));
      raf = requestAnimationFrame(tick);
    };

    const finish = () => {
      cancelAnimationFrame(raf);
      URL.revokeObjectURL(url);
      onEnd && onEnd();
      resolve();
    };

    audio.onplay = () => { onStart && onStart(); tick(); };
    audio.onended = finish;
    audio.onerror = finish;
    audio.play().catch(finish);
  });
}

// ── Text to speech (built-in browser voice — the free fallback) ──────────────
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
