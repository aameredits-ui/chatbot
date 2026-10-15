import { useState } from 'react';
import { ChevronLeft, Settings, MessageSquare, Sparkles, Code2, Search, type LucideIcon } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from '../lib/useTranslation';
import { ModePopover } from './ModePopover';
import type { ChatMode } from '../lib/storage';

const modeIcons: Record<ChatMode, LucideIcon> = {
  chat: MessageSquare,
  creative: Sparkles,
  code: Code2,
  research: Search,
};

export function Header() {
  const { setSidebarOpen, setSettingsOpen } = useChatStore();
  const { mode } = useSettingsStore();
  const t = useTranslation();
  const [showMode, setShowMode] = useState(false);
  const ModeIcon = modeIcons[mode];
  const modeLabels: Record<ChatMode, string> = { chat: t.modeChat, creative: t.modeCreative, code: t.modeCode, research: t.modeResearch };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 glass border-b border-white/[0.06]">
      <button
        onClick={() => setSidebarOpen(true)}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors"
        aria-label="Sidebar aç"
      >
        <ChevronLeft className="w-5 h-5 text-white/60" strokeWidth={1.5} />
      </button>

      <div className="relative">
        <button
          onClick={() => setShowMode((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-pill glass-elevated hover:bg-white/10 transition-colors text-sm font-medium text-white/75"
        >
          <ModeIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{modeLabels[mode]}</span>
        </button>
        {showMode && <ModePopover onClose={() => setShowMode(false)} />}
      </div>

      <button
        onClick={() => setSettingsOpen(true)}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors"
        aria-label={t.settings}
      >
        <Settings className="w-4 h-4 text-white/60" strokeWidth={1.5} />
      </button>
    </header>
  );
}
