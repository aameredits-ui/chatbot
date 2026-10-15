import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
  preview?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  liked?: boolean | null;
  isStreaming?: boolean;
}

export type ChatMode = 'chat' | 'creative' | 'code' | 'research';

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  mode?: ChatMode;
}

interface ChatDB extends DBSchema {
  chats: {
    key: string;
    value: Chat;
    indexes: { 'by-updatedAt': number };
  };
}

let db: IDBPDatabase<ChatDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ChatDB>> {
  if (!db) {
    db = await openDB<ChatDB>('ai-chat-db', 1, {
      upgrade(database) {
        const store = database.createObjectStore('chats', { keyPath: 'id' });
        store.createIndex('by-updatedAt', 'updatedAt');
      },
    });
  }
  return db;
}

export async function saveChat(chat: Chat): Promise<void> {
  const database = await getDB();
  await database.put('chats', chat);
}

export async function loadChats(): Promise<Chat[]> {
  const database = await getDB();
  const chats = await database.getAll('chats');
  return chats.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });
}

export async function deleteChat(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('chats', id);
}

export async function clearAllChats(): Promise<void> {
  const database = await getDB();
  await database.clear('chats');
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function exportChatAsMarkdown(chat: Chat): string {
  const lines: string[] = [`# ${chat.title}\n`, `> Created: ${new Date(chat.createdAt).toLocaleString()}\n\n`];
  for (const msg of chat.messages) {
    if (msg.role === 'system') continue;
    lines.push(`## ${msg.role === 'user' ? '👤 User' : '🤖 Assistant'}\n\n`);
    lines.push(msg.content + '\n\n');
  }
  return lines.join('');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
