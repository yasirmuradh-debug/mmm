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
});
