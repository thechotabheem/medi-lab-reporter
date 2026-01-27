import { useState, useCallback, useRef, useEffect } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const createRipple = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple: Ripple = {
      id: nextId.current++,
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);
  }, []);

  useEffect(() => {
    if (ripples.length === 0) return;

    const timer = setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 600);

    return () => clearTimeout(timer);
  }, [ripples]);

  return { ripples, createRipple, containerRef };
}
