import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

export function ToastContainer() {
  const { toasts, removeToast } = useChatStore();
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl glass-elevated shadow-2xl min-w-[240px] max-w-[340px]"
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <p className="text-sm text-white/80 flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              aria-label="Kapat"
            >
              <X className="w-3 h-3 text-white/40" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
