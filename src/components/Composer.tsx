import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Mic, MicOff, ArrowUp, Square, X } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTranslation } from '../lib/useTranslation';
import type { Attachment } from '../lib/storage';
import { generateId } from '../lib/storage';
import { fileToBase64, formatBytes, isImageFile } from '../lib/utils';
import { useChatStore } from '../store/chatStore';

export function Composer({ onSend, onStop, isStreaming, disabled }: {
  onSend: (content: string, attachments: Attachment[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useChatStore();
  const t = useTranslation();

  const { isListening, startListening, stopListening, isSupported: speechSupported } = useSpeechRecognition(
    useCallback((result: string) => setText((prev) => prev + (prev ? ' ' : '') + result), [])
  );

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed, attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
  }, [text, attachments, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 24 * 6 + 24) + 'px';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (attachments.length + files.length > 5) { addToast({ type: 'error', message: t.tooManyFiles }); return; }
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { addToast({ type: 'error', message: t.fileTooBig }); continue; }
      const ok = isImageFile(file) || file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/pdf';
      if (!ok) { addToast({ type: 'error', message: t.unsupportedFile }); continue; }
      try {
        const data = await fileToBase64(file);
        setAttachments((prev) => [...prev, { id: generateId(), name: file.name, type: file.type, size: file.size, data, preview: isImageFile(file) ? data : undefined }]);
      } catch { addToast({ type: 'error', message: 'Dosya okuma hatası' }); }
    }
  };

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled;

  return (
    <div className="px-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="flex flex-wrap gap-2 mb-2 max-w-2xl mx-auto">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 glass rounded-xl px-3 py-1.5 text-sm">
                {att.preview
                  ? <img src={att.preview} alt={att.name} className="w-8 h-8 rounded-lg object-cover" />
                  : <span className="text-base">📄</span>}
                <div className="flex flex-col">
                  <span className="text-xs text-white/70 max-w-[90px] truncate">{att.name}</span>
                  <span className="text-[10px] text-white/35">{formatBytes(att.size)}</span>
                </div>
                <button onClick={() => setAttachments((p) => p.filter((a) => a.id !== att.id))} className="p-0.5 hover:bg-white/10 rounded-full transition-colors" aria-label={t.removeFile}>
                  <X className="w-3 h-3 text-white/40" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-end gap-2 glass-elevated rounded-pill px-4 py-2" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? t.listening : t.askAnything}
            rows={1}
            disabled={disabled && !isStreaming}
            className="flex-1 bg-transparent text-white/90 placeholder-white/28 text-sm resize-none focus:outline-none py-1.5 leading-6 max-h-[160px]"
            aria-label={t.askAnything}
          />
          <div className="flex items-center gap-1 shrink-0 pb-0.5">
            <input ref={fileInputRef} type="file" multiple accept="image/*,text/*,application/json,application/pdf" onChange={handleFileSelect} className="hidden" />
            <IBtn onClick={() => fileInputRef.current?.click()} label={t.attach}><Paperclip className="w-4 h-4" /></IBtn>
            {!speechSupported ? (
              <div title={t.noSpeechSupport}>
                <IBtn onClick={() => {}} label={t.microphone} disabled><MicOff className="w-4 h-4" /></IBtn>
              </div>
            ) : (
              <IBtn onClick={isListening ? stopListening : startListening} label={t.microphone} active={isListening}>
                {isListening
                  ? <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.9, repeat: Infinity }}><Mic className="w-4 h-4 text-red-400" /></motion.div>
                  : <Mic className="w-4 h-4" />}
              </IBtn>
            )}
            {isStreaming ? (
              <button onClick={onStop} className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors" aria-label={t.stop}>
                <Square className="w-3.5 h-3.5 text-black fill-black" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  canSend ? 'bg-white hover:bg-white/90 shadow-lg shadow-white/10' : 'bg-white/10 cursor-not-allowed'
                }`}
                aria-label={t.send}
              >
                <ArrowUp className={`w-4 h-4 ${canSend ? 'text-black' : 'text-white/18'}`} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
        <div className="h-1" />
      </div>
    </div>
  );
}

function IBtn({ children, onClick, label, disabled, active }: {
  children: React.ReactNode; onClick: () => void; label: string; disabled?: boolean; active?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label}
      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
        active ? 'bg-white/20 text-white' : 'text-white/38 hover:text-white/70 hover:bg-white/10'
      } ${disabled ? 'opacity-25 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
}
