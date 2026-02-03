import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SparkleText } from '@/components/ui/sparkle-text';

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number;
}

export function SplashScreen({ onComplete, minDisplayTime = 2000 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
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

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 overflow-hidden",
        isExiting && "opacity-0 pointer-events-none"
      )}
    >
      {/* Layer 1: Primary radial glow */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(162 84% 42% / 0.15) 0%, transparent 60%)',
        }}
      />

      {/* Layer 2: Dot grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at center, hsl(162 84% 42%) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Layer 3: Vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background)) 100%)',
        }}
      />

      {/* Layer 4: Animated shimmer sweep */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, hsl(162 84% 42% / 0.03) 45%, hsl(162 84% 42% / 0.06) 50%, hsl(162 84% 42% / 0.03) 55%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-sweep 4s ease-in-out infinite',
        }}
      />

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Logo container with concentric rings */}
        <div className="relative animate-float" style={{ animationDelay: '200ms' }}>
          {/* Concentric glow rings */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(162 84% 42% / 0.3) 0%, transparent 70%)',
              transform: 'scale(2.5)',
              animation: 'ring-pulse 3s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(162 84% 42% / 0.2) 0%, transparent 70%)',
              transform: 'scale(2)',
              animation: 'ring-pulse 3s ease-in-out infinite 0.5s',
            }}
          />
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(162 84% 42% / 0.4) 0%, transparent 70%)',
              transform: 'scale(1.5)',
              animation: 'ring-pulse 3s ease-in-out infinite 1s',
            }}
          />
          
          {/* Logo with scale entrance */}
          <div 
            className="relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center"
            style={{
              animation: 'scale-in 0.6s ease-out forwards',
              animationDelay: '200ms',
              opacity: 0,
            }}
          >
            <img 
              src="/icon.svg" 
              alt="Lab Reporter" 
              className="w-full h-full object-contain drop-shadow-[0_0_30px_hsl(162_84%_42%_/_0.6)]"
            />
          </div>
        </div>

        {/* App name with shimmer effect */}
        <div 
          className="flex flex-col items-center gap-3"
          style={{
            animation: 'fade-in-up 0.5s ease-out forwards',
            animationDelay: '400ms',
            opacity: 0,
          }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-shimmer tracking-tight">
            Lab Reporter
          </h1>
        </div>

        {/* Clinic name with SparkleText */}
        <div
          style={{
            animation: 'fade-in-up 0.5s ease-out forwards',
            animationDelay: '600ms',
            opacity: 0,
          }}
        >
          <SparkleText className="text-base md:text-lg text-muted-foreground font-medium" sparkleCount={3}>
            Zia Clinic & Maternity Home
          </SparkleText>
        </div>

        {/* Professional tagline */}
        <p 
          className="text-xs md:text-sm text-muted-foreground/60 tracking-widest uppercase"
          style={{
            animation: 'fade-in-up 0.5s ease-out forwards',
            animationDelay: '800ms',
            opacity: 0,
          }}
        >
          Professional Medical Lab Management
        </p>

        {/* Animated progress bar */}
        <div 
          className="w-48 md:w-56 mt-4"
          style={{
            animation: 'fade-in-up 0.5s ease-out forwards',
            animationDelay: '800ms',
            opacity: 0,
          }}
        >
          <div className="h-1 bg-secondary/30 rounded-full overflow-hidden backdrop-blur-sm border border-border/20">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-100 ease-out"
              style={{ 
                width: `${progress}%`,
                boxShadow: '0 0 12px hsl(162 84% 42% / 0.5), 0 0 4px hsl(162 84% 42% / 0.8)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes shimmer-sweep {
          0%, 100% {
            background-position: 200% 0;
          }
          50% {
            background-position: -200% 0;
          }
        }
        
        @keyframes ring-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(var(--ring-scale, 1.5));
          }
          50% {
            opacity: 0.6;
            transform: scale(calc(var(--ring-scale, 1.5) * 1.1));
          }
        }
        
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
