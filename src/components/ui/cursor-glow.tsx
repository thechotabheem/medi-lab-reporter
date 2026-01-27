import { useState, useEffect } from 'react';

export function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isVisible]);

  return (
    <div
      className="fixed pointer-events-none z-0 transition-opacity duration-700"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
        opacity: isVisible ? 1 : 0,
        transition: 'left 0.15s ease-out, top 0.15s ease-out, opacity 0.7s ease-out',
      }}
    />
  );
}
