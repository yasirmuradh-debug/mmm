// ─────────────────────────────────────────────────────────────────────────────
// Jarvis — Electron main process
// Runs with full Node.js access. The UI (renderer) talks to it through the
// small, safe bridge defined in preload.js. Keep secrets (API keys) here.
// ─────────────────────────────────────────────────────────────────────────────
const { app, BrowserWindow, ipcMain, Notification, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const whatsapp = require('./whatsapp');

// electron-store gives us a tiny JSON database on disk for tasks, memory & settings.
let Store;
try {
  Store = require('electron-store');
} catch (e) {
  console.warn('electron-store not installed yet — run `npm install`.');
}
const store = Store ? new Store({ name: 'jarvis-data' }) : null;

// Small helper so the rest of the file can read/write settings even if the
// store failed to load (keeps the app from crashing before `npm install`).
const db = {
  get: (key, fallback) => (store ? store.get(key, fallback) : fallback),
  set: (key, value) => (store && store.set(key, value)),
};

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#05060a',
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin' ? false : true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── Window controls (custom frameless title bar) ────────────────────────────
ipcMain.on('window:minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('window:maximize', () => {
  if (!mainWindow) return;
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.on('window:close', () => mainWindow && mainWindow.close());

// ── Settings ────────────────────────────────────────────────────────────────
ipcMain.handle('settings:get', () => db.get('settings', {
  claudeApiKey: '',
  elevenLabsApiKey: '',
  city: 'Brooklyn',
  latitude: 40.65,
  longitude: -73.95,
  wakeWord: 'jarvis',
  voiceName: '',
  voiceId: '21m00Tcm4TlvDq8ikWAM', // ElevenLabs "Rachel" — a sensible default
  musicFolder: '',
}));
ipcMain.handle('settings:set', (_e, next) => {
  const merged = { ...db.get('settings', {}), ...next };
  db.set('settings', merged);
  return merged;
});

// ── Tasks / reminders (persistent memory) ───────────────────────────────────
ipcMain.handle('tasks:list', () => db.get('tasks', []));
ipcMain.handle('tasks:save', (_e, tasks) => {
  db.set('tasks', tasks);
  return tasks;
});

// A lightweight long-term memory the assistant can read & append to.
ipcMain.handle('memory:get', () => db.get('memory', []));
ipcMain.handle('memory:add', (_e, note) => {
  const memory = db.get('memory', []);
  memory.push({ text: note, at: new Date().toISOString() });
  db.set('memory', memory);
  return memory;
});

// ── Native OS notification ──────────────────────────────────────────────────
ipcMain.on('notify', (_e, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title: title || 'Jarvis', body: body || '' }).show();
  }
});

// ── Weather (Open-Meteo — free, no API key required) ────────────────────────
ipcMain.handle('weather:get', async (_e, { latitude, longitude }) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
    `&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather request failed: ' + res.status);
  return res.json();
});

// ── File access (browse folders, open files) ────────────────────────────────
ipcMain.handle('files:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('files:list', async (_e, dirPath) => {
  const target = dirPath || os.homedir();
  const entries = fs.readdirSync(target, { withFileTypes: true });
  return {
    path: target,
    parent: path.dirname(target),
    items: entries
      .filter((e) => !e.name.startsWith('.'))
      .map((e) => ({
        name: e.name,
        isDir: e.isDirectory(),
        path: path.join(target, e.name),
      }))
      .sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1)),
  };
});

ipcMain.handle('files:open', async (_e, filePath) => {
  await shell.openPath(filePath);
  return true;
});

// ── Music: scan a folder for audio files ────────────────────────────────────
const AUDIO_EXT = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
ipcMain.handle('music:scan', async (_e, folder) => {
  if (!folder || !fs.existsSync(folder)) return [];
  const tracks = [];
  const walk = (dir, depth = 0) => {
    if (depth > 3) return; // don't recurse too deep
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      else if (AUDIO_EXT.includes(path.extname(e.name).toLowerCase())) {
        tracks.push({ name: path.basename(e.name, path.extname(e.name)), path: full });
      }
    }
  };
  walk(folder);
  return tracks.slice(0, 500);
});

// ── Assistant brain: proxy chat to the Claude API ───────────────────────────
// The API key stays in the main process and is never exposed to the web UI.
ipcMain.handle('assistant:chat', async (_e, { messages, system }) => {
  const settings = db.get('settings', {});
  const apiKey = settings.claudeApiKey;
  if (!apiKey) {
    return {
      ok: false,
      text: "I don't have a Claude API key yet. Open Settings (gear icon) and paste your key from console.anthropic.com to switch on my brain.",
    };
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: system || 'You are Jarvis, a concise, warm, witty desktop assistant.',
        messages,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, text: 'Claude API error: ' + (data.error?.message || res.status) };
    }
    const text = (data.content || []).map((c) => c.text).join('').trim();
    return { ok: true, text };
  } catch (err) {
    return { ok: false, text: 'Could not reach Claude: ' + err.message };
  }
});

// ── Realistic voice: ElevenLabs text-to-speech ──────────────────────────────
// Returns the spoken audio as base64 MP3 so the renderer can play it (and drive
// the orb from the real waveform). Falls back to the built-in browser voice in
// the UI when there's no key or this fails.
ipcMain.handle('voice:tts', async (_e, { text }) => {
  const settings = db.get('settings', {});
  const apiKey = settings.elevenLabsApiKey;
  if (!apiKey) return { ok: false, reason: 'no-key' };
  const voiceId = settings.voiceId || '21m00Tcm4TlvDq8ikWAM';
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'content-type': 'application/json',
        accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // low-latency model, good for an assistant
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!res.ok) {
      let msg = res.status;
      try { msg = (await res.json()).detail?.message || msg; } catch (_) {}
      return { ok: false, reason: 'api-error', message: String(msg) };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return { ok: true, audio: buf.toString('base64') };
  } catch (err) {
    return { ok: false, reason: 'network', message: err.message };
  }
});

// ── WhatsApp ────────────────────────────────────────────────────────────────
const sendToUI = (payload) => mainWindow && mainWindow.webContents.send('whatsapp:event', payload);

ipcMain.handle('whatsapp:connect', async () => {
  if (!whatsapp.available()) return { ok: false, error: 'not-installed' };
  return whatsapp.init({
    dataPath: path.join(app.getPath('userData'), 'wwebjs_auth'),
    onQr: (dataUrl) => sendToUI({ type: 'qr', dataUrl }),
    onReady: () => sendToUI({ type: 'ready' }),
    onDisconnected: (reason) => sendToUI({ type: 'disconnected', reason }),
    onMessage: (msg) => sendToUI({ type: 'message', msg }),
  });
});

ipcMain.handle('whatsapp:unread', () => whatsapp.unreadSummary());
ipcMain.handle('whatsapp:status', () => ({ available: whatsapp.available(), ready: whatsapp.isReady() }));
ipcMain.handle('whatsapp:logout', () => whatsapp.logout());
