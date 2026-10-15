import type { Message } from '../storage';

export interface StreamChatParams {
  messages: Message[];
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
  signal?: AbortSignal;
}

export interface AIProvider {
  streamChat(params: StreamChatParams): Promise<ReadableStream<string>>;
}

export function buildContextMessages(messages: Message[], maxChars = 320000): Message[] {
  // Keep most recent messages within token budget (~4 chars/token)
  let total = 0;
  const result: Message[] = [];
  const filtered = messages.filter((m) => m.role !== 'system');
  for (let i = filtered.length - 1; i >= 0; i--) {
    const est = (filtered[i].content || '').length;
    if (total + est > maxChars && result.length >= 2) break;
    total += est;
    result.unshift(filtered[i]);
  }
  return result;
}
