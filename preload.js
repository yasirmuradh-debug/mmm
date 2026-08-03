// ─────────────────────────────────────────────────────────────────────────────
// Preload — the ONLY doorway between the web UI and Node.js.
// We expose a small, named set of functions on window.jarvis. The UI can call
// these but cannot touch the file system, network, or your keys directly.
// ─────────────────────────────────────────────────────────────────────────────
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jarvis', {
  // Window chrome
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (next) => ipcRenderer.invoke('settings:set', next),

  // Tasks & memory
  listTasks: () => ipcRenderer.invoke('tasks:list'),
  saveTasks: (tasks) => ipcRenderer.invoke('tasks:save', tasks),
  getMemory: () => ipcRenderer.invoke('memory:get'),
  addMemory: (note) => ipcRenderer.invoke('memory:add', note),

  // Notifications
  notify: (title, body) => ipcRenderer.send('notify', { title, body }),

  // Weather
  getWeather: (coords) => ipcRenderer.invoke('weather:get', coords),

  // Files
  pickFolder: () => ipcRenderer.invoke('files:pickFolder'),
  listFiles: (dir) => ipcRenderer.invoke('files:list', dir),
  openFile: (p) => ipcRenderer.invoke('files:open', p),

  // Music
  scanMusic: (folder) => ipcRenderer.invoke('music:scan', folder),

  // Assistant brain
  chat: (payload) => ipcRenderer.invoke('assistant:chat', payload),

  // Realistic voice (ElevenLabs); returns base64 MP3 or a fallback signal
  tts: (text) => ipcRenderer.invoke('voice:tts', { text }),

  // WhatsApp
  whatsappStatus: () => ipcRenderer.invoke('whatsapp:status'),
  whatsappConnect: () => ipcRenderer.invoke('whatsapp:connect'),
  whatsappUnread: () => ipcRenderer.invoke('whatsapp:unread'),
  whatsappLogout: () => ipcRenderer.invoke('whatsapp:logout'),
  // Subscribe to live WhatsApp events (qr / ready / message / disconnected)
  onWhatsApp: (cb) => ipcRenderer.on('whatsapp:event', (_e, payload) => cb(payload)),

  // YouTube
  ytSearch: (query) => ipcRenderer.invoke('youtube:search', query),
  // Jarvis asked to play something by voice
  onYtPlay: (cb) => ipcRenderer.on('yt:play', (_e, data) => cb(data)),

  // Offline speech-to-text (Whisper)
  sttEnabled: () => ipcRenderer.invoke('stt:enabled'),
  transcribe: (buffer) => ipcRenderer.invoke('stt:transcribe', buffer),
});
