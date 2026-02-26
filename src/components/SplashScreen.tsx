import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number;
}

const GRID_COLS = 20;
const GRID_ROWS = 12;
const DOT_SIZE = 4;
const GAP = 28;

export function SplashScreen({ onComplete, minDisplayTime = 2400 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [rippleCenter, setRippleCenter] = useState({ x: GRID_COLS / 2, y: GRID_ROWS / 2 });
  const [rippleCount, setRippleCount] = useState(0);

  // Trigger ripples from center periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRippleCount(c => c + 1);
    }, 800);

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 500);
    }, minDisplayTime);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [minDisplayTime, onComplete]);

  const gridWidth = GRID_COLS * GAP;
  const gridHeight = GRID_ROWS * GAP;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden",
        "transition-all duration-500 ease-out",
        isExiting && "opacity-0 scale-105 pointer-events-none"
      )}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(162 84% 42% / 0.06) 0%, transparent 60%)',
        }}
      />

      {/* Dot grid */}
      <div
        className="relative"
        style={{ width: gridWidth, height: gridHeight }}
      >
        {Array.from({ length: GRID_ROWS }).map((_, row) =>
          Array.from({ length: GRID_COLS }).map((_, col) => {
            const dx = col - rippleCenter.x;
            const dy = row - rippleCenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            return (
              <RippleDot
                key={`${row}-${col}`}
                col={col}
                row={row}
                distance={distance}
                rippleCount={rippleCount}
                gap={GAP}
                dotSize={DOT_SIZE}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

interface RippleDotProps {
  col: number;
  row: number;
  distance: number;
  rippleCount: number;
  gap: number;
  dotSize: number;
}

function RippleDot({ col, row, distance, rippleCount, gap, dotSize }: RippleDotProps) {
  const maxDistance = Math.sqrt((GRID_COLS / 2) ** 2 + (GRID_ROWS / 2) ** 2);
  const delay = distance * 60; // ms per unit distance

  return (
    <div
      className="absolute rounded-full"
      style={{
        left: col * gap,
        top: row * gap,
        width: dotSize,
        height: dotSize,
        backgroundColor: 'hsl(162 84% 42%)',
        opacity: 0.15,
        animation: `ripple-dot 800ms ease-out ${delay}ms infinite`,
      }}
    />
  );
}

// Inject keyframes once
const styleId = 'ripple-dot-style';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes ripple-dot {
      0% { opacity: 0.12; transform: scale(1); }
      30% { opacity: 0.9; transform: scale(2.2); box-shadow: 0 0 8px hsl(162 84% 42% / 0.6); }
      100% { opacity: 0.12; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}
