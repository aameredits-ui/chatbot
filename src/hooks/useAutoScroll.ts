import { useRef, useEffect, useCallback, useState } from 'react';

export function useAutoScroll(dep: unknown) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const userScrolledUp = useRef(false);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    userScrolledUp.current = false;
    setShowScrollButton(false);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      userScrolledUp.current = dist > 80;
      setShowScrollButton(dist > 200);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!userScrolledUp.current) scrollToBottom(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);

  return { containerRef, scrollToBottom, showScrollButton };
}
