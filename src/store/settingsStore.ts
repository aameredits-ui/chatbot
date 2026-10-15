import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '../lib/i18n';
import type { ChatMode } from '../lib/storage';

export type Theme = 'dark' | 'light' | 'system';
export type FontSize = 'sm' | 'md' | 'lg';

export const PERSONALITIES: Record<string, { key: string; systemPrompt: string; temperature: number }> = {
  helpful: { key: 'helpful', systemPrompt: 'Siz Bakı Dövlət Peşə Təhsil Mərkəzinin 34 YTP qrupu tələbəsi İsmayılov Pərviz tərəfindən hazırlanmış köməkçi və mehriban AI assistentsiniz. İstifadəçilərin suallarına aydın, nəzakətli və dəqiq cavab verin.', temperature: 0.7 },
  concise: { key: 'concise', systemPrompt: 'Siz İsmayılov Pərvizin yaratdığı yığcam və dəqiq AI assistentsiniz. Cavabları qısa, konkret və aydın şəkildə təqdim edin.', temperature: 0.3 },
  creative: { key: 'creative', systemPrompt: 'Siz zəngin təxəyyülə malik, yaradıcı AI assistentsiniz. Maraqlı fikirlər irəli sürün və yaradıcı layihələrdə kömək edin.', temperature: 0.9 },
  coder: { key: 'coder', systemPrompt: 'Siz proqramlaşdırma üzrə təcrübəli mütəxəssissiniz. Təmiz, səmərəli kod yazın, texniki izahatlar verin və xətaları aradan qaldırın.', temperature: 0.2 },
  teacher: { key: 'teacher', systemPrompt: 'Siz səbirli və bilikli müəllimsiniz. Mürəkkəb mövzuları sadə və anlaşıqlı nümunələrlə izah edin.', temperature: 0.6 },
};

export const CHAT_MODES: Record<ChatMode, { systemPrompt: string; temperature: number }> = {
  chat: { systemPrompt: PERSONALITIES.helpful.systemPrompt, temperature: 0.7 },
  creative: { systemPrompt: PERSONALITIES.creative.systemPrompt, temperature: 0.9 },
  code: { systemPrompt: PERSONALITIES.coder.systemPrompt, temperature: 0.2 },
  research: { systemPrompt: 'Siz hərtərəfli tədqiqat assistentisiniz. Məlumatları dərindən analiz edin və əhatəli təhlillər təqdim edin.', temperature: 0.4 },
};

interface SettingsState {
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  language: Language;
  theme: Theme;
  fontSize: FontSize;
  apiKey: string;
  mode: ChatMode;
  setModel: (model: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setApiKey: (key: string) => void;
  setMode: (mode: ChatMode) => void;
  applyPersonality: (key: string) => void;
  applyMode: (mode: ChatMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      model: 'n8n-webhook',
      systemPrompt: PERSONALITIES.helpful.systemPrompt,
      temperature: 0.7,
      maxTokens: 4096,
      language: 'az',
      theme: 'dark',
      fontSize: 'md',
      apiKey: '',
      mode: 'chat',
      setModel: (model) => set({ model }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setApiKey: (apiKey) => set({ apiKey }),
      setMode: (mode) => set({ mode }),
      applyPersonality: (key) => {
        const p = PERSONALITIES[key];
        if (p) set({ systemPrompt: p.systemPrompt, temperature: p.temperature });
      },
      applyMode: (mode) => {
        const m = CHAT_MODES[mode];
        if (m) set({ mode, systemPrompt: m.systemPrompt, temperature: m.temperature });
      },
    }),
    {
      name: 'ai-chat-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.model = 'n8n-webhook';
        }
      },
    }
  )
);
