import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number;
}

export function SplashScreen({ onComplete, minDisplayTime = 1800 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      // Wait for exit animation to complete before calling onComplete
      setTimeout(onComplete, 500);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime, onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500",
        isExiting && "opacity-0 pointer-events-none"
      )}
    >
      {/* Background ambient glow */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(162 84% 42% / 0.08) 0%, transparent 60%)',
        }}
      />

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Animated logo container */}
        <div className="relative animate-fade-in-up">
          {/* Outer glow ring */}
          <div 
            className="absolute inset-0 rounded-full blur-xl animate-pulse"
            style={{
              background: 'radial-gradient(circle, hsl(162 84% 42% / 0.4) 0%, transparent 70%)',
              transform: 'scale(1.5)',
            }}
          />
          
          {/* Logo */}
          <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
            <img 
              src="/icon.svg" 
              alt="Lab Reporter" 
              className="w-full h-full object-contain drop-shadow-[0_0_20px_hsl(162_84%_42%_/_0.5)]"
            />
          </div>
        </div>

        {/* App name with shimmer effect */}
        <div className="flex flex-col items-center gap-2 animate-fade-in-up animation-delay-200">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient-shimmer">
            Lab Reporter
          </h1>
          <p className="text-muted-foreground text-sm md:text-base animate-fade-in animation-delay-400">
            Zia Clinic & Maternity Home
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center gap-2 animate-fade-in animation-delay-600">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                style={{
                  animation: 'bounce 1s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Keyframes for bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
