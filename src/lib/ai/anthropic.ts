import type { AIProvider, StreamChatParams } from './provider';
import { buildContextMessages } from './provider';

const DEFAULT_WEBHOOK_URL = 'https://pervizs.app.n8n.cloud/webhook/chatbot';

export class AnthropicProvider implements AIProvider {
  async streamChat(params: StreamChatParams): Promise<ReadableStream<string>> {
    const { messages, signal } = params;
    const contextMessages = buildContextMessages(messages);

    // Get the latest user message
    const lastUserMsg = [...contextMessages].reverse().find((m) => m.role === 'user');
    let userText = '';
    if (typeof lastUserMsg?.content === 'string') {
      userText = lastUserMsg.content;
    }

    // Attachments text if any
    if (lastUserMsg?.attachments && lastUserMsg.attachments.length > 0) {
      const attText = lastUserMsg.attachments
        .map((a) => (a.type.startsWith('image/') ? `[Görsəl: ${a.name}]` : `[Fayl: ${a.name}]\n${a.data}`))
        .join('\n');
      userText = (userText ? userText + '\n' : '') + attText;
    }

    // Read webhook url from VITE_N8N_WEBHOOK_URL env variable or settings or default
    const webhookUrl =
      (import.meta.env.VITE_N8N_WEBHOOK_URL as string) ||
      (params.apiKey?.startsWith('http') ? params.apiKey : undefined) ||
      DEFAULT_WEBHOOK_URL;

    // Send formatted JSON to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userText,
        chatInput: userText,
        text: userText,
        sessionId: 'session-' + (messages[0]?.id || Date.now()),
        history: contextMessages.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Webhook error');
      throw new Error(`n8n webhook xətası (${response.status}): ${errText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let replyText = '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      replyText =
        data.reply ||
        data.output ||
        data.text ||
        data.message ||
        data.response ||
        (typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      replyText = await response.text();
    }

    if (!replyText) {
      replyText = 'Cavab alına bilmədi.';
    }

    // Stream word-by-word with natural typing speed
    const chunks = replyText.match(/(\S+|\s+)/g) || [replyText];

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for (const chunk of chunks) {
            if (signal?.aborted) break;
            controller.enqueue(chunk);
            await new Promise((resolve) => setTimeout(resolve, 18));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }
}
