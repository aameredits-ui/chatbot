import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-2 mb-4"
    >
      <div className="w-7 h-7 rounded-xl glass-elevated flex items-center justify-center shrink-0">
        <MessageSquare className="w-3.5 h-3.5 text-white/50" strokeWidth={1.5} />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 glass rounded-[20px] rounded-tl-sm">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/40"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
