import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Search, Pin, PinOff, Trash2, Edit2, Download } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useTranslation } from '../lib/useTranslation';
import type { Chat } from '../lib/storage';
import { exportChatAsMarkdown, downloadFile } from '../lib/storage';
import { groupChatsByDate } from '../lib/utils';

export function Sidebar({ onNewChat }: { onNewChat: () => void }) {
  const { chats, activeChatId, sidebarOpen, setSidebarOpen, setActiveChat, deleteChat, renameChat, pinChat } = useChatStore();
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);
  const t = useTranslation();

  const filtered = chats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
  const groups = groupChatsByDate(filtered);
  const labels: Record<string, string> = { today: t.today, yesterday: t.yesterday, week: t.last7Days, older: t.older };

  const handleSelect = (id: string) => {
    setActiveChat(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const startRename = (chat: Chat) => { setRenamingId(chat.id); setRenameValue(chat.title); };
  const submitRename = async (id: string) => { if (renameValue.trim()) await renameChat(id, renameValue.trim()); setRenamingId(null); };

  const handleExportMd = (chat: Chat) => { downloadFile(exportChatAsMarkdown(chat), `${chat.title}.md`, 'text/markdown'); setExportId(null); };
  const handleExportJson = (chat: Chat) => { downloadFile(JSON.stringify(chat, null, 2), `${chat.title}.json`, 'application/json'); setExportId(null); };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)} />
          <motion.aside
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 270 }}
            className="fixed left-0 top-0 h-full z-50 w-72 flex flex-col glass-strong border-r border-white/[0.07]"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
              <span className="font-semibold text-white/80 text-sm tracking-tight">{t.appName}</span>
              <button onClick={() => setSidebarOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" aria-label={t.close}>
                <X className="w-4 h-4 text-white/45" />
              </button>
            </div>
            <div className="p-3">
              <button onClick={() => { onNewChat(); setSidebarOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 glass rounded-xl hover:bg-white/10 transition-colors text-sm text-white/65 hover:text-white/90">
                <Plus className="w-4 h-4" /><span>{t.newChat}</span>
              </button>
            </div>
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 px-3 py-2 glass rounded-xl">
                <Search className="w-3.5 h-3.5 text-white/28 shrink-0" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search}
                  className="flex-1 bg-transparent text-sm text-white/70 placeholder-white/28 focus:outline-none" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {Object.entries(groups).map(([grp, items]) => {
                if (!items.length) return null;
                return (
                  <div key={grp} className="mb-2">
                    <div className="px-2 py-1.5 text-[10px] font-semibold text-white/28 uppercase tracking-widest">{labels[grp]}</div>
                    {items.map((item) => {
                      const chat = item as Chat;
                      if (deleteId === chat.id) return (
                        <div key={chat.id} className="px-2 py-2 glass rounded-xl mb-0.5">
                          <p className="text-xs text-white/55 mb-2">{t.deleteConfirm}</p>
                          <div className="flex gap-2">
                            <button onClick={() => setDeleteId(null)} className="flex-1 text-xs py-1.5 rounded-lg hover:bg-white/10 text-white/45 transition-colors">{t.cancel}</button>
                            <button onClick={async () => { await deleteChat(chat.id); setDeleteId(null); }} className="flex-1 text-xs py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">{t.delete}</button>
                          </div>
                        </div>
                      );
                      return (
                        <div key={chat.id}
                          className={`group relative flex items-center gap-2 px-2 py-2 rounded-xl mb-0.5 cursor-pointer transition-colors ${
                            activeChatId === chat.id ? 'bg-white/10' : 'hover:bg-white/6'
                          }`}
                          onClick={() => handleSelect(chat.id)}
                        >
                          {chat.pinned && <Pin className="w-3 h-3 text-white/28 shrink-0" />}
                          {renamingId === chat.id ? (
                            <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => submitRename(chat.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter') submitRename(chat.id); if (e.key === 'Escape') setRenamingId(null); }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 bg-transparent text-sm text-white focus:outline-none" autoFocus />
                          ) : (
                            <span className="flex-1 text-sm text-white/68 truncate">{chat.title}</span>
                          )}
                          <div className="hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <Ia onClick={() => startRename(chat)} label={t.rename}><Edit2 className="w-3 h-3" /></Ia>
                            <Ia onClick={() => pinChat(chat.id, !chat.pinned)} label={chat.pinned ? t.unpin : t.pin}>
                              {chat.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                            </Ia>
                            <div className="relative">
                              <Ia onClick={() => setExportId(exportId === chat.id ? null : chat.id)} label={t.export}><Download className="w-3 h-3" /></Ia>
                              {exportId === chat.id && (
                                <div className="absolute right-0 bottom-full mb-1 w-44 glass-elevated rounded-xl shadow-xl z-10 overflow-hidden">
                                  <button onClick={() => handleExportMd(chat)} className="w-full text-left px-3 py-2.5 text-xs text-white/70 hover:bg-white/10 transition-colors">{t.exportMarkdown}</button>
                                  <button onClick={() => handleExportJson(chat)} className="w-full text-left px-3 py-2.5 text-xs text-white/70 hover:bg-white/10 transition-colors">{t.exportJson}</button>
                                </div>
                              )}
                            </div>
                            <Ia onClick={() => setDeleteId(chat.id)} label={t.delete} danger><Trash2 className="w-3 h-3" /></Ia>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Ia({ children, onClick, label, danger }: { children: React.ReactNode; onClick: () => void; label: string; danger?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label}
      className={`p-1 rounded-md transition-colors ${
        danger ? 'text-white/28 hover:text-red-400 hover:bg-red-500/10' : 'text-white/28 hover:text-white/60 hover:bg-white/10'
      }`}>
      {children}
    </button>
  );
}
