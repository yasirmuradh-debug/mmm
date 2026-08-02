// ─────────────────────────────────────────────────────────────────────────────
// window.jarvis bridge — works in TWO modes, auto-detected:
//
//  • SERVER mode  (opened at http://localhost from `npm run web`):
//      talks to the local Node server → full features (files, WhatsApp,
//      offline music, Whisper, computer control, all AI providers).
//
//  • STANDALONE mode  (opened from the hosted GitHub Pages link):
//      a webpage is sandboxed, so it runs on its own — chat via free Google
//      Gemini (which allows browser calls), weather, tasks in the browser,
//      voice, and the orb. File/WhatsApp/computer-control need the local
//      version and degrade gracefully with a friendly note.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (isLocal) installServerBridge();
  else installStandaloneBridge();

  // ── SERVER mode: thin fetch wrappers over the local Node API ──────────────
  function installServerBridge() {
    const getJSON = (url) => fetch(url).then((r) => r.json());
    const postJSON = (url, body) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) }).then((r) => r.json());
    const waCbs = [], ytCbs = [];
    try {
      const es = new EventSource('/api/events');
      es.onmessage = (e) => {
        let m; try { m = JSON.parse(e.data); } catch (_) { return; }
        if (m.channel === 'whatsapp') waCbs.forEach((cb) => cb(m));
        else if (m.channel === 'yt') ytCbs.forEach((cb) => cb(m));
      };
    } catch (_) {}

    window.jarvis = {
      mode: 'server',
      minimize() {}, maximize() {}, close() {},
      getSettings: () => getJSON('/api/settings'),
      setSettings: (n) => postJSON('/api/settings', n),
      listTasks: () => getJSON('/api/tasks'),
      saveTasks: (t) => postJSON('/api/tasks', t),
      getMemory: () => getJSON('/api/memory'),
      addMemory: (note) => postJSON('/api/memory', { note }),
      notify: browserNotify,
      getWeather: ({ latitude, longitude }) => getJSON(`/api/weather?lat=${latitude}&lon=${longitude}`),
      pickFolder: async () => { const p = window.prompt('Paste the full path to the folder:'); return p && p.trim() ? p.trim() : null; },
      listFiles: (dir) => getJSON('/api/files/list' + (dir ? '?path=' + encodeURIComponent(dir) : '')),
      openFile: (p) => postJSON('/api/files/open', { path: p }),
      scanMusic: (folder) => getJSON('/api/music/scan?folder=' + encodeURIComponent(folder)),
      musicUrl: (p) => '/api/music/file?path=' + encodeURIComponent(p),
      chat: (payload) => postJSON('/api/chat', payload),
      tts: (text) => postJSON('/api/tts', { text }),
      whatsappStatus: () => getJSON('/api/whatsapp/status'),
      whatsappConnect: () => postJSON('/api/whatsapp/connect'),
      whatsappUnread: () => getJSON('/api/whatsapp/unread'),
      whatsappLogout: () => postJSON('/api/whatsapp/logout'),
      onWhatsApp: (cb) => waCbs.push(cb),
      ytSearch: (q) => getJSON('/api/youtube/search?q=' + encodeURIComponent(q)),
      onYtPlay: (cb) => ytCbs.push(cb),
      sttEnabled: () => getJSON('/api/stt/enabled').then((r) => r.enabled),
      transcribe: (buf) => fetch('/api/stt/transcribe', { method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: buf }).then((r) => r.json()),
    };
  }

  // ── STANDALONE mode: everything runs in the browser ───────────────────────
  function installStandaloneBridge() {
    const DEFAULTS = {
      aiProvider: 'gemini', geminiApiKey: '', groqApiKey: '', claudeApiKey: '',
      elevenLabsApiKey: '', city: 'Brooklyn', latitude: 40.65, longitude: -73.95,
      wakeWord: 'jarvis', voiceName: '', voiceId: '21m00Tcm4TlvDq8ikWAM',
      musicFolder: '', offlineSpeech: false,
    };
    const load = (k, fb) => { try { return JSON.parse(localStorage.getItem('jarvis:' + k)) ?? fb; } catch (_) { return fb; } };
    const save = (k, v) => localStorage.setItem('jarvis:' + k, JSON.stringify(v));
    const getSettings = () => ({ ...DEFAULTS, ...load('settings', {}) });

    async function chat(payload) {
      const s = getSettings();
      const provider = s.aiProvider || 'gemini';
      // In a plain webpage only Gemini reliably allows browser calls.
      if (provider !== 'gemini') {
        return { ok: false, text: 'The web version uses Google Gemini (free). Open Settings, set AI brain to “Google Gemini”, paste a free key from aistudio.google.com, and Save. (Groq/Claude only work in the local desktop version.)' };
      }
      if (!s.geminiApiKey) {
        return { ok: false, text: 'I need a free Gemini key. Open Settings (gear), set AI brain to “Google Gemini”, and paste a key from aistudio.google.com — it’s free, no card.' };
      }
      try {
        const contents = payload.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: typeof m.content === 'string' ? m.content : '' }] }));
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${s.geminiApiKey}`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: payload.system || '' }] }, contents }),
        });
        const data = await r.json();
        if (!r.ok) return { ok: false, text: 'Gemini error: ' + (data.error?.message || r.status) };
        const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
        return { ok: true, text: parts.filter((p) => p.text).map((p) => p.text).join('').trim() };
      } catch (e) { return { ok: false, text: 'Could not reach Gemini: ' + e.message }; }
    }

    async function tts(text) {
      const s = getSettings();
      if (!s.elevenLabsApiKey) return { ok: false, reason: 'no-key' };
      try {
        const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${s.voiceId || '21m00Tcm4TlvDq8ikWAM'}`, {
          method: 'POST', headers: { 'xi-api-key': s.elevenLabsApiKey, 'content-type': 'application/json', accept: 'audio/mpeg' },
          body: JSON.stringify({ text, model_id: 'eleven_turbo_v2_5', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
        });
        if (!r.ok) return { ok: false, reason: 'api-error', message: String(r.status) };
        const buf = new Uint8Array(await r.arrayBuffer());
        let bin = ''; for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        return { ok: true, audio: btoa(bin) };
      } catch (e) { return { ok: false, reason: 'network', message: e.message }; }
    }

    const notInstalled = () => ({ ok: false, error: 'web' });

    window.jarvis = {
      mode: 'standalone',
      minimize() {}, maximize() {}, close() {},
      getSettings: async () => getSettings(),
      setSettings: async (next) => { const merged = { ...getSettings(), ...next }; save('settings', merged); return merged; },
      listTasks: async () => load('tasks', []),
      saveTasks: async (t) => { save('tasks', t); return t; },
      getMemory: async () => load('memory', []),
      addMemory: async (note) => { const m = load('memory', []); m.push({ text: note, at: new Date().toISOString() }); save('memory', m); return m; },
      notify: browserNotify,
      getWeather: ({ latitude, longitude }) => fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`).then((r) => r.json()),
      // File / music library need the local desktop version.
      pickFolder: async () => { alert('Reading your music folder needs the local desktop version (a webpage can’t access your files). You can still search & play YouTube.'); return null; },
      listFiles: async () => ({ path: '', parent: '', items: [] }),
      openFile: async () => ({ ok: false }),
      scanMusic: async () => [],
      musicUrl: (p) => p,
      chat,
      tts,
      // WhatsApp needs the local desktop version.
      whatsappStatus: async () => ({ available: false, ready: false }),
      whatsappConnect: async () => ({ ok: false, error: 'web' }),
      whatsappUnread: async () => ({ total: 0, chats: [] }),
      whatsappLogout: async () => ({ ok: true }),
      onWhatsApp: () => {},
      // YouTube search needs the local version; playback still works if launched there.
      ytSearch: async () => notInstalled(),
      onYtPlay: () => {},
      sttEnabled: async () => false,
      transcribe: async () => ({ ok: false, error: 'web' }),
    };
  }

  // Shared: real OS notifications via the browser.
  function browserNotify(title, body) {
    if (!('Notification' in window)) return;
    const show = () => new Notification(title || 'Jarvis', { body: body || '' });
    if (Notification.permission === 'granted') show();
    else if (Notification.permission !== 'denied') Notification.requestPermission().then((p) => p === 'granted' && show());
  }
})();
