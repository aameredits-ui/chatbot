import { useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { Welcome } from './components/Welcome';
import { MessageList } from './components/MessageList';
import { Composer } from './components/Composer';
import { Sidebar } from './components/Sidebar';
import { SettingsSheet } from './components/SettingsSheet';
import { ToastContainer } from './components/Toast';
import { useChatStore } from './store/chatStore';
import { useSettingsStore } from './store/settingsStore';
import { useHotkeys } from './hooks/useHotkeys';
import { AnthropicProvider } from './lib/ai/anthropic';
import { generateId, type Attachment, type Message } from './lib/storage';
import { translations } from './lib/i18n';

const provider = new AnthropicProvider();

export default function App() {
  const {
    chats, activeChatId, isStreaming, isLoading,
    loadChats, createChat, setActiveChat, addMessage, updateMessage,
    setIsLoading, setIsStreaming, addToast, setSidebarOpen, setSettingsOpen,
    truncateMessagesFromIndex, getActiveChat, renameChat,
  } = useChatStore();
  const settings = useSettingsStore();
  const abortRef = useRef<AbortController | null>(null);
  const t = translations[settings.language];

  useEffect(() => { loadChats(); }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    let theme = settings.theme;
    if (theme === 'system') theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.toggle('light', theme === 'light');
  }, [settings.theme]);

  // Apply font size
  useEffect(() => {
    document.documentElement.style.fontSize = { sm: '14px', md: '16px', lg: '18px' }[settings.fontSize];
  }, [settings.fontSize]);

  const handleNewChat = useCallback(() => {
    const chat = createChat();
    setActiveChat(chat.id);
  }, [createChat, setActiveChat]);

  useHotkeys([
    { key: 'k', ctrl: true, handler: () => setSidebarOpen(true) },
    { key: 'O', ctrl: true, shift: true, handler: handleNewChat },
    { key: 'Escape', handler: () => { setSidebarOpen(false); setSettingsOpen(false); } },
  ]);

  const activeChat = getActiveChat();

  const generateTitle = useCallback(async (chatId: string, firstMsg: string) => {
    try {
      const clean = firstMsg.trim().replace(/^["'\s]+|["'\s]+$/g, '');
      const words = clean.split(/\s+/).slice(0, 5).join(' ');
      await renameChat(chatId, (words || firstMsg).slice(0, 45));
    } catch {
      await renameChat(chatId, firstMsg.slice(0, 35));
    }
  }, [renameChat]);

  const handleSend = useCallback(async (content: string, attachments: Attachment[]) => {
    let chatId = activeChatId;
    if (!chatId || !chats.find((c) => c.id === chatId)) {
      const chat = createChat();
      chatId = chat.id;
    }

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    const userMsg: Message = { id: generateId(), role: 'user', content, attachments: attachments.length ? attachments : undefined, timestamp: Date.now() };
    await addMessage(chatId!, userMsg);
    setIsLoading(true);

    const asstId = generateId();
    const asstMsg: Message = { id: asstId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true };
    await addMessage(chatId!, asstMsg);

    try {
      const currentChat = useChatStore.getState().chats.find((c) => c.id === chatId!)!;
      const messagesForApi = currentChat.messages.filter((m) => m.id !== asstId);
      const stream = await provider.streamChat({
        messages: messagesForApi, model: settings.model, systemPrompt: settings.systemPrompt,
        temperature: settings.temperature, maxTokens: settings.maxTokens, apiKey: settings.apiKey || undefined, signal: abort.signal,
      });

      setIsStreaming(true); setIsLoading(false);
      const reader = stream.getReader();
      let accumulated = '';
      let lastSave = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += value;
        if (Date.now() - lastSave > 40) {
          await updateMessage(chatId!, asstId, accumulated, true);
          lastSave = Date.now();
        }
      }
      await updateMessage(chatId!, asstId, accumulated, false);

      const updatedChat = useChatStore.getState().chats.find((c) => c.id === chatId!);
      if ((updatedChat?.title === 'New Chat' || updatedChat?.title === 'Yeni Söhbət') && content) generateTitle(chatId!, content);
    } catch (e: unknown) {
      if (abort.signal.aborted) return;
      const msg = (e as Error)?.message ?? '';
      if (msg.includes('INVALID_API_KEY')) addToast({ type: 'error', message: t.errorApiKey });
      else if (msg.includes('RATE_LIMIT')) addToast({ type: 'error', message: t.errorRateLimit });
      else addToast({ type: 'error', message: t.errorNetwork });
      const msgs = useChatStore.getState().chats.find((c) => c.id === chatId!)?.messages ?? [];
      const idx = msgs.findIndex((m) => m.id === asstId);
      if (idx !== -1) await truncateMessagesFromIndex(chatId!, idx);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [activeChatId, chats, createChat, addMessage, updateMessage, setIsLoading, setIsStreaming, addToast, settings, truncateMessagesFromIndex, generateTitle, t]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setIsLoading(false);
  }, [setIsStreaming, setIsLoading]);

  const handleRegenerate = useCallback(async () => {
    if (!activeChat) return;
    const msgs = activeChat.messages.filter((m) => m.role !== 'system');
    const lastUser = [...msgs].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    const idx = activeChat.messages.findIndex((m) => m.id === lastUser.id);
    await truncateMessagesFromIndex(activeChat.id, idx);
    await handleSend(lastUser.content, lastUser.attachments ?? []);
  }, [activeChat, truncateMessagesFromIndex, handleSend]);

  const handleEditSend = useCallback(async (messageId: string, newContent: string) => {
    if (!activeChat) return;
    const idx = activeChat.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    await truncateMessagesFromIndex(activeChat.id, idx);
    await handleSend(newContent, []);
  }, [activeChat, truncateMessagesFromIndex, handleSend]);

  const hasMessages = activeChat && activeChat.messages.filter((m) => m.role !== 'system').length > 0;

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar onNewChat={handleNewChat} />
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Header />
        <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {!hasMessages ? (
              <motion.div key="welcome" className="flex-1 flex flex-col min-h-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}>
                <Welcome onSuggestion={(s) => handleSend(s, [])} />
              </motion.div>
            ) : (
              <motion.div key="chat" className="flex-1 flex flex-col min-h-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <MessageList chat={activeChat!} onRegenerate={handleRegenerate} onEditSend={handleEditSend} />
              </motion.div>
            )}
          </AnimatePresence>
          <Composer onSend={handleSend} onStop={handleStop} isStreaming={isStreaming} disabled={isLoading || isStreaming} />
        </main>
      </div>
      <SettingsSheet />
      <ToastContainer />
    </div>
  );
}
