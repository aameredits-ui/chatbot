export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncate(text: string, maxLen: number): string {
  return text.length <= maxLen ? text : text.slice(0, maxLen) + '...';
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function groupChatsByDate(chats: { updatedAt: number; id: string }[]): Record<string, typeof chats> {
  const now = Date.now();
  const day = 86400000;
  const groups: Record<string, typeof chats> = { today: [], yesterday: [], week: [], older: [] };
  for (const chat of chats) {
    const diff = now - chat.updatedAt;
    if (diff < day) groups.today.push(chat);
    else if (diff < 2 * day) groups.yesterday.push(chat);
    else if (diff < 7 * day) groups.week.push(chat);
    else groups.older.push(chat);
  }
  return groups;
}
