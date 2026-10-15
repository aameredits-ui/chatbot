import { useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, Code2, Search, type LucideIcon } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from '../lib/useTranslation';
import type { ChatMode } from '../lib/storage';

const MODES: { key: ChatMode; icon: LucideIcon; color: string }[] = [
  { key: 'chat', icon: MessageSquare, color: 'text-blue-400' },
  { key: 'creative', icon: Sparkles, color: 'text-purple-400' },
  { key: 'code', icon: Code2, color: 'text-emerald-400' },
  { key: 'research', icon: Search, color: 'text-amber-400' },
];

export function ModePopover({ onClose }: { onClose: () => void }) {
  const { mode, applyMode } = useSettingsStore();
  const t = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const labels: Record<ChatMode, string> = { chat: t.modeChat, creative: t.modeCreative, code: t.modeCode, research: t.modeResearch };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 glass-strong rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      {MODES.map((m) => (
        <button
          key={m.key}
          onClick={() => { applyMode(m.key); onClose(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 transition-colors ${
            mode === m.key ? 'bg-white/10' : ''
          }`}
        >
          <m.icon className={`w-4 h-4 ${m.color}`} strokeWidth={1.5} />
          <span className="text-sm text-white/80 font-medium">{labels[m.key]}</span>
          {mode === m.key && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
        </button>
      ))}
    </div>
  );
}
