import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, Edit2, MessageSquare, Save } from 'lucide-react';
import type { Message } from '../lib/storage';
import { CodeBlock } from './CodeBlock';
import { useChatStore } from '../store/chatStore';
import { useTranslation } from '../lib/useTranslation';

interface Props {
  message: Message;
  chatId: string;
  onRegenerate?: () => void;
  onEditSend?: (messageId: string, newContent: string) => void;
  isLast?: boolean;
}

export function MessageBubble({ message, chatId, onRegenerate, onEditSend, isLast }: Props) {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const { updateMessageLike } = useChatStore();
  const t = useTranslation();
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleSaveEdit = () => {
    const trimmed = editContent.trim();
    if (trimmed && onEditSend) { onEditSend(message.id, trimmed); setIsEditing(false); }
  };

  if (message.role === 'system') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} group mb-5`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {isAssistant && (
        <div className="w-7 h-7 rounded-xl glass-elevated flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare className="w-3.5 h-3.5 text-white/55" strokeWidth={1.5} />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%] min-w-0`}>
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((att) => (
              <div key={att.id}>
                {att.type.startsWith('image/') ? (
                  <img src={att.data} alt={att.name} className="max-w-[200px] max-h-[160px] object-cover rounded-xl border border-white/10" />
                ) : (
                  <div className="px-3 py-2 glass rounded-xl text-xs text-white/55">{att.name}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {isEditing ? (
          <div className="w-full min-w-[240px]">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } if (e.key === 'Escape') setIsEditing(false); }}
              className="w-full bg-white/10 text-white text-sm rounded-2xl px-4 py-3 resize-none focus:outline-none border border-white/20"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button onClick={() => setIsEditing(false)} className="text-xs text-white/45 px-3 py-1.5 rounded-xl hover:bg-white/8 transition-colors">{t.cancelEdit}</button>
              <button onClick={handleSaveEdit} className="text-xs text-white px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/20 transition-colors flex items-center gap-1.5">
                <Save className="w-3 h-3" />{t.saveEdit}
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`${
              isUser
                ? 'bg-white/10 rounded-[20px] rounded-tr-sm px-4 py-3 text-white/90 text-sm leading-relaxed'
                : 'text-white/85 text-sm leading-loose prose-chat'
            } ${message.isStreaming && !isUser ? 'typing-cursor' : ''}`}
          >
            {isUser ? (
              <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  code({ className, children, ref: _ref, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isBlock = String(children).includes('\n');
                    if (isBlock && match) {
                      return <CodeBlock language={match[1]}>{String(children).replace(/\n$/, '')}</CodeBlock>;
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                }}
              >
                {message.content || ''}
              </ReactMarkdown>
            )}
          </div>
        )}

        {!isEditing && !message.isStreaming && (
          <motion.div
            animate={{ opacity: showActions ? 1 : 0 }}
            className="flex items-center gap-0.5 mt-1.5"
          >
            <Btn onClick={handleCopy} label={t.copy}>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </Btn>
            {isAssistant && onRegenerate && isLast && (
              <Btn onClick={onRegenerate} label={t.regenerate}><RefreshCw className="w-3 h-3" /></Btn>
            )}
            {isUser && (
              <Btn onClick={() => setIsEditing(true)} label={t.edit}><Edit2 className="w-3 h-3" /></Btn>
            )}
            {isAssistant && (
              <>
                <Btn onClick={() => updateMessageLike(chatId, message.id, message.liked === true ? null : true)} label={t.like} active={message.liked === true}>
                  <ThumbsUp className="w-3 h-3" />
                </Btn>
                <Btn onClick={() => updateMessageLike(chatId, message.id, message.liked === false ? null : false)} label={t.dislike} active={message.liked === false}>
                  <ThumbsDown className="w-3 h-3" />
                </Btn>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function Btn({ children, onClick, label, active }: { children: React.ReactNode; onClick: () => void; label: string; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`p-1.5 rounded-lg transition-colors ${
        active ? 'bg-white/20 text-white' : 'text-white/28 hover:text-white/60 hover:bg-white/8'
      }`}
    >
      {children}
    </button>
  );
}
