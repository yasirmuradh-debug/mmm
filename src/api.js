// ─────────────────────────────────────────────────────────────────────────────
// Browser bridge — provides window.jarvis (the same API the UI expects), backed
// by the local Node server over fetch + Server-Sent Events. This is the web
// counterpart of the Electron preload. Loaded as a classic script BEFORE the
// renderer module so window.jarvis exists when the UI starts.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  const getJSON = (url) => fetch(url).then((r) => r.json());
  const postJSON = (url, body) => fetch(url, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}),
  }).then((r) => r.json());

  // Live events (WhatsApp + "play this on YouTube") via SSE.
  const waCallbacks = [];
  const ytCallbacks = [];
  try {
    const es = new EventSource('/api/events');
    es.onmessage = (e) => {
      let msg; try { msg = JSON.parse(e.data); } catch (_) { return; }
      if (msg.channel === 'whatsapp') waCallbacks.forEach((cb) => cb(msg));
      else if (msg.channel === 'yt') ytCallbacks.forEach((cb) => cb(msg));
    };
  } catch (_) { /* SSE unsupported — WhatsApp live updates just won't push */ }

  window.jarvis = {
    // Window chrome — no-ops in the browser (it's a normal tab)
    minimize() {}, maximize() {}, close() {},

    // Settings
    getSettings: () => getJSON('/api/settings'),
    setSettings: (next) => postJSON('/api/settings', next),

    // Tasks & memory
    listTasks: () => getJSON('/api/tasks'),
    saveTasks: (tasks) => postJSON('/api/tasks', tasks),
    getMemory: () => getJSON('/api/memory'),
    addMemory: (note) => postJSON('/api/memory', { note }),

    // Notifications → real OS notifications via the browser
    notify(title, body) {
      if (!('Notification' in window)) return;
      const show = () => new Notification(title || 'Jarvis', { body: body || '' });
      if (Notification.permission === 'granted') show();
      else if (Notification.permission !== 'denied') Notification.requestPermission().then((p) => p === 'granted' && show());
    },

    // Weather
    getWeather: ({ latitude, longitude }) => getJSON(`/api/weather?lat=${latitude}&lon=${longitude}`),

    // Files
    pickFolder: async () => {
      const p = window.prompt('Paste the full path to the folder (e.g. C:\\Users\\You\\Music):');
      return p && p.trim() ? p.trim() : null;
    },
    listFiles: (dir) => getJSON('/api/files/list' + (dir ? '?path=' + encodeURIComponent(dir) : '')),
    openFile: (p) => postJSON('/api/files/open', { path: p }),

    // Music
    scanMusic: (folder) => getJSON('/api/music/scan?folder=' + encodeURIComponent(folder)),
    // URL the <audio> element can actually play (streamed by the server)
    musicUrl: (p) => '/api/music/file?path=' + encodeURIComponent(p),

    // Assistant brain
    chat: (payload) => postJSON('/api/chat', payload),

    // Realistic voice
    tts: (text) => postJSON('/api/tts', { text }),

    // WhatsApp
    whatsappStatus: () => getJSON('/api/whatsapp/status'),
    whatsappConnect: () => postJSON('/api/whatsapp/connect'),
    whatsappUnread: () => getJSON('/api/whatsapp/unread'),
    whatsappLogout: () => postJSON('/api/whatsapp/logout'),
    onWhatsApp: (cb) => waCallbacks.push(cb),

    // YouTube
    ytSearch: (query) => getJSON('/api/youtube/search?q=' + encodeURIComponent(query)),
    onYtPlay: (cb) => ytCallbacks.push(cb),

    // Offline speech-to-text
    sttEnabled: () => getJSON('/api/stt/enabled').then((r) => r.enabled),
    transcribe: (buffer) => fetch('/api/stt/transcribe', {
      method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: buffer,
    }).then((r) => r.json()),
  };
})();
