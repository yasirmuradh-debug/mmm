// ─────────────────────────────────────────────────────────────────────────────
// Jarvis — local web server (browser edition).
//
// Runs on your own machine with Node.js and serves the UI at http://localhost.
// This replaces Electron: the browser shows the interface, and this server does
// everything that needs Node/OS access (files, API keys, WhatsApp, Whisper).
// Only Node.js is required — no separate Electron binary to download.
// ─────────────────────────────────────────────────────────────────────────────
try { require('dotenv').config(); } catch (_) { /* dotenv optional */ }
const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ai = require('./ai-service');
const { spawn, exec } = require('child_process');
const whatsapp = require('./whatsapp');

const PORT = process.env.JARVIS_PORT || 4321;
const app = express();
app.use(express.json({ limit: '5mb' }));

// ── Tiny JSON storage (replaces electron-store) ─────────────────────────────
const DATA_FILE = path.join(__dirname, 'jarvis-data.json');
function loadData() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (_) { return {}; } }
function saveData(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }
const db = {
  get: (key, fb) => { const d = loadData(); return key in d ? d[key] : fb; },
  set: (key, val) => { const d = loadData(); d[key] = val; saveData(d); },
};

const DEFAULT_SETTINGS = {
  aiProvider: 'nvidia',         // 'nvidia' | 'groq' | 'gemini' | 'claude'
  temperature: 0.7, maxTokens: 1024,
  groqApiKey: '', geminiApiKey: '', claudeApiKey: '',
  elevenLabsApiKey: '', city: 'Brooklyn',
  latitude: 40.65, longitude: -73.95, wakeWord: 'jarvis',
  voiceName: '', voiceId: '21m00Tcm4TlvDq8ikWAM', musicFolder: '',
  offlineSpeech: false, whisperModel: 'base.en', pythonCmd: '',
};

// ── Server-Sent Events: push WhatsApp + play-music events to the browser ────
const clients = new Set();
app.get('/api/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  res.write(': connected\n\n');
  clients.add(res);
  req.on('close', () => clients.delete(res));
});
function broadcast(obj) {
  const line = `data: ${JSON.stringify(obj)}\n\n`;
  for (const c of clients) { try { c.write(line); } catch (_) {} }
}

// ── Settings ────────────────────────────────────────────────────────────────
app.get('/api/settings', (_req, res) => res.json({ ...DEFAULT_SETTINGS, ...db.get('settings', {}) }));
app.post('/api/settings', (req, res) => {
  const merged = { ...DEFAULT_SETTINGS, ...db.get('settings', {}), ...req.body };
  db.set('settings', merged);
  res.json(merged);
});

// ── Tasks & memory ──────────────────────────────────────────────────────────
app.get('/api/tasks', (_req, res) => res.json(db.get('tasks', [])));
app.post('/api/tasks', (req, res) => { db.set('tasks', req.body); res.json(req.body); });
app.get('/api/memory', (_req, res) => res.json(db.get('memory', [])));
app.post('/api/memory', (req, res) => {
  const memory = db.get('memory', []);
  memory.push({ text: req.body.note, at: new Date().toISOString() });
  db.set('memory', memory);
  res.json(memory);
});

// ── Weather (Open-Meteo, no key) ────────────────────────────────────────────
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`;
  try { const r = await fetch(url); res.json(await r.json()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Files ───────────────────────────────────────────────────────────────────
app.get('/api/files/list', (req, res) => {
  const target = req.query.path || os.homedir();
  try {
    const entries = fs.readdirSync(target, { withFileTypes: true });
    res.json({
      path: target, parent: path.dirname(target),
      items: entries.filter((e) => !e.name.startsWith('.'))
        .map((e) => ({ name: e.name, isDir: e.isDirectory(), path: path.join(target, e.name) }))
        .sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1)),
    });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.post('/api/files/open', (req, res) => { openPath(req.body.path); res.json({ ok: true }); });

// ── Music: scan a folder and stream local audio files ───────────────────────
const AUDIO_EXT = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
app.get('/api/music/scan', (req, res) => {
  const folder = req.query.folder;
  if (!folder || !fs.existsSync(folder)) return res.json([]);
  const tracks = [];
  const walk = (dir, depth = 0) => {
    if (depth > 3) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      else if (AUDIO_EXT.includes(path.extname(e.name).toLowerCase()))
        tracks.push({ name: path.basename(e.name, path.extname(e.name)), path: full });
    }
  };
  walk(folder);
  res.json(tracks.slice(0, 500));
});
app.get('/api/music/file', (req, res) => {
  const p = req.query.path;
  if (!p || !fs.existsSync(p)) return res.sendStatus(404);
  res.sendFile(path.resolve(p)); // supports range requests → seeking works
});

// ── YouTube search (yt-search; playback is the browser's embed) ─────────────
async function ytSearch(query) {
  let yts;
  try { yts = require('yt-search'); } catch (_) { return { ok: false, error: 'not-installed' }; }
  try {
    const r = await yts(query);
    return { ok: true, videos: (r.videos || []).slice(0, 12).map((v) => ({
      videoId: v.videoId, title: v.title, author: v.author ? v.author.name : '',
      duration: v.timestamp || '', thumbnail: v.thumbnail || '',
    })) };
  } catch (err) { return { ok: false, error: err.message }; }
}
app.get('/api/youtube/search', async (req, res) => res.json(await ytSearch(req.query.q || '')));

// ── WhatsApp ────────────────────────────────────────────────────────────────
app.get('/api/whatsapp/status', (_req, res) => res.json({ available: whatsapp.available(), ready: whatsapp.isReady() }));
app.post('/api/whatsapp/connect', async (_req, res) => {
  if (!whatsapp.available()) return res.json({ ok: false, error: 'not-installed' });
  const out = await whatsapp.init({
    dataPath: path.join(__dirname, 'wwebjs_auth'),
    onQr: (dataUrl) => broadcast({ channel: 'whatsapp', type: 'qr', dataUrl }),
    onReady: () => broadcast({ channel: 'whatsapp', type: 'ready' }),
    onDisconnected: (reason) => broadcast({ channel: 'whatsapp', type: 'disconnected', reason }),
    onMessage: (msg) => broadcast({ channel: 'whatsapp', type: 'message', msg }),
  });
  res.json(out);
});
app.get('/api/whatsapp/unread', async (_req, res) => res.json(await whatsapp.unreadSummary()));
app.post('/api/whatsapp/logout', async (_req, res) => { await whatsapp.logout(); res.json({ ok: true }); });

// ── Offline speech-to-text (Python Whisper sidecar) ─────────────────────────
const WHISPER_PORT = 8756;
let whisperProc = null;
function startWhisper() {
  if (whisperProc) return;
  const settings = db.get('settings', {});
  const py = settings.pythonCmd || (process.platform === 'win32' ? 'python' : 'python3');
  const script = path.join(__dirname, 'python', 'whisper_server.py');
  try {
    whisperProc = spawn(py, [script], {
      env: { ...process.env, JARVIS_WHISPER_PORT: String(WHISPER_PORT), JARVIS_WHISPER_MODEL: settings.whisperModel || 'base.en' },
    });
  } catch (err) { console.error('Whisper spawn failed:', err.message); return; }
  whisperProc.stdout.on('data', (d) => console.log('[whisper]', String(d).trim()));
  whisperProc.stderr.on('data', (d) => console.log('[whisper]', String(d).trim()));
  whisperProc.on('exit', () => { whisperProc = null; });
}
async function ensureWhisper() {
  startWhisper();
  if (!whisperProc) return false;
  for (let i = 0; i < 160; i++) {
    try { const r = await fetch(`http://127.0.0.1:${WHISPER_PORT}/health`); if (r.ok) return true; } catch (_) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}
app.get('/api/stt/enabled', (_req, res) => res.json({ enabled: !!db.get('settings', {}).offlineSpeech }));
app.post('/api/stt/transcribe', express.raw({ type: '*/*', limit: '25mb' }), async (req, res) => {
  const ok = await ensureWhisper();
  if (!ok) return res.json({ ok: false, error: 'whisper-unavailable' });
  try {
    const r = await fetch(`http://127.0.0.1:${WHISPER_PORT}/transcribe`, {
      method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: req.body,
    });
    const data = await r.json();
    res.json({ ok: true, text: (data.text || '').trim() });
  } catch (err) { res.json({ ok: false, error: err.message }); }
});

// ── Realistic voice (ElevenLabs) ────────────────────────────────────────────
app.post('/api/tts', async (req, res) => {
  const settings = db.get('settings', {});
  const apiKey = settings.elevenLabsApiKey;
  if (!apiKey) return res.json({ ok: false, reason: 'no-key' });
  const voiceId = settings.voiceId || '21m00Tcm4TlvDq8ikWAM';
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({ text: req.body.text, model_id: 'eleven_turbo_v2_5', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });
    if (!r.ok) { let m = r.status; try { m = (await r.json()).detail?.message || m; } catch (_) {} return res.json({ ok: false, reason: 'api-error', message: String(m) }); }
    const buf = Buffer.from(await r.arrayBuffer());
    res.json({ ok: true, audio: buf.toString('base64') });
  } catch (err) { res.json({ ok: false, reason: 'network', message: err.message }); }
});

// ── Computer-control tools + agentic chat (Claude) ──────────────────────────
const TOOLS = [
  { name: 'open_app', description: 'Open a desktop application by name, e.g. "Spotify", "Calculator".', input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'open_path', description: 'Open a file or folder in the default app / file manager. Absolute path.', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
  { name: 'open_url', description: 'Open a web page (https URL) in the default browser.', input_schema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
  { name: 'search_files', description: "Search the user's home directory for files whose name contains the query.", input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'list_folder', description: 'List a folder. Absolute path; omit for home.', input_schema: { type: 'object', properties: { path: { type: 'string' } } } },
  { name: 'add_task', description: 'Add a task/reminder. due is an optional date string.', input_schema: { type: 'object', properties: { text: { type: 'string' }, due: { type: 'string' } }, required: ['text'] } },
  { name: 'remember', description: 'Save a note to long-term memory.', input_schema: { type: 'object', properties: { note: { type: 'string' } }, required: ['note'] } },
  { name: 'play_youtube', description: 'Play music/video from YouTube by search terms.', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
];

function openPath(p) {
  if (process.platform === 'darwin') exec(`open "${p}"`);
  else if (process.platform === 'win32') exec(`start "" "${p}"`);
  else exec(`xdg-open "${p}"`);
}
function openApp(name) {
  if (process.platform === 'darwin') spawn('open', ['-a', name], { detached: true, stdio: 'ignore' }).unref();
  else if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', name], { detached: true, stdio: 'ignore' }).unref();
  else spawn('xdg-open', [name], { detached: true, stdio: 'ignore' }).unref();
}
function searchFiles(query) {
  const q = query.toLowerCase();
  const skip = new Set(['node_modules', 'Library', 'AppData', '.git', '.cache']);
  const found = [];
  let budget = 20000;
  const walk = (dir, depth) => {
    if (depth > 5 || budget <= 0 || found.length >= 20) return;
    let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    for (const e of entries) {
      if (budget-- <= 0 || found.length >= 20) return;
      if (e.name.startsWith('.') || skip.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.name.toLowerCase().includes(q)) found.push(full);
      if (e.isDirectory()) walk(full, depth + 1);
    }
  };
  walk(os.homedir(), 0);
  return found;
}
async function runTool(name, input, flags) {
  try {
    switch (name) {
      case 'open_app': openApp(input.name); return `Opened ${input.name}.`;
      case 'open_path': if (!fs.existsSync(input.path)) return `No such path: ${input.path}`; openPath(input.path); return `Opened ${input.path}.`;
      case 'open_url': { const url = /^https?:\/\//i.test(input.url) ? input.url : 'https://' + input.url; openPath(url); return `Opened ${url}.`; }
      case 'search_files': { const h = searchFiles(input.query); return h.length ? h.join('\n') : 'No matches found.'; }
      case 'list_folder': { const dir = input.path || os.homedir(); return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => !e.name.startsWith('.')).map((e) => e.isDirectory() ? e.name + '/' : e.name).slice(0, 100).join('\n') || '(empty)'; }
      case 'add_task': { const t = db.get('tasks', []); t.push({ text: input.text, done: false, due: input.due || '', notified: false }); db.set('tasks', t); flags.refresh = true; return `Task added: ${input.text}`; }
      case 'remember': { const m = db.get('memory', []); m.push({ text: input.note, at: new Date().toISOString() }); db.set('memory', m); return 'Noted.'; }
      case 'play_youtube': { const r = await ytSearch(input.query); if (!r.ok) return r.error === 'not-installed' ? 'YouTube needs: npm install yt-search' : 'Search failed: ' + r.error; if (!r.videos.length) return 'No results for ' + input.query; const top = r.videos[0]; broadcast({ channel: 'yt', videoId: top.videoId, title: top.title }); return `Now playing ${top.title}.`; }
      default: return `Unknown tool ${name}.`;
    }
  } catch (err) { return `Tool ${name} failed: ${err.message}`; }
}

// The same tools, expressed for each provider's API shape.
const OPENAI_TOOLS = TOOLS.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } }));
function toGeminiSchema(node) {
  const map = { object: 'OBJECT', string: 'STRING', number: 'NUMBER', integer: 'INTEGER', boolean: 'BOOLEAN', array: 'ARRAY' };
  const out = {};
  if (node.type) out.type = map[node.type] || node.type.toUpperCase();
  if (node.description) out.description = node.description;
  if (node.properties) { out.properties = {}; for (const k in node.properties) out.properties[k] = toGeminiSchema(node.properties[k]); }
  if (node.required) out.required = node.required;
  if (node.items) out.items = toGeminiSchema(node.items);
  return out;
}
const GEMINI_TOOLS = [{ functionDeclarations: TOOLS.map((t) => ({ name: t.name, description: t.description, parameters: toGeminiSchema(t.input_schema) })) }];

// System prompt + friendly "no key" helpers.
const SYS = (s) => (s || 'You are Jarvis, a concise, warm, witty desktop assistant.') +
  ' You can control the computer with the provided tools when asked to open, find, launch or note something. Use them, then reply briefly.';
function noKeyMsg(provider) {
  if (provider === 'nvidia') return { ok: false, text: 'NVIDIA key not found. Create a .env file next to server.js with  NVIDIA_API_KEY=your-key  (see .env.example) and restart Jarvis.' };
  const where = provider === 'groq' ? 'console.groq.com (free)' : provider === 'gemini' ? 'aistudio.google.com (free)' : 'console.anthropic.com';
  return { ok: false, text: `I need a key first. Open Settings (gear), get one at ${where}, paste it, and Save.` };
}

// NVIDIA + Groq (OpenAI-compatible) go through the AI service module.
function chatOpenAI(provider, apiKey, messages, system, flags, settings) {
  const cfg = ai.PROVIDERS[provider];
  return ai.chatOpenAICompatible({
    url: cfg.url, model: cfg.model, apiKey, messages, system,
    openaiTools: OPENAI_TOOLS, runTool,
    temperature: settings.temperature, maxTokens: settings.maxTokens, flags,
  });
}

// ── Google Gemini (free) ──
async function chatGemini(apiKey, messages, system, flags) {
  const contents = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: typeof m.content === 'string' ? m.content : '' }] }));
  for (let step = 0; step < 6; step++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, tools: GEMINI_TOOLS }),
    });
    const data = await r.json();
    if (!r.ok) return { ok: false, text: 'Gemini error: ' + (data.error?.message || r.status) };
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const calls = parts.filter((p) => p.functionCall);
    if (calls.length) {
      contents.push({ role: 'model', parts: calls.map((p) => ({ functionCall: p.functionCall })) });
      const responses = [];
      for (const p of calls) responses.push({ functionResponse: { name: p.functionCall.name, response: { result: await runTool(p.functionCall.name, p.functionCall.args || {}, flags) } } });
      contents.push({ role: 'user', parts: responses });
      continue;
    }
    return { ok: true, text: parts.filter((p) => p.text).map((p) => p.text).join('').trim() };
  }
  return { ok: true, text: 'Done.' };
}

// ── Anthropic Claude (paid, optional) ──
async function chatClaude(apiKey, messages, system, flags) {
  const convo = [...messages];
  for (let step = 0; step < 6; step++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 1024, system, tools: TOOLS, messages: convo }),
    });
    const data = await r.json();
    if (!r.ok) return { ok: false, text: 'Claude API error: ' + (data.error?.message || r.status) };
    if (data.stop_reason === 'tool_use') {
      convo.push({ role: 'assistant', content: data.content });
      const results = [];
      for (const b of data.content) if (b.type === 'tool_use') results.push({ type: 'tool_result', tool_use_id: b.id, content: await runTool(b.name, b.input || {}, flags) });
      convo.push({ role: 'user', content: results });
      continue;
    }
    return { ok: true, text: (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim() };
  }
  return { ok: true, text: 'Done.' };
}

app.post('/api/chat', async (req, res) => {
  const settings = db.get('settings', {});
  const provider = settings.aiProvider || 'nvidia';
  const flags = { refresh: false };
  const system = SYS(req.body.system);
  try {
    const key = ai.keyForProvider(provider, settings);
    if (!key) return res.json(noKeyMsg(provider));
    let result;
    if (provider === 'gemini') result = await chatGemini(key, req.body.messages, system, flags);
    else if (provider === 'claude') result = await chatClaude(key, req.body.messages, system, flags);
    else result = await chatOpenAI(provider, key, req.body.messages, system, flags, settings); // nvidia | groq
    res.json({ ...result, refresh: flags.refresh });
  } catch (err) { res.json({ ok: false, text: 'Could not reach the AI: ' + err.message }); }
});

// Streaming chat (used by the test page) — low-latency token-by-token via SSE.
app.post('/api/chat/stream', async (req, res) => {
  const settings = db.get('settings', {});
  const provider = settings.aiProvider || 'nvidia';
  const system = SYS(req.body.system);
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  const send = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);
  const t0 = Date.now();
  try {
    const cfg = ai.PROVIDERS[provider] || {};
    const key = ai.keyForProvider(provider, settings);
    if (!key) { send({ type: 'error', text: noKeyMsg(provider).text }); return res.end(); }
    send({ type: 'meta', provider, model: cfg.model || provider });
    if (cfg.openai) {
      const out = await ai.streamOpenAICompatible(
        { url: cfg.url, model: cfg.model, apiKey: key, messages: req.body.messages, system, temperature: settings.temperature, maxTokens: settings.maxTokens },
        (chunk) => send({ type: 'delta', text: chunk }),
      );
      if (!out.ok) send({ type: 'error', text: out.error });
      else send({ type: 'done', usage: out.usage || null, latencyMs: Date.now() - t0 });
    } else {
      // Gemini/Claude: no incremental stream here — compute then emit once.
      const result = provider === 'gemini'
        ? await chatGemini(key, req.body.messages, system, { refresh: false })
        : await chatClaude(key, req.body.messages, system, { refresh: false });
      if (result.ok) { send({ type: 'delta', text: result.text }); send({ type: 'done', latencyMs: Date.now() - t0 }); }
      else send({ type: 'error', text: result.text });
    }
  } catch (e) { send({ type: 'error', text: e.message }); }
  res.end();
});

// Status for the test page: which model, and whether its key is configured.
app.get('/api/status', (_q, res) => {
  const s = db.get('settings', {});
  const provider = s.aiProvider || 'nvidia';
  const cfg = ai.PROVIDERS[provider] || {};
  res.json({ ok: true, provider, model: cfg.model || provider, label: cfg.label || provider, hasKey: !!ai.keyForProvider(provider, s), temperature: s.temperature ?? 0.7, maxTokens: s.maxTokens ?? 1024 });
});

// ── Serve the UI ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'src')));

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n  Jarvis is running →  ${url}\n  (leave this window open; close it to stop Jarvis)\n`);
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
});

process.on('SIGINT', () => { if (whisperProc) whisperProc.kill(); process.exit(0); });
