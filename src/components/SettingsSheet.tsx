import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore, PERSONALITIES } from '../store/settingsStore';
import { useTranslation } from '../lib/useTranslation';
import type { Language } from '../lib/i18n';

export function SettingsSheet() {
  const { settingsOpen, setSettingsOpen, clearAllChats, addToast } = useChatStore();
  const s = useSettingsStore();
  const t = useTranslation();
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  const testConnection = async () => {
    setTesting(true); setTestResult(null);
    const webhookUrl = (import.meta.env.VITE_N8N_WEBHOOK_URL as string) || 'https://pervizs.app.n8n.cloud/webhook/chatbot';
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'test', chatInput: 'test' }),
      });
      if (res.ok) { setTestResult('ok'); addToast({ type: 'success', message: t.connectionSuccess }); }
      else { setTestResult('fail'); addToast({ type: 'error', message: t.connectionFailed }); }
    } catch { setTestResult('fail'); addToast({ type: 'error', message: t.errorNetwork }); }
    setTesting(false);
  };

  const handleClearAll = async () => {
    await clearAllChats();
    setClearConfirm(false);
    setSettingsOpen(false);
    addToast({ type: 'info', message: 'Tüm veriler silindi.' });
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
            onClick={() => setSettingsOpen(false)} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass-strong rounded-t-3xl border-t border-white/10 max-h-[88vh] flex flex-col md:max-w-lg md:mx-auto"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex justify-center pt-3"><div className="w-9 h-1 rounded-full bg-white/18" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <h2 className="font-semibold text-white/88 text-base">{t.settings}</h2>
              <button onClick={() => setSettingsOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors" aria-label={t.close}>
                <X className="w-4 h-4 text-white/45" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">
              <Row label={t.model}>
                <div className="flex items-center justify-between glass-elevated rounded-xl px-4 py-3 border border-white/12">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-medium text-white/90">
                      Pərviz İsmayılov (n8n Webhook - 34 YTP)
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20">
                    Aktiv
                  </span>
                </div>
              </Row>
              <Row label={t.systemPrompt}>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {Object.entries(PERSONALITIES).map(([k]) => (
                    <button key={k} onClick={() => s.applyPersonality(k)}
                      className="px-3 py-1 text-xs rounded-pill glass hover:bg-white/10 transition-colors text-white/55 hover:text-white/85 border border-white/10">
                      {t.personalities[k as keyof typeof t.personalities]}
                    </button>
                  ))}
                </div>
                <textarea value={s.systemPrompt} onChange={(e) => s.setSystemPrompt(e.target.value)} rows={4}
                  className="w-full glass rounded-xl px-3 py-2.5 text-sm text-white/80 focus:outline-none border border-white/10 resize-none bg-transparent placeholder-white/28" />
              </Row>
              <Row label={`${t.temperature}: ${s.temperature.toFixed(1)}`}>
                <input type="range" min={0} max={1} step={0.1} value={s.temperature} onChange={(e) => s.setTemperature(+e.target.value)}
                  className="w-full accent-purple-500" />
                <div className="flex justify-between text-[10px] text-white/28 mt-1"><span>Tutarlı</span><span>Dengeli</span><span>Yaratıcı</span></div>
              </Row>
              <Row label={`${t.maxTokens}: ${s.maxTokens}`}>
                <input type="range" min={256} max={8192} step={256} value={s.maxTokens} onChange={(e) => s.setMaxTokens(+e.target.value)}
                  className="w-full accent-purple-500" />
              </Row>
              <Row label={t.language}>
                <div className="flex gap-2">
                  {(['az', 'tr', 'en'] as Language[]).map((lang) => (
                    <button key={lang} onClick={() => s.setLanguage(lang)}
                      className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
                        s.language === lang ? 'glass-elevated text-white border-white/20' : 'glass text-white/45 border-white/8 hover:bg-white/8'
                      }`}>
                      {lang === 'az' ? '🇦🇿 Az' : lang === 'tr' ? '🇹🇷 Tr' : '🇺🇸 En'}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label={t.theme}>
                <div className="flex gap-2">
                  {(['dark', 'light', 'system'] as const).map((th) => (
                    <button key={th} onClick={() => s.setTheme(th)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        s.theme === th ? 'glass-elevated text-white border-white/20' : 'glass text-white/45 border-white/8 hover:bg-white/8'
                      }`}>
                      {th === 'dark' ? t.dark : th === 'light' ? t.light : t.system}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label={t.fontSize}>
                <div className="flex gap-2">
                  {(['sm', 'md', 'lg'] as const).map((sz, i) => (
                    <button key={sz} onClick={() => s.setFontSize(sz)}
                      className={`flex-1 py-2 rounded-xl border transition-colors ${
                        s.fontSize === sz ? 'glass-elevated text-white border-white/20' : 'glass text-white/45 border-white/8 hover:bg-white/8'
                      }`}
                      style={{ fontSize: [12, 14, 16][i] }}>
                      Aa
                    </button>
                  ))}
                </div>
              </Row>
              <Row label={t.apiKey}>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 glass rounded-xl px-3 py-2.5 border border-white/10">
                    <input type={showKey ? 'text' : 'password'} value={s.apiKey} onChange={(e) => s.setApiKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="flex-1 bg-transparent text-sm text-white/80 focus:outline-none placeholder-white/22 min-w-0"
                      autoComplete="off" spellCheck={false} />
                    <button onClick={() => setShowKey(!showKey)} className="text-white/30 hover:text-white/55 transition-colors shrink-0">
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={testConnection} disabled={testing || !s.apiKey}
                    className="px-3 py-2 glass rounded-xl text-xs text-white/55 hover:text-white/85 hover:bg-white/10 border border-white/10 disabled:opacity-40 transition-colors shrink-0 flex items-center gap-1">
                    {testing ? '...' : testResult === 'ok' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : testResult === 'fail' ? <XCircle className="w-4 h-4 text-red-400" /> : t.testConnection}
                  </button>
                </div>
                <p className="text-[11px] text-white/28 mt-2">{t.apiKeyNote}</p>
              </Row>
              <Row label="">
                {!clearConfirm ? (
                  <button onClick={() => setClearConfirm(true)}
                    className="w-full py-2.5 rounded-xl text-sm text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />{t.clearAllData}
                  </button>
                ) : (
                  <div className="glass rounded-xl p-4">
                    <p className="text-sm text-white/58 mb-3">{t.clearDataConfirm}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setClearConfirm(false)} className="flex-1 py-2 rounded-xl text-sm glass border border-white/10 text-white/45 hover:bg-white/8 transition-colors">{t.cancel}</button>
                      <button onClick={handleClearAll} className="flex-1 py-2 rounded-xl text-sm bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors">{t.confirm}</button>
                    </div>
                  </div>
                )}
              </Row>
              <div className="h-4" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2">{label}</label>}
      {children}
    </div>
  );
}
