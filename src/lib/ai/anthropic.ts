import type { AIProvider, StreamChatParams } from './provider';
import { buildContextMessages } from './provider';
import { parseSSEStream } from './stream';

export class AnthropicProvider implements AIProvider {
  async streamChat(params: StreamChatParams): Promise<ReadableStream<string>> {
    const { messages, model, systemPrompt, temperature, maxTokens, apiKey, signal } = params;
    const contextMessages = buildContextMessages(messages);

    type ContentPart = { type: string; [key: string]: unknown };
    const apiMessages = contextMessages.map((msg) => {
      if (msg.attachments && msg.attachments.length > 0) {
        const content: ContentPart[] = [];
        for (const att of msg.attachments) {
          if (att.type.startsWith('image/')) {
            const base64 = att.data.includes(',') ? att.data.split(',')[1] : att.data;
            content.push({ type: 'image', source: { type: 'base64', media_type: att.type, data: base64 } });
          } else {
            content.push({ type: 'text', text: `[File: ${att.name}]\n${att.data}` });
          }
        }
        if (msg.content) content.push({ type: 'text', text: msg.content });
        return { role: msg.role as 'user' | 'assistant', content };
      }
      return { role: msg.role as 'user' | 'assistant', content: msg.content };
    });

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key-override'] = apiKey;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        system: systemPrompt,
        messages: apiMessages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
        webhookUrl: apiKey?.startsWith('http') ? apiKey : undefined,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'API error' } })) as { error?: { message?: string } };
      const msg = error?.error?.message || 'API error';
      if (response.status === 401) throw new Error('INVALID_API_KEY: ' + msg);
      if (response.status === 429) throw new Error('RATE_LIMIT: ' + msg);
      throw new Error(msg);
    }

    const sseStream = parseSSEStream(response);
    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of sseStream) {
            try {
              const data = JSON.parse(chunk) as { type: string; delta?: { type: string; text?: string } };
              if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta' && data.delta.text) {
                controller.enqueue(data.delta.text);
              } else if (data.type === 'message_stop') {
                break;
              }
            } catch { /* ignore parse errors */ }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }
}
