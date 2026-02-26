import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number;
}

const DOT_COUNT = 9;
const STAGGER_DELAY = 120; // ms between each dot

export function SplashScreen({ onComplete, minDisplayTime = 2400 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 500);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime, onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden",
        "transition-all duration-500 ease-out",
        isExiting && "opacity-0 scale-105 pointer-events-none"
      )}
    >
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 16,
              height: 16,
              backgroundColor: 'hsl(162 84% 42%)',
              animation: `bounce-dot 1s ease-in-out ${i * STAGGER_DELAY}ms infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Inject keyframes once
const styleId = 'bounce-dot-style';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes bounce-dot {
      0%, 100% { transform: scale(0.5); opacity: 0.3; }
      50% { transform: scale(1.3); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
