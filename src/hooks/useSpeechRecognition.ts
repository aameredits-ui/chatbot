import { useState, useCallback, useRef } from 'react';
import { speechService } from '../lib/speech';
import { useSettingsStore } from '../store/settingsStore';

export function useSpeechRecognition(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const language = useSettingsStore((s) => s.language);
  const isSupported = speechService.isSupported();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;
    setIsListening(true);
    speechService.start(
      onResult,
      () => { setIsListening(false); if (timeoutRef.current) clearTimeout(timeoutRef.current); },
      language === 'az' ? 'az-AZ' : language === 'tr' ? 'tr-TR' : 'en-US'
    );
    timeoutRef.current = setTimeout(() => stopListening(), 30000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, isListening, language, onResult]);

  const stopListening = useCallback(() => {
    speechService.stop();
    setIsListening(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { isListening, startListening, stopListening, isSupported };
}
