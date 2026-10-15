import { AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useAutoScroll } from '../hooks/useAutoScroll';
import type { Chat } from '../lib/storage';
import { useChatStore } from '../store/chatStore';

export function MessageList({ chat, onRegenerate, onEditSend }: {
  chat: Chat;
  onRegenerate: () => void;
  onEditSend: (messageId: string, newContent: string) => void;
}) {
  const { isLoading, isStreaming } = useChatStore();
  const messages = chat.messages.filter((m) => m.role !== 'system');
  const { containerRef, scrollToBottom, showScrollButton } = useAutoScroll(messages.length + (isStreaming ? 0.5 : 0));

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={containerRef} className="h-full overflow-y-auto px-4 pt-4 pb-2">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                chatId={chat.id}
                onRegenerate={onRegenerate}
                onEditSend={onEditSend}
                isLast={i === messages.length - 1}
              />
            ))}
            {isLoading && !isStreaming && <TypingIndicator key="typing" />}
          </AnimatePresence>
          <div className="h-2" />
        </div>
      </div>
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-4 right-4 w-9 h-9 glass-elevated rounded-full flex items-center justify-center hover:bg-white/15 transition-colors shadow-xl"
            aria-label="Aşağı in"
          >
            <ChevronDown className="w-4 h-4 text-white/60" strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
