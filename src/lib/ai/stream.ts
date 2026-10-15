export async function* parseSSEStream(response: Response): AsyncGenerator<string> {
  if (!response.body) throw new Error('No response body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) yield trimmed.slice(6);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
