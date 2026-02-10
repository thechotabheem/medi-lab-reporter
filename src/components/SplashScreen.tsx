import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number;
}

const ORBIT_DOTS = 6;
const ORBIT_RADIUS = 80;
const PROGRESS_RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

export function SplashScreen({ onComplete, minDisplayTime = 2000 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, minDisplayTime / 50);

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 500);
    }, minDisplayTime);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [minDisplayTime, onComplete]);

  const dashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden",
        "transition-all duration-500 ease-out",
        isExiting && "opacity-0 scale-105 pointer-events-none"
      )}
    >
      {/* Background layers */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(162 84% 42% / 0.12) 0%, transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(162 84% 42%) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background)) 100%)',
        }}
      />

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-5">

        {/* Logo + orbital particles + progress ring container */}
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>

          {/* Orbital particle dots */}
          {Array.from({ length: ORBIT_DOTS }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                animation: `orbit 4s linear infinite`,
                animationDelay: `${i * (4 / ORBIT_DOTS)}s`,
              }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: 6 - i * 0.4,
                  height: 6 - i * 0.4,
                  background: `hsl(162 84% ${50 + i * 5}%)`,
                  boxShadow: `0 0 8px hsl(162 84% 42% / 0.6)`,
                  top: '50%',
                  left: '50%',
                  marginTop: -3,
                  marginLeft: ORBIT_RADIUS - 3,
                }}
              />
            </div>
          ))}

          {/* SVG progress ring */}
          <svg
            className="absolute"
            width={200}
            height={200}
            style={{
              animation: 'fade-in-up 0.5s ease-out forwards',
              animationDelay: '800ms',
              opacity: 0,
            }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Track */}
            <circle
              cx={100}
              cy={100}
              r={PROGRESS_RADIUS}
              fill="none"
              stroke="hsl(162 84% 42% / 0.1)"
              strokeWidth={2}
            />
            {/* Progress */}
            <circle
              cx={100}
              cy={100}
              r={PROGRESS_RADIUS}
              fill="none"
              stroke="hsl(162 84% 42%)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              filter="url(#glow)"
              style={{
                transition: 'stroke-dashoffset 100ms ease-out',
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
              }}
            />
          </svg>

          {/* Logo */}
          <div
            className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center"
            style={{
              animation: 'logo-enter 0.6s ease-out forwards, logo-pulse 3s ease-in-out infinite 0.8s',
              opacity: 0,
              animationDelay: '200ms',
            }}
          >
            <img
              src="/icon.svg"
              alt="Lab Reporter"
              className="w-full h-full object-contain"
              style={{
                filter: 'drop-shadow(0 0 20px hsl(162 84% 42% / 0.5))',
              }}
            />
          </div>
        </div>

        {/* App name */}
        <h1
          className="text-4xl md:text-5xl font-bold text-gradient-primary tracking-tight"
          style={{
            animation: 'fade-in-up 0.5s ease-out forwards',
            animationDelay: '300ms',
            opacity: 0,
          }}
        >
          Lab Reporter
        </h1>

        {/* Clinic name */}
        <span
          className="text-base md:text-lg text-muted-foreground font-medium"
          style={{
            animation: 'fade-in-up 0.5s ease-out forwards',
            animationDelay: '500ms',
            opacity: 0,
          }}
        >
          Zia Clinic & Maternity Home
        </span>

        {/* Tagline */}
        <p
          className="text-xs md:text-sm text-muted-foreground/60 tracking-widest uppercase"
          style={{
            animation: 'fade-in-up 0.5s ease-out forwards',
            animationDelay: '700ms',
            opacity: 0,
          }}
        >
          Professional Medical Lab Management
        </p>
      </div>

      <style>{`
        @keyframes orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes logo-enter {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes logo-pulse {
          0%, 100% { filter: drop-shadow(0 0 20px hsl(162 84% 42% / 0.4)); }
          50% { filter: drop-shadow(0 0 35px hsl(162 84% 42% / 0.7)); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
