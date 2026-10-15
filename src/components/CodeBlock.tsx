import { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';

export function CodeBlock({ language, children }: { language?: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className="relative my-3 rounded-2xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[11px] text-white/35 font-mono uppercase tracking-wide">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg transition-colors text-white/40 hover:text-white/70 hover:bg-white/8"
          aria-label="Kopyala"
        >
          {copied ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Kopyalandı</span></> : <><Copy className="w-3 h-3" /><span>Kopyala</span></>}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code style={{ fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace", color: 'rgba(255,255,255,0.88)', whiteSpace: 'pre' }}>
          {children}
        </code>
      </pre>
    </div>
  );
}
