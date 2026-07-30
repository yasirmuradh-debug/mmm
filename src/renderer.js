// ─────────────────────────────────────────────────────────────────────────────
// Renderer — the app's brain in the UI. Wires the orb, voice, weather, tasks,
// music and chat together. Talks to Node/OS only through window.jarvis (preload).
// ─────────────────────────────────────────────────────────────────────────────
import { createOrb } from './orb.js';
import { createMicMeter, createRecognizer, speak } from './voice.js';

const $ = (id) => document.getElementById(id);
const J = window.jarvis;

let settings = {};
let orb;
let recognizer;
let speaking = false;
let conversation = []; // {role, content} for Claude

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

  await loadWeather();
  await loadTasks();
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

// ── Voice ─────────────────────────────────────────────────────────────────────
function startVoice() {
  // Mic meter drives the orb while we listen.
  createMicMeter((level) => { if (!speaking) orb.setLevel(level); });

  recognizer = createRecognizer({
    wakeWord: settings.wakeWord || 'jarvis',
    onWake: () => {
      orb.setState('listening');
      setStatus('Listening…', true);
    },
    onPartial: (text) => { /* could show live text */ },
    onCommand: (text) => {
      orb.setState('idle');
      handleUserInput(text);
    },
  });

  if (recognizer.supported) {
    recognizer.start();
  } else {
    setStatus('Voice not available in this build — type to chat.');
  }

  // Push-to-talk mic button
  $('btn-mic').onclick = () => {
    $('btn-mic').classList.add('listening');
    orb.setState('listening');
    setStatus('Listening…', true);
    recognizer.listenOnce();
    setTimeout(() => $('btn-mic').classList.remove('listening'), 4000);
  };
}

// Fake a speaking envelope so the orb pulses while Jarvis talks.
function speakingPulse() {
  if (!speaking) return;
  orb.setLevel(0.3 + Math.random() * 0.5);
  setTimeout(speakingPulse, 90);
}

function jarvisSpeak(text) {
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

  pushTranscript('jarvis', reply);
  jarvisSpeak(reply);

  // If the user stated a plan/reminder, quietly remember it.
  maybeRemember(text);
}

function buildSystemPrompt(tasks, memory) {
  const now = new Date();
  const taskLines = tasks.map((t) => `- ${t.text}${t.due ? ' (due ' + t.due + ')' : ''}${t.done ? ' [done]' : ''}`).join('\n') || '(none)';
  const memLines = memory.slice(-30).map((m) => `- ${m.text}`).join('\n') || '(none)';
  return [
    'You are Jarvis, a warm, witty, concise desktop assistant. Keep spoken replies to 1-3 sentences.',
    `Today is ${now.toDateString()}, local time ${now.toLocaleTimeString()}.`,
    'The user can add tasks and you should help track plans and remind them.',
    '\nCurrent tasks:\n' + taskLines,
    '\nThings the user told you to remember:\n' + memLines,
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

// ── Music ─────────────────────────────────────────────────────────────────────
let tracks = [];
let trackIndex = -1;
const audio = $('audio');
function wireMusic() {
  $('btn-music-folder').onclick = async () => {
    const folder = await J.pickFolder();
    if (!folder) return;
    await J.setSettings({ musicFolder: folder });
    tracks = await J.scanMusic(folder);
    renderTracks();
  };
  $('music-play').onclick = () => (audio.paused ? audio.play() : audio.pause());
  $('music-next').onclick = () => playTrack(trackIndex + 1);
  $('music-prev').onclick = () => playTrack(trackIndex - 1);
  audio.onplay = () => ($('music-play').textContent = '⏸');
  audio.onpause = () => ($('music-play').textContent = '▶');
  audio.onended = () => playTrack(trackIndex + 1);

  if (settings.musicFolder) {
    J.scanMusic(settings.musicFolder).then((t) => { tracks = t; renderTracks(); });
  }
}
function renderTracks() {
  $('music-list').innerHTML = tracks.map((t, i) =>
    `<li data-i="${i}" class="${i === trackIndex ? 'playing' : ''}">${escapeHtml(t.name)}</li>`).join('');
  $('music-list').querySelectorAll('li').forEach((li) => {
    li.onclick = () => playTrack(+li.dataset.i);
  });
}
function playTrack(i) {
  if (i < 0 || i >= tracks.length) return;
  trackIndex = i;
  audio.src = 'file://' + tracks[i].path;
  audio.play().catch(() => {});
  $('music-title').textContent = tracks[i].name;
  $('music-title').classList.remove('muted');
  renderTracks();
}

// ── Settings modal ────────────────────────────────────────────────────────────
function wireSettings() {
  const modal = $('settings-modal');
  $('btn-settings').onclick = () => {
    $('set-claude').value = settings.claudeApiKey || '';
    $('set-eleven').value = settings.elevenLabsApiKey || '';
    $('set-city').value = settings.city || '';
    $('set-lat').value = settings.latitude ?? '';
    $('set-lon').value = settings.longitude ?? '';
    $('set-wake').value = settings.wakeWord || 'jarvis';
    modal.classList.remove('hidden');
  };
  $('settings-close').onclick = () => modal.classList.add('hidden');
  $('settings-save').onclick = async () => {
    settings = await J.setSettings({
      claudeApiKey: $('set-claude').value.trim(),
      elevenLabsApiKey: $('set-eleven').value.trim(),
      city: $('set-city').value.trim(),
      latitude: parseFloat($('set-lat').value) || settings.latitude,
      longitude: parseFloat($('set-lon').value) || settings.longitude,
      wakeWord: $('set-wake').value.trim() || 'jarvis',
    });
    modal.classList.add('hidden');
    await loadWeather();
  };
}

// ── util ──────────────────────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
