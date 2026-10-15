import { create } from 'zustand';
import {
  type Chat,
  type Message,
  saveChat,
  loadChats as loadChatsDB,
  deleteChat as deleteChatDB,
  clearAllChats as clearAllChatsDB,
  generateId,
} from '../lib/storage';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  message: string;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  toasts: ToastMessage[];
  sidebarOpen: boolean;
  settingsOpen: boolean;
  loadChats: () => Promise<void>;
  createChat: () => Chat;
  setActiveChat: (id: string | null) => void;
  addMessage: (chatId: string, message: Message) => Promise<void>;
  updateMessage: (chatId: string, messageId: string, content: string, isStreaming?: boolean) => Promise<void>;
  updateMessageLike: (chatId: string, messageId: string, liked: boolean | null) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  renameChat: (id: string, title: string) => Promise<void>;
  pinChat: (id: string, pinned: boolean) => Promise<void>;
  clearAllChats: () => Promise<void>;
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  getActiveChat: () => Chat | null;
  truncateMessagesFromIndex: (chatId: string, fromIndex: number) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  isLoading: false,
  isStreaming: false,
  toasts: [],
  sidebarOpen: false,
  settingsOpen: false,

  loadChats: async () => {
    try {
      const chats = await loadChatsDB();
      set({ chats });
    } catch (e) {
      console.error('Failed to load chats:', e);
    }
  },

  createChat: () => {
    const chat: Chat = {
      id: generateId(),
      title: 'Yeni Söhbət',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
    };
    set((s) => ({ chats: [chat, ...s.chats], activeChatId: chat.id }));
    saveChat(chat).catch(console.error);
    return chat;
  },

  setActiveChat: (activeChatId) => set({ activeChatId }),

  addMessage: async (chatId, message) => {
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() } : c
      ),
    }));
    const chat = get().chats.find((c) => c.id === chatId);
    if (chat) await saveChat(chat);
  },

  updateMessage: async (chatId, messageId, content, isStreaming) => {
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, content, isStreaming: isStreaming ?? false } : m
              ),
              updatedAt: Date.now(),
            }
          : c
      ),
    }));
    const chat = get().chats.find((c) => c.id === chatId);
    if (chat && !isStreaming) await saveChat(chat);
  },

  updateMessageLike: async (chatId, messageId, liked) => {
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId
          ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, liked } : m)) }
          : c
      ),
    }));
    const chat = get().chats.find((c) => c.id === chatId);
    if (chat) await saveChat(chat);
  },

  deleteChat: async (id) => {
    await deleteChatDB(id);
    set((s) => {
      const chats = s.chats.filter((c) => c.id !== id);
      const activeChatId = s.activeChatId === id ? (chats[0]?.id ?? null) : s.activeChatId;
      return { chats, activeChatId };
    });
  },

  renameChat: async (id, title) => {
    set((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, title } : c)) }));
    const chat = get().chats.find((c) => c.id === id);
    if (chat) await saveChat({ ...chat, title });
  },

  pinChat: async (id, pinned) => {
    set((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, pinned } : c)) }));
    const chat = get().chats.find((c) => c.id === id);
    if (chat) await saveChat({ ...chat, pinned });
  },

  clearAllChats: async () => {
    await clearAllChatsDB();
    set({ chats: [], activeChatId: null });
  },

  setIsLoading: (isLoading) => set({ isLoading }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),

  addToast: (toast) => {
    const id = generateId();
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => get().removeToast(id), 4500);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

  getActiveChat: () => {
    const { chats, activeChatId } = get();
    return chats.find((c) => c.id === activeChatId) ?? null;
  },

  truncateMessagesFromIndex: async (chatId, fromIndex) => {
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId ? { ...c, messages: c.messages.slice(0, fromIndex), updatedAt: Date.now() } : c
      ),
    }));
    const chat = get().chats.find((c) => c.id === chatId);
    if (chat) await saveChat(chat);
  },
}));
