import { useSettingsStore } from '../store/settingsStore';
import { translations } from './i18n';

export function useTranslation() {
  const language = useSettingsStore((s) => s.language);
  return translations[language];
}
