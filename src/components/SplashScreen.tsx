import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number;
}

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
      <div className="pl-grid">
        {/* Row 0: small, normal, small */}
        <div className="pl-dot pl-dot--sm pl-dot--even pl-dot--d0" />
        <div className="pl-dot pl-dot--d1" />
        <div className="pl-dot pl-dot--sm pl-dot--d2" />
        {/* Row 1: normal, large center, normal */}
        <div className="pl-dot pl-dot--even pl-dot--d3" />
        <div className="pl-dot pl-dot--lg pl-dot--center pl-dot--d4" />
        <div className="pl-dot pl-dot--even pl-dot--d5" />
        {/* Row 2: small, normal, small */}
        <div className="pl-dot pl-dot--sm pl-dot--d6" />
        <div className="pl-dot pl-dot--even pl-dot--d7" />
        <div className="pl-dot pl-dot--sm pl-dot--d8" />
      </div>
    </div>
  );
}

// Inject styles once
const styleId = 'pl-dot-style';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    :root {
      --pl-color: 162 84% 42%;
      --pl-dot: 16px;
      --pl-gap: 8px;
    }

    .pl {
      display: grid;
      grid-template-columns: repeat(3, var(--pl-dot));
      grid-template-rows: repeat(3, var(--pl-dot));
      gap: var(--pl-gap);
      position: relative;
    }

    /* Generate 9 dots via box-shadow on a single pseudo — nope, let's use real children via CSS */
    /* Actually we need pseudo-elements per dot. Let's use the parent's before/after plus generated content. */
    /* Best approach: inject 9 dot divs. Let me revise the component. */
  `;
  // Actually, let's do it properly with real DOM elements
  style.textContent = `
    :root {
      --pl-color: 168 84% 26%;
      --pl-dot: 16px;
      --pl-gap: 8px;
    }

    .pl-grid {
      display: grid;
      grid-template-columns: repeat(3, auto);
      grid-template-rows: repeat(3, auto);
      gap: var(--pl-gap);
      position: relative;
    }

    .pl-dot {
      width: var(--pl-dot);
      height: var(--pl-dot);
      border-radius: 50%;
      background: hsl(var(--pl-color));
      position: relative;
      animation: pl-pulse 2s ease-in-out infinite;
    }

    /* Size variants */
    .pl-dot--lg {
      width: calc(var(--pl-dot) * 1.5);
      height: calc(var(--pl-dot) * 1.5);
    }
    .pl-dot--sm {
      width: calc(var(--pl-dot) * 0.65);
      height: calc(var(--pl-dot) * 0.65);
    }

    /* Center all dots in their grid cell */
    .pl-grid > * {
      place-self: center;
    }

    /* Pseudo-element base */
    .pl-dot::before,
    .pl-dot::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
    }

    /* ::before — scale bloom particle */
    .pl-dot::before {
      width: 100%;
      height: 100%;
      background: hsl(var(--pl-color) / 0.5);
      animation: pl-bloom 2s ease-in-out infinite;
    }

    /* ::after — subtle translate-away particle */
    .pl-dot::after {
      width: 60%;
      height: 60%;
      background: hsl(var(--pl-color) / 0.35);
      animation: pl-drift 2s ease-in-out infinite;
    }

    /* Even dots get a hinge rotation on ::before */
    .pl-dot--even::before {
      animation: pl-hinge 2s linear infinite;
    }

    /* Center dot radial wave ring */
    .pl-dot--center::after {
      width: 300%;
      height: 300%;
      background: none;
      border: 2px solid hsl(var(--pl-color) / 0.3);
      animation: pl-wave 2s ease-out infinite;
    }

    /* Stagger delays */
    .pl-dot--d0 { animation-delay: 0s; }
    .pl-dot--d0::before, .pl-dot--d0::after { animation-delay: 0s; }

    .pl-dot--d1 { animation-delay: 0.15s; }
    .pl-dot--d1::before, .pl-dot--d1::after { animation-delay: 0.15s; }

    .pl-dot--d2 { animation-delay: 0.3s; }
    .pl-dot--d2::before, .pl-dot--d2::after { animation-delay: 0.3s; }

    .pl-dot--d3 { animation-delay: 0.45s; }
    .pl-dot--d3::before, .pl-dot--d3::after { animation-delay: 0.45s; }

    .pl-dot--d4 { animation-delay: 0.6s; }
    .pl-dot--d4::before, .pl-dot--d4::after { animation-delay: 0.6s; }

    .pl-dot--d5 { animation-delay: 0.75s; }
    .pl-dot--d5::before, .pl-dot--d5::after { animation-delay: 0.75s; }

    .pl-dot--d6 { animation-delay: 0.25s; }
    .pl-dot--d6::before, .pl-dot--d6::after { animation-delay: 0.25s; }

    .pl-dot--d7 { animation-delay: 0.5s; }
    .pl-dot--d7::before, .pl-dot--d7::after { animation-delay: 0.5s; }

    .pl-dot--d8 { animation-delay: 0.1s; }
    .pl-dot--d8::before, .pl-dot--d8::after { animation-delay: 0.1s; }

    /* Keyframes */
    @keyframes pl-pulse {
      0%, 100% {
        transform: scale(0.5);
        opacity: 0.3;
      }
      15% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1);
        opacity: 1;
      }
      75% {
        transform: scale(0.6);
        opacity: 0.4;
      }
    }

    @keyframes pl-bloom {
      0%, 100% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.6;
      }
      20% {
        transform: translate(-50%, -50%) scale(1.6);
        opacity: 0.4;
      }
      50% {
        transform: translate(-50%, -50%) scale(2);
        opacity: 0;
      }
    }

    @keyframes pl-drift {
      0%, 100% {
        transform: translate(-50%, -50%) scale(0) translateY(0);
        opacity: 0.5;
      }
      30% {
        transform: translate(-50%, -50%) scale(1) translateY(-4px);
        opacity: 0.4;
      }
      60% {
        transform: translate(-50%, -50%) scale(0.5) translateY(-10px);
        opacity: 0;
      }
    }

    @keyframes pl-hinge {
      0% {
        transform: translate(-50%, -50%) scale(0) rotate(0deg);
        opacity: 0.5;
      }
      25% {
        transform: translate(-50%, -50%) scale(1.3) rotate(90deg);
        opacity: 0.5;
      }
      50% {
        transform: translate(-50%, -50%) scale(1.5) rotate(180deg);
        opacity: 0.2;
      }
      75% {
        transform: translate(-50%, -50%) scale(1) rotate(270deg);
        opacity: 0.1;
      }
      100% {
        transform: translate(-50%, -50%) scale(0) rotate(360deg);
        opacity: 0;
      }
    }

    @keyframes pl-wave {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.6;
      }
      60% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.15;
      }
      100% {
        transform: translate(-50%, -50%) scale(1.3);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
