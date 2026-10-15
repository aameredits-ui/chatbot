import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const envPath = join(__dirname, '..', '.env');
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim();
      if (key && !process.env[key]) process.env[key] = val;
    }
  }
} catch { /* .env not found */ }

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

const requests = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const recent = (requests.get(ip) || []).filter((t) => now - t < 60000);
  if (recent.length >= 60) return res.status(429).json({ error: { message: 'Sorğu limiti aşıldı. Zəhmət olmasa bir dəqiqə sonra yenidən cəhd edin.' } });
  recent.push(now);
  requests.set(ip, recent);
  next();
}

const DEFAULT_N8N_URL = 'https://pervizs.app.n8n.cloud/webhook/chatbot';

async function handleN8nChat(req, res, userText, messages, webhookUrl) {
  try {
    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        chatInput: userText,
        text: userText,
        sessionId: req.body.sessionId || 'session-' + Date.now(),
        history: messages,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => 'n8n error');
      return res.status(upstream.status).json({ error: { message: 'n8n webhook xətası: ' + errText } });
    }

    const contentType = upstream.headers.get('content-type') || '';
    let fullText = '';
    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      fullText = data.reply || data.output || data.text || data.message || data.response || (typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      fullText = await upstream.text();
    }

    if (!fullText) fullText = 'Cavab alına bilmədi.';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Stream word-by-word with natural typing speed
    const chunks = fullText.match(/(\S+|\s+)/g) || [fullText];
    for (const chunk of chunks) {
      if (res.writableEnded) break;
      const sseEvent = JSON.stringify({
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: chunk },
      });
      res.write(`data: ${sseEvent}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    if (!res.writableEnded) {
      res.write('data: {"type":"message_stop"}\n\n');
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (err) {
    console.error('[n8n error]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: { message: 'n8n xətası: ' + err.message } });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
}

app.post('/api/chat', rateLimit, async (req, res) => {
  const { model, system, messages, temperature, max_tokens, webhookUrl } = req.body;
  const apiKey = req.headers['x-api-key-override'] || process.env.ANTHROPIC_API_KEY || '';

  // Extract latest user message
  const lastUserMessage = [...(messages || [])].reverse().find((m) => m.role === 'user');
  let userText = '';
  if (typeof lastUserMessage?.content === 'string') {
    userText = lastUserMessage.content;
  } else if (Array.isArray(lastUserMessage?.content)) {
    userText = lastUserMessage.content.map((c) => c.text || '').filter(Boolean).join('\n');
  }

  const activeWebhook = webhookUrl || process.env.N8N_WEBHOOK_URL || DEFAULT_N8N_URL;

  // Always route to n8n Webhook
  return handleN8nChat(req, res, userText, messages, activeWebhook);
});

app.get('/api/test', (_req, res) => res.json({ ok: true, provider: 'n8n' }));

app.post('/api/test', async (req, res) => {
  const { apiKey, model, webhookUrl } = req.body || {};
  const activeWebhook = webhookUrl || process.env.N8N_WEBHOOK_URL || DEFAULT_N8N_URL;

  if (model && model.startsWith('claude') && apiKey) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-3-haiku-20240307', messages: [{ role: 'user', content: 'hi' }], max_tokens: 5 }),
      });
      return res.json({ ok: r.ok, provider: 'claude' });
    } catch (e) {
      return res.status(500).json({ ok: false, message: e.message });
    }
  }

  // Test n8n webhook
  try {
    const r = await fetch(activeWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test' }),
    });
    res.json({ ok: r.ok, provider: 'n8n' });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => console.log(`\n✅ Proxy server: http://localhost:${PORT} (n8n Webhook: ${DEFAULT_N8N_URL})\n`));
