// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp bridge (main-process side).
// Uses whatsapp-web.js, which drives WhatsApp Web in a hidden browser. On first
// run it emits a QR code you scan with your phone (WhatsApp → Linked Devices).
// After that the session is remembered on disk (LocalAuth), so you won't scan
// again. We forward new-message and unread info up to the UI.
//
// whatsapp-web.js + puppeteer are heavy, so they're OPTIONAL dependencies and
// every require is guarded — the rest of Jarvis runs fine without them.
// ─────────────────────────────────────────────────────────────────────────────
let client = null;
let ready = false;

function available() {
  try { require.resolve('whatsapp-web.js'); return true; } catch (_) { return false; }
}

async function init({ dataPath, onQr, onReady, onMessage, onDisconnected }) {
  if (client) return { ok: true, already: true };
  let wweb, qrcode;
  try {
    wweb = require('whatsapp-web.js');
  } catch (_) {
    return { ok: false, error: 'not-installed' };
  }
  try { qrcode = require('qrcode'); } catch (_) { qrcode = null; }

  const { Client, LocalAuth } = wweb;
  client = new Client({
    authStrategy: new LocalAuth({ dataPath }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
  });

  client.on('qr', async (qr) => {
    let dataUrl = null;
    try { if (qrcode) dataUrl = await qrcode.toDataURL(qr, { margin: 1, width: 240 }); } catch (_) {}
    onQr(dataUrl);
  });

  client.on('ready', () => { ready = true; onReady(); });
  client.on('auth_failure', () => { ready = false; onDisconnected('auth-failure'); });
  client.on('disconnected', (reason) => { ready = false; onDisconnected(reason); });

  client.on('message', async (msg) => {
    try {
      if (msg.isStatus) return; // skip status/broadcast updates
      const contact = await msg.getContact();
      const chat = await msg.getChat();
      onMessage({
        from: contact.pushname || contact.name || contact.number || 'Unknown',
        body: msg.body || '[media]',
        isGroup: !!chat.isGroup,
        chatName: chat.name || '',
        at: Date.now(),
      });
    } catch (_) { /* ignore a single malformed message */ }
  });

  client.initialize();
  return { ok: true };
}

async function unreadSummary() {
  if (!client || !ready) return { total: 0, chats: [] };
  try {
    const chats = await client.getChats();
    const unread = chats
      .filter((c) => c.unreadCount > 0)
      .map((c) => ({ name: c.name || 'Unknown', count: c.unreadCount }))
      .sort((a, b) => b.count - a.count);
    return { total: unread.reduce((s, c) => s + c.count, 0), chats: unread };
  } catch (_) {
    return { total: 0, chats: [] };
  }
}

async function logout() {
  if (!client) return;
  try { await client.logout(); } catch (_) {}
  try { await client.destroy(); } catch (_) {}
  client = null;
  ready = false;
}

module.exports = { available, init, unreadSummary, logout, isReady: () => ready };
