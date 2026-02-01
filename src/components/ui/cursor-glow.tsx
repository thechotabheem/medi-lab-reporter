import { useEffect, useRef } from 'react';

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      // Cancel any pending frame to avoid stacking
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        if (glowRef.current) {
          // Use CSS custom properties to move the gradient center
          // This cannot create overflow because the element is always inset:0
          glowRef.current.style.setProperty('--cursor-x', `${e.clientX}px`);
          glowRef.current.style.setProperty('--cursor-y', `${e.clientY}px`);
          glowRef.current.style.opacity = '1';
        }
      });
    };

    // Use pointermove for mouse + pen support
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        // The glow is created by a radial gradient centered on CSS variables
        // Element size is always exactly the viewport (inset:0), so no overflow possible
        background: 'radial-gradient(circle 300px at var(--cursor-x, 50%) var(--cursor-y, 50%), hsl(162 84% 42% / 0.06), transparent 70%)',
        opacity: 0,
        transition: 'opacity 0.5s ease-out',
        contain: 'paint', // Extra safety to prevent layout contribution
        willChange: 'background',
      }}
    />
  );
}
