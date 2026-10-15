import { motion } from 'framer-motion';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useTranslation } from '../lib/useTranslation';

export function Welcome({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  const t = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 text-center select-none max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-5"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-[24px] glass-elevated flex items-center justify-center relative"
          style={{ boxShadow: '0 0 40px rgba(139,92,246,0.15), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}
        >
          <div className="absolute inset-0 rounded-[24px]" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent 60%)' }} />
          <MessageSquare className="w-9 h-9 text-white/85" strokeWidth={1.5} />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center border border-purple-400/30">
            <Sparkles className="w-2.5 h-2.5 text-purple-300" />
          </div>
        </motion.div>
      </motion.div>

      <motion.h1
        className="font-serif text-xl sm:text-2xl md:text-3xl font-normal text-white mb-3 leading-snug px-2 max-w-lg"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5 }}
      >
        {t.howCanIHelp}
      </motion.h1>

      <motion.p
        className="text-white/50 text-xs sm:text-sm mb-7 max-w-md"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.5 }}
      >
        {t.subtitle}
      </motion.p>

      <motion.div
        className="flex flex-col sm:flex-row flex-wrap gap-2.5 justify-center w-full max-w-lg px-2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.5 }}
      >
        {t.suggestions.map((s, i) => (
          <motion.button
            key={i}
            onClick={() => onSuggestion(s)}
            className="px-4 py-2.5 rounded-pill glass-elevated hover:bg-white/12 hover:border-white/20 transition-all duration-200 text-xs sm:text-sm text-white/75 hover:text-white border border-white/10 text-center shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            whileTap={{ scale: 0.97 }}
          >
            {s}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
