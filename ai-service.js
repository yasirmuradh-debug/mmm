// ─────────────────────────────────────────────────────────────────────────────
// AI service — a clean, provider-agnostic module for the assistant's brain.
//
// Default provider is the NVIDIA-hosted OpenAI GPT-OSS-120B model. Its API key
// is read ONLY from the environment (NVIDIA_API_KEY, typically via a local .env
// file) — never hardcoded, never sent to the browser. Groq is also available as
// an OpenAI-compatible free option; Gemini/Claude are handled in server.js.
//
// Exposes both a non-streaming call (with tool-calling) and a streaming call.
// Includes retry-with-backoff on transient (429 / 5xx / network) errors.
// ─────────────────────────────────────────────────────────────────────────────
try { require('dotenv').config(); } catch (_) { /* dotenv optional; real env vars still work */ }

const PROVIDERS = {
  nvidia: { label: 'NVIDIA GPT-OSS-120B', model: 'openai/gpt-oss-120b', url: 'https://integrate.api.nvidia.com/v1/chat/completions', openai: true, env: 'NVIDIA_API_KEY', setting: 'nvidiaApiKey' },
  groq:   { label: 'Groq Llama-3.3-70B',  model: 'llama-3.3-70b-versatile', url: 'https://api.groq.com/openai/v1/chat/completions', openai: true, setting: 'groqApiKey' },
  gemini: { label: 'Google Gemini 2.0 Flash', model: 'gemini-2.0-flash', openai: false, setting: 'geminiApiKey' },
  claude: { label: 'Anthropic Claude', model: 'claude-sonnet-5', openai: false, setting: 'claudeApiKey' },
};

// Where a provider's key comes from. NVIDIA accepts a key pasted in Settings
// (settings.nvidiaApiKey) OR the NVIDIA_API_KEY environment variable (.env) —
// the pasted key wins so the UI just works; the others come from Settings.
function keyForProvider(provider, settings) {
  const cfg = PROVIDERS[provider];
  if (!cfg) return null;
  const fromSetting = settings && cfg.setting && settings[cfg.setting];
  if (fromSetting) return fromSetting;
  if (cfg.env) return process.env[cfg.env] || null;
  return null;
}

// The model id to use for a provider (respects a user-chosen NVIDIA model).
function modelForProvider(provider, settings) {
  const cfg = PROVIDERS[provider] || {};
  if (provider === 'nvidia' && settings && settings.nvidiaModel) return settings.nvidiaModel;
  return cfg.model;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RETRIES = 2;

// Non-streaming OpenAI-compatible chat with tool-calling + retry.
async function chatOpenAICompatible({ url, model, apiKey, messages, system, openaiTools, runTool, temperature = 0.7, maxTokens = 1024, flags = {} }) {
  const convo = [{ role: 'system', content: system }, ...messages];
  for (let step = 0; step < 6; step++) {
    let data, res, lastErr;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages: convo, temperature, max_tokens: maxTokens, tools: openaiTools, tool_choice: 'auto' }),
        });
        if (res.status === 429 || res.status >= 500) { lastErr = new Error('HTTP ' + res.status); await sleep(400 * 2 ** attempt); continue; }
        data = await res.json();
        lastErr = null; break;
      } catch (e) { lastErr = e; await sleep(400 * 2 ** attempt); }
    }
    if (lastErr) return { ok: false, text: 'AI service unavailable: ' + lastErr.message };
    if (!res.ok) return { ok: false, text: 'AI error: ' + ((data.error && data.error.message) || res.status) };

    const msg = data.choices[0].message;
    if (msg.tool_calls && msg.tool_calls.length) {
      convo.push(msg);
      for (const tc of msg.tool_calls) {
        let args = {}; try { args = JSON.parse(tc.function.arguments || '{}'); } catch (_) {}
        convo.push({ role: 'tool', tool_call_id: tc.id, content: await runTool(tc.function.name, args, flags) });
      }
      continue;
    }
    return { ok: true, text: (msg.content || '').trim(), usage: data.usage || null };
  }
  return { ok: true, text: 'Done.' };
}

// Streaming OpenAI-compatible chat. Calls onDelta(chunk) as text arrives.
// (Tools are not used on the streaming path — kept simple for low latency.)
async function streamOpenAICompatible({ url, model, apiKey, messages, system, temperature = 0.7, maxTokens = 1024 }, onDelta) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, ...messages], temperature, max_tokens: maxTokens, stream: true, stream_options: { include_usage: true } }),
    });
  } catch (e) { return { ok: false, error: 'Network error: ' + e.message }; }
  if (!res.ok || !res.body) { let t = 'HTTP ' + res.status; try { t = (await res.json()).error?.message || t; } catch (_) {} return { ok: false, error: t }; }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', usage = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const s = line.trim();
      if (!s.startsWith('data:')) continue;
      const payload = s.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const j = JSON.parse(payload);
        const delta = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
        if (delta) onDelta(delta);
        if (j.usage) usage = j.usage;
      } catch (_) { /* ignore keep-alive / partial lines */ }
    }
  }
  return { ok: true, usage };
}

module.exports = { PROVIDERS, keyForProvider, modelForProvider, chatOpenAICompatible, streamOpenAICompatible };
