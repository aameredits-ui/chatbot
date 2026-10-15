import { useEffect } from 'react';

interface Hotkey {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  handler: () => void;
}

export function useHotkeys(hotkeys: Hotkey[]) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      for (const hk of hotkeys) {
        const ctrlOk = hk.ctrl ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
        const shiftOk = hk.shift ? e.shiftKey : !e.shiftKey;
        if (e.key === hk.key && ctrlOk && shiftOk) {
          e.preventDefault();
          hk.handler();
          return;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotkeys]);
}
