// ─────────────────────────────────────────────────────────────────────────────
// Renderer — the app's brain in the UI. Wires the orb, voice, weather, tasks,
// music and chat together. Talks to Node/OS only through window.jarvis (preload).
// ─────────────────────────────────────────────────────────────────────────────
import { createOrb } from './orb.js';
import { createMicMeter, createRecognizer, speak, playVoiceClip, recordUtterance } from './voice.js';

const $ = (id) => document.getElementById(id);
const J = window.jarvis;

let settings = {};
let orb;
let recognizer;
let speaking = false;
let conversation = []; // {role, content} for Claude
let waUnread = { total: 0, chats: [] }; // WhatsApp unread summary

// ── Boot ────────────────────────────────────────────────────────────────────
init();
async function init() {
  settings = await J.getSettings();
  orb = createOrb($('orb-canvas'));

  wireWindowControls();
  wireSettings();
  wireChat();
  wireTasks();
  wireMusic();
  wireWhatsApp();

  await loadWeather();
  await loadTasks();
  await refreshProviderStatus();
  startVoice();
  startReminderLoop();

  greet();
}

function greet() {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  setStatus(`Good ${part}. Say “${settings.wakeWord || 'Jarvis'}” to wake me.`);
}

// ── Window controls ──────────────────────────────────────────────────────────
function wireWindowControls() {
  $('btn-min').onclick = () => J.minimize();
  $('btn-max').onclick = () => J.maximize();
  $('btn-close').onclick = () => J.close();
}

// ── Status + transcript helpers ──────────────────────────────────────────────
function setStatus(text, active = false) {
  const el = $('status-line');
  el.textContent = text;
  el.classList.toggle('active', active);
}
function pushTranscript(who, text) {
  const t = $('transcript');
  const line = document.createElement('div');
  line.className = who === 'you' ? 'u' : 'j';
  line.textContent = (who === 'you' ? 'You: ' : 'Jarvis: ') + text;
  t.appendChild(line);
  t.scrollTop = t.scrollHeight;
  while (t.children.length > 12) t.removeChild(t.firstChild);
}

async function refreshProviderStatus() {
  const statusEl = $('chat-status');
  if (typeof J.getStatus !== 'function') {
    statusEl.textContent = 'Provider status unavailable in this mode.';
    return;
  }
  try {
    const status = await J.getStatus();
    if (!status.ok) {
      statusEl.textContent = 'Status check failed: ' + (status.error || 'unknown');
      return;
    }
    const parts = [
      status.label || status.provider || 'Provider',
      status.status ? `status: ${status.status}` : null,
      status.hasKey ? 'key set' : 'key missing',
      status.lastLatencyMs ? `${status.lastLatencyMs}ms` : null,
    ].filter(Boolean);
    statusEl.textContent = parts.join(' · ') || 'Ready.';
  } catch (err) {
    statusEl.textContent = 'Status check failed: ' + err.message;
  }
}

// ── Voice ─────────────────────────────────────────────────────────────────────
function startVoice() {
  // Mic meter drives the orb while we listen (also triggers the mic prompt).
  createMicMeter((level) => { if (!speaking) orb.setLevel(level); }).then((ok) => {
    if (!ok) setStatus('🎙 Microphone blocked. Click the camera/lock icon in the address bar → Allow → reload.');
  });

  recognizer = createRecognizer({
    wakeWord: settings.wakeWord || 'jarvis',
    onStart: () => setStatus(`Listening for “${settings.wakeWord || 'Jarvis'}”…`),
    onWake: () => {
      orb.setState('listening');
      setStatus('Yes? I\'m listening…', true);
    },
    onPartial: (text) => { /* could show live text */ },
    onCommand: (text) => {
      orb.setState('idle');
      handleUserInput(text);
    },
    onError: (err) => {
      if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture')
        setStatus('🎙 Microphone blocked. Click the camera/lock icon in the address bar → Allow → reload.');
      else if (err === 'network')
        setStatus('Voice needs an internet connection (the browser transcribes online).');
    },
  });

  if (recognizer.supported) {
    recognizer.start();
  } else {
    setStatus('Voice needs Chrome or Edge — open http://localhost:4321 there. You can still type below.');
  }

  // Push-to-talk mic button — offline Whisper if enabled, else browser engine.
  $('btn-mic').onclick = async () => {
    if (settings.offlineSpeech) return micWhisper();
    $('btn-mic').classList.add('listening');
    orb.setState('listening');
    setStatus('Listening…', true);
    recognizer.listenOnce();
    setTimeout(() => $('btn-mic').classList.remove('listening'), 4000);
  };
}

// Record a clip and transcribe it locally with Whisper.
async function micWhisper() {
  const btn = $('btn-mic');
  btn.classList.add('listening');
  orb.setState('listening');
  setStatus('Listening…', true);
  const buf = await recordUtterance({ onLevel: (l) => { if (!speaking) orb.setLevel(l); } });
  btn.classList.remove('listening');
  orb.setState('idle'); orb.setLevel(0);
  setStatus('Transcribing…', true);
  const res = await J.transcribe(buf);
  if (res.ok && res.text) {
    handleUserInput(res.text);
  } else if (res.error === 'whisper-unavailable') {
    setStatus('Whisper isn\'t running — check the Python setup (see README).');
  } else {
    setStatus('Didn\'t catch that — try again.');
  }
}

// Fake a speaking envelope so the orb pulses while Jarvis talks.
function speakingPulse() {
  if (!speaking) return;
  orb.setLevel(0.3 + Math.random() * 0.5);
  setTimeout(speakingPulse, 90);
}

async function jarvisSpeak(text) {
  // Prefer the realistic ElevenLabs voice when a key is set; the orb then
  // pulses to the real waveform. Fall back to the built-in voice otherwise.
  if (settings.elevenLabsApiKey) {
    const res = await J.tts(text);
    if (res.ok) {
      speaking = true;
      orb.setState('speaking');
      await playVoiceClip(res.audio, { onLevel: (l) => { if (speaking) orb.setLevel(l); } });
      speaking = false; orb.setState('idle'); orb.setLevel(0); setStatus('Ready.');
      return;
    }
    if (res.reason === 'api-error') setStatus('Voice error: ' + (res.message || '') + ' — using built-in voice.');
  }
  speak(text, {
    voiceName: settings.voiceName,
    onStart: () => { speaking = true; orb.setState('speaking'); speakingPulse(); },
    onEnd: () => { speaking = false; orb.setState('idle'); orb.setLevel(0); setStatus('Ready.'); },
  });
}

// ── The conversation loop ─────────────────────────────────────────────────────
function wireChat() {
  $('chat-form').onsubmit = (e) => {
    e.preventDefault();
    const val = $('chat-input').value.trim();
    if (!val) return;
    $('chat-input').value = '';
    handleUserInput(val);
  };
}

async function handleUserInput(text) {
  pushTranscript('you', text);
  setStatus('Thinking…', true);

  // Give Jarvis context: current tasks + saved memory + date, so it can answer
  // "what are my plans tomorrow" from what you told it earlier.
  const tasks = await J.listTasks();
  const memory = await J.getMemory();
  const system = buildSystemPrompt(tasks, memory);

  conversation.push({ role: 'user', content: text });
  const res = await J.chat({ messages: conversation.slice(-12), system });
  const reply = res.text || '…';
  conversation.push({ role: 'assistant', content: reply });

  if (res.refresh) loadTasks(); // Jarvis added a task/reminder via a tool

  pushTranscript('jarvis', reply);
  jarvisSpeak(reply);

  // If the user stated a plan/reminder, quietly remember it.
  maybeRemember(text);
}

function buildSystemPrompt(tasks, memory) {
  const now = new Date();
  const taskLines = tasks.map((t) => `- ${t.text}${t.due ? ' (due ' + t.due + ')' : ''}${t.done ? ' [done]' : ''}`).join('\n') || '(none)';
  const memLines = memory.slice(-30).map((m) => `- ${m.text}`).join('\n') || '(none)';
  const waLines = waUnread.total
    ? waUnread.chats.map((c) => `- ${c.name}: ${c.count} unread`).join('\n')
    : '(no unread messages)';
  return [
    'You are Jarvis, a warm, witty, concise desktop assistant. Keep spoken replies to 1-3 sentences.',
    `Today is ${now.toDateString()}, local time ${now.toLocaleTimeString()}.`,
    'The user can add tasks and you should help track plans and remind them.',
    '\nCurrent tasks:\n' + taskLines,
    '\nThings the user told you to remember:\n' + memLines,
    `\nUnread WhatsApp messages (total ${waUnread.total}):\n` + waLines,
  ].join('\n');
}

// Very simple heuristic memory: if the user says "remember" or states a plan.
function maybeRemember(text) {
  if (/\b(remember|note that|don'?t forget|i have to|i need to|tomorrow i|my plan)\b/i.test(text)) {
    J.addMemory(text);
  }
}

// ── Weather ───────────────────────────────────────────────────────────────────
const WEATHER = {
  0: ['Clear', '☀️'], 1: ['Mainly clear', '🌤'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫'], 48: ['Fog', '🌫'], 51: ['Drizzle', '🌦'], 53: ['Drizzle', '🌦'], 55: ['Drizzle', '🌧'],
  61: ['Rain', '🌧'], 63: ['Rain', '🌧'], 65: ['Heavy rain', '🌧'], 71: ['Snow', '🌨'], 73: ['Snow', '🌨'],
  75: ['Snow', '❄️'], 80: ['Showers', '🌦'], 81: ['Showers', '🌧'], 82: ['Showers', '⛈'],
  95: ['Thunderstorm', '⛈'], 96: ['Thunderstorm', '⛈'], 99: ['Thunderstorm', '⛈'],
};
async function loadWeather() {
  try {
    const data = await J.getWeather({ latitude: settings.latitude, longitude: settings.longitude });
    const c = data.current;
    const [desc, icon] = WEATHER[c.weather_code] || ['—', '🌡'];
    $('weather-city').textContent = settings.city || '';
    $('weather-temp').textContent = Math.round(c.temperature_2m) + '°';
    $('weather-desc').textContent = `${icon} ${desc}`;
    const d = data.daily;
    $('weather-sub').textContent = `H ${Math.round(d.temperature_2m_max[0])}° · L ${Math.round(d.temperature_2m_min[0])}°`;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    $('weather-forecast').innerHTML = d.time.slice(0, 6).map((t, i) => {
      const [, ic] = WEATHER[d.weather_code[i]] || ['', '🌡'];
      const label = days[new Date(t).getDay()];
      return `<div class="day">${label}<span class="ic">${ic}</span><b>${Math.round(d.temperature_2m_max[i])}°</b></div>`;
    }).join('');
  } catch (e) {
    $('weather-desc').textContent = 'Weather unavailable';
  }
}

// ── Tasks & reminders ─────────────────────────────────────────────────────────
let tasks = [];
async function loadTasks() {
  tasks = await J.listTasks();
  renderTasks();
}
function renderTasks() {
  $('task-count').textContent = tasks.filter((t) => !t.done).length + ' open';
  $('task-list').innerHTML = tasks.map((t, i) => `
    <li class="${t.done ? 'done' : ''}">
      <input type="checkbox" data-i="${i}" ${t.done ? 'checked' : ''} />
      <span>${escapeHtml(t.text)}${t.due ? ' · ' + t.due : ''}</span>
      <span class="del" data-del="${i}">✕</span>
    </li>`).join('');
  $('task-list').querySelectorAll('input[type=checkbox]').forEach((cb) => {
    cb.onchange = () => { tasks[cb.dataset.i].done = cb.checked; persistTasks(); };
  });
  $('task-list').querySelectorAll('.del').forEach((d) => {
    d.onclick = () => { tasks.splice(+d.dataset.del, 1); persistTasks(); };
  });
}
function wireTasks() {
  $('task-form').onsubmit = (e) => {
    e.preventDefault();
    const val = $('task-input').value.trim();
    if (!val) return;
    // crude natural due-date: "... tomorrow" / "... today"
    let due = '';
    if (/tomorrow/i.test(val)) due = new Date(Date.now() + 864e5).toLocaleDateString();
    else if (/today|tonight/i.test(val)) due = new Date().toLocaleDateString();
    tasks.push({ text: val, done: false, due, notified: false });
    $('task-input').value = '';
    persistTasks();
  };
}
async function persistTasks() {
  await J.saveTasks(tasks);
  renderTasks();
}

// Check every minute for due tasks and fire OS notifications.
function startReminderLoop() {
  setInterval(() => {
    const today = new Date().toLocaleDateString();
    tasks.forEach((t) => {
      if (!t.done && !t.notified && t.due === today) {
        t.notified = true;
        J.notify('Reminder', t.text);
        pushTranscript('jarvis', `Reminder: ${t.text}`);
      }
    });
    J.saveTasks(tasks);
  }, 60000);
}

// ── Music (offline files + YouTube) ─────────────────────────────────────────
let tracks = [];
let trackIndex = -1;
const audio = $('audio');

// YouTube state
let ytPlayer = null, ytReady = false, ytPlaying = false, apiReady = false;
let ytResults = [], ytIndex = -1, pendingYt = null;
let musicMode = 'offline'; // 'offline' | 'youtube'

function wireMusic() {
  // Offline folder
  $('btn-music-folder').onclick = async () => {
    const folder = await J.pickFolder();
    if (!folder) return;
    await J.setSettings({ musicFolder: folder });
    tracks = await J.scanMusic(folder);
    renderTracks();
  };

  // Transport controls branch by which source is active.
  $('music-play').onclick = () => {
    if (musicMode === 'youtube' && ytPlayer) {
      ytPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
    } else {
      audio.paused ? audio.play() : audio.pause();
    }
  };
  $('music-next').onclick = () => (musicMode === 'youtube' ? playYtIndex(ytIndex + 1) : playTrack(trackIndex + 1));
  $('music-prev').onclick = () => (musicMode === 'youtube' ? playYtIndex(ytIndex - 1) : playTrack(trackIndex - 1));

  audio.onplay = () => { if (musicMode === 'offline') $('music-play').textContent = '⏸'; };
  audio.onpause = () => { if (musicMode === 'offline') $('music-play').textContent = '▶'; };
  audio.onended = () => playTrack(trackIndex + 1);

  // YouTube search
  $('yt-form').onsubmit = async (e) => {
    e.preventDefault();
    const q = $('yt-input').value.trim();
    if (!q) return;
    setMusicTitle('Searching…', true);
    const r = await J.ytSearch(q);
    if (!r.ok) {
      setMusicTitle(r.error === 'web' ? 'YouTube search needs the desktop version' : r.error === 'not-installed' ? 'Run: npm install yt-search' : 'Search failed', true);
      return;
    }
    ytResults = r.videos; ytIndex = -1;
    renderYtResults();
    setMusicTitle(r.videos.length ? 'Pick a result ▸' : 'No results', true);
  };

  // Jarvis can start playback by voice ("play lofi hip hop").
  J.onYtPlay(({ videoId, title }) => {
    ytResults = [{ videoId, title }];
    ytIndex = 0;
    cueYouTube(videoId, title);
    renderYtResults();
  });

  loadYouTubeAPI();

  if (settings.musicFolder) {
    J.scanMusic(settings.musicFolder).then((t) => { tracks = t; renderTracks(); });
  }
}

function setMusicTitle(text, muted) {
  const el = $('music-title');
  el.textContent = text;
  el.classList.toggle('muted', !!muted);
}

// ── Offline files ────────────────────────────────────────────────────────────
function renderTracks() {
  $('music-list').innerHTML = tracks.map((t, i) =>
    `<li data-i="${i}" class="${musicMode === 'offline' && i === trackIndex ? 'playing' : ''}">${escapeHtml(t.name)}</li>`).join('');
  $('music-list').querySelectorAll('li').forEach((li) => {
    li.onclick = () => playTrack(+li.dataset.i);
  });
}
function playTrack(i) {
  if (i < 0 || i >= tracks.length) return;
  musicMode = 'offline';
  if (ytPlayer && ytReady) { try { ytPlayer.pauseVideo(); } catch (_) {} }
  const disc = $('disc'); if (disc) disc.classList.remove('spin');
  trackIndex = i;
  audio.src = J.musicUrl ? J.musicUrl(tracks[i].path) : 'file://' + tracks[i].path;
  audio.play().catch(() => {});
  setMusicTitle(tracks[i].name, false);
  renderTracks();
}

// ── YouTube ──────────────────────────────────────────────────────────────────
// The player is created LAZILY on the first play request, in a visible
// container. Creating it while its element is display:none (the old bug) breaks
// playback, so we never do that.
function loadYouTubeAPI() {
  window.onYouTubeIframeAPIReady = () => {
    apiReady = true;
    if (pendingYt) { const p = pendingYt; pendingYt = null; startVideo(p.videoId, p.title); }
  };
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}
function onYtState(e) {
  ytPlaying = e.data === YT.PlayerState.PLAYING;
  if (musicMode === 'youtube') $('music-play').textContent = ytPlaying ? '⏸' : '▶';
  const disc = $('disc');
  if (disc) disc.classList.toggle('spin', ytPlaying);
  if (e.data === YT.PlayerState.ENDED && musicMode === 'youtube') playYtIndex(ytIndex + 1);
}
function startVideo(videoId, title) {
  musicMode = 'youtube';
  audio.pause();
  setMusicTitle(title || 'Playing…', false);
  const stage = $('yt-stage'); if (stage) stage.classList.remove('hidden');
  const disc = $('disc');
  if (disc) { disc.style.backgroundImage = `url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg)`; disc.classList.add('show', 'spin'); }
  if (ytPlayer) {                       // player exists (or is being created)
    if (ytReady) ytPlayer.loadVideoById(videoId);
    else pendingYt = { videoId, title };
    return;
  }
  if (!apiReady) { pendingYt = { videoId, title }; return; } // API script still loading
  ytPlayer = new YT.Player('yt-player-inner', {
    height: '160', width: '100%', videoId,
    playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1, playsinline: 1 },
    events: {
      onReady: () => { ytReady = true; if (pendingYt) { const p = pendingYt; pendingYt = null; ytPlayer.loadVideoById(p.videoId); } },
      onStateChange: onYtState,
    },
  });
}
function renderYtResults() {
  $('music-list').innerHTML = ytResults.map((v, i) =>
    `<li data-i="${i}" class="${musicMode === 'youtube' && i === ytIndex ? 'playing' : ''}">${escapeHtml(v.title)}${v.duration ? ' · ' + v.duration : ''}</li>`).join('');
  $('music-list').querySelectorAll('li').forEach((li) => {
    li.onclick = () => playYtIndex(+li.dataset.i);
  });
}
function playYtIndex(i) {
  if (i < 0 || i >= ytResults.length) return;
  ytIndex = i;
  cueYouTube(ytResults[i].videoId, ytResults[i].title);
  renderYtResults();
}
function cueYouTube(videoId, title) {
  startVideo(videoId, title);
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────
let lastAnnounce = 0;
function wireWhatsApp() {
  const btn = $('btn-wa');
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = 'Connecting…';
    const res = await J.whatsappConnect();
    if (!res.ok) {
      btn.disabled = false;
      btn.textContent = 'Connect WhatsApp';
      addNotif(res.error === 'web'
        ? 'WhatsApp works in the local desktop version (run it on your PC with npm run web).'
        : res.error === 'not-installed'
          ? 'WhatsApp needs its packages. In the project run:  npm install whatsapp-web.js qrcode'
          : 'Could not start WhatsApp.');
    }
  };

  J.onWhatsApp((evt) => {
    if (evt.type === 'qr') {
      $('wa-connect').classList.add('hidden');
      $('wa-qr').classList.remove('hidden');
      if (evt.dataUrl) $('wa-qr-img').src = evt.dataUrl;
      setStatus('Scan the QR with WhatsApp to link.', true);
    } else if (evt.type === 'ready') {
      $('wa-qr').classList.add('hidden');
      $('wa-connect').classList.add('hidden');
      addNotif('WhatsApp connected.');
      setStatus('WhatsApp linked.');
      refreshWaUnread();
    } else if (evt.type === 'message') {
      onWhatsAppMessage(evt.msg);
    } else if (evt.type === 'disconnected') {
      $('wa-connect').classList.remove('hidden');
      $('wa-qr').classList.add('hidden');
      btn.disabled = false;
      btn.textContent = 'Connect WhatsApp';
      addNotif('WhatsApp disconnected.');
    }
  });
}

function onWhatsAppMessage(msg) {
  const label = msg.isGroup
    ? `<span class="grp">${escapeHtml(msg.chatName || 'Group')}</span> · ${escapeHtml(msg.from)}`
    : `<span class="from">${escapeHtml(msg.from)}</span>`;
  const li = document.createElement('li');
  li.innerHTML = `${label}: ${escapeHtml(truncate(msg.body, 60))}`;
  const list = $('notif-list');
  list.insertBefore(li, list.firstChild);
  while (list.children.length > 20) list.removeChild(list.lastChild);

  J.notify('WhatsApp · ' + msg.from, msg.body);
  refreshWaUnread();

  // Speak a short announcement, throttled so bursts don't spam you.
  const now = Date.now();
  if (now - lastAnnounce > 12000 && !speaking) {
    lastAnnounce = now;
    jarvisSpeak(`New message from ${msg.from}.`);
  }
}

async function refreshWaUnread() {
  waUnread = await J.whatsappUnread();
  $('notif-count').textContent = waUnread.total;
}

function addNotif(text) {
  const li = document.createElement('li');
  li.className = 'muted small';
  li.textContent = text;
  const list = $('notif-list');
  list.insertBefore(li, list.firstChild);
}

// ── Settings modal ────────────────────────────────────────────────────────────
function wireSettings() {
  const modal = $('settings-modal');
  const providerSelect = $('set-provider');
  const nvidiaPanel = $('nvidia-settings');
  const nvidiaKeyInput = $('set-nvidia');
  const nvidiaModelSelect = $('set-nvidia-model');
  const nvidiaStatus = $('nvidia-status');
  const validateBtn = $('btn-validate-nvidia');

  function updateNvidiaPanel() {
    nvidiaPanel.classList.toggle('hidden', providerSelect.value !== 'nvidia');
  }

  async function refreshNvidiaModels(selectedModel) {
    if (!settings.nvidiaApiKey) return;
    const res = await J.fetchNvidiaModels();
    if (res.ok && Array.isArray(res.models)) {
      nvidiaModelSelect.innerHTML = res.models.map((model) =>
        `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label || model.id)}</option>`
      ).join('');
      if (selectedModel) nvidiaModelSelect.value = selectedModel;
      nvidiaStatus.textContent = 'NVIDIA model list refreshed.';
    }
  }

  providerSelect.onchange = updateNvidiaPanel;
  validateBtn.onclick = async () => {
    const key = nvidiaKeyInput.value.trim();
    if (!key) {
      nvidiaStatus.textContent = 'Enter a NVIDIA API key before validating.';
      return;
    }
    nvidiaStatus.textContent = 'Validating NVIDIA key…';
    const res = await J.validateNvidiaKey(key);
    if (res.ok) {
      nvidiaStatus.textContent = `Valid NVIDIA key. ${res.models.length} models found.`;
      nvidiaModelSelect.innerHTML = res.models.map((model) =>
        `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label || model.id)}</option>`
      ).join('');
      if (res.models.length) nvidiaModelSelect.value = res.models[0].id;
      settings.nvidiaApiKey = key;
      settings.nvidiaModel = nvidiaModelSelect.value;
      refreshProviderStatus();
    } else {
      nvidiaStatus.textContent = 'Validation failed: ' + (res.error || 'unknown error');
    }
  };

  $('btn-settings').onclick = async () => {
    providerSelect.value = settings.aiProvider || 'groq';
    $('set-groq').value = settings.groqApiKey || '';
    $('set-gemini').value = settings.geminiApiKey || '';
    $('set-claude').value = settings.claudeApiKey || '';
    $('set-eleven').value = settings.elevenLabsApiKey || '';
    $('set-voiceid').value = settings.voiceId || '';
    $('set-city').value = settings.city || '';
    $('set-lat').value = settings.latitude ?? '';
    $('set-lon').value = settings.longitude ?? '';
    $('set-wake').value = settings.wakeWord || 'jarvis';
    $('set-offline').checked = !!settings.offlineSpeech;
    $('set-python').value = settings.pythonCmd || '';
    nvidiaKeyInput.value = '';
    nvidiaStatus.textContent = 'Leave blank to keep the saved NVIDIA key.';
    await refreshNvidiaModels(settings.nvidiaModel);
    updateNvidiaPanel();
    modal.classList.remove('hidden');
  };

  $('settings-close').onclick = () => modal.classList.add('hidden');
  $('settings-save').onclick = async () => {
    const next = {
      aiProvider: providerSelect.value,
      voiceId: $('set-voiceid').value.trim() || '21m00Tcm4TlvDq8ikWAM',
      city: $('set-city').value.trim(),
      latitude: parseFloat($('set-lat').value) || settings.latitude,
      longitude: parseFloat($('set-lon').value) || settings.longitude,
      wakeWord: $('set-wake').value.trim() || 'jarvis',
      offlineSpeech: $('set-offline').checked,
      pythonCmd: $('set-python').value.trim(),
      nvidiaModel: nvidiaModelSelect.value,
    };
    const groqKey = $('set-groq').value.trim(); if (groqKey) next.groqApiKey = groqKey;
    const geminiKey = $('set-gemini').value.trim(); if (geminiKey) next.geminiApiKey = geminiKey;
    const claudeKey = $('set-claude').value.trim(); if (claudeKey) next.claudeApiKey = claudeKey;
    const elevenKey = $('set-eleven').value.trim(); if (elevenKey) next.elevenLabsApiKey = elevenKey;
    const nvidiaKey = nvidiaKeyInput.value.trim(); if (nvidiaKey) next.nvidiaApiKey = nvidiaKey;

    settings = await J.setSettings(next);
    modal.classList.add('hidden');
    await loadWeather();
    refreshProviderStatus();
  };

  $('btn-regenerate').onclick = () => setStatus('Regenerate will be available soon.');
  $('btn-stop').onclick = () => setStatus('Stop is not implemented yet.');
  $('btn-export').onclick = () => setStatus('Export is not available in this version.');
  $('chat-search-clear').onclick = () => {
    $('chat-search').value = '';
    setStatus('Search cleared.');
  };
}

// ── util ──────────────────────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function truncate(s, n) {
  s = String(s);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
