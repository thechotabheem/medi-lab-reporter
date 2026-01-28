import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Sparkles } from 'lucide-react';

interface SuccessAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
  message?: string;
  submessage?: string;
}

export function SuccessAnimation({
  isVisible,
  onComplete,
  message = 'Success!',
  submessage,
}: SuccessAnimationProps) {
  const [stage, setStage] = useState<'enter' | 'visible' | 'exit' | 'hidden'>('hidden');

  useEffect(() => {
    if (isVisible) {
      setStage('enter');
      // After enter animation
      const visibleTimer = setTimeout(() => setStage('visible'), 400);
      // Start exit after a delay
      const exitTimer = setTimeout(() => setStage('exit'), 1800);
      // Complete after exit animation
      const completeTimer = setTimeout(() => {
        setStage('hidden');
        onComplete?.();
      }, 2200);

      return () => {
        clearTimeout(visibleTimer);
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setStage('hidden');
    }
  }, [isVisible, onComplete]);

  if (stage === 'hidden') return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-sm transition-opacity duration-300',
        stage === 'enter' && 'animate-fade-in',
        stage === 'exit' && 'opacity-0'
      )}
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/60"
            style={{
              left: `${50 + Math.cos((i * 30 * Math.PI) / 180) * 30}%`,
              top: `${50 + Math.sin((i * 30 * Math.PI) / 180) * 30}%`,
              animation: `success-particle 0.6s ease-out ${i * 0.05}s forwards`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div
        className={cn(
          'relative flex flex-col items-center gap-4 transition-all duration-500',
          stage === 'enter' && 'scale-50 opacity-0',
          stage === 'visible' && 'scale-100 opacity-100',
          stage === 'exit' && 'scale-110 opacity-0'
        )}
      >
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background: 'radial-gradient(circle, hsl(162 84% 42% / 0.4) 0%, transparent 70%)',
            transform: 'scale(2)',
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />

        {/* Check icon container */}
        <div className="relative">
          {/* Outer ring animation */}
          <div
            className="absolute inset-0 rounded-full border-4 border-primary/30"
            style={{
              animation: stage === 'visible' ? 'success-ring 0.8s ease-out forwards' : 'none',
            }}
          />
          
          {/* Icon background */}
          <div className="relative w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
            <CheckCircle
              className={cn(
                'w-14 h-14 text-primary transition-all duration-500',
                stage === 'visible' && 'animate-bounce'
              )}
              strokeWidth={2.5}
            />
          </div>

          {/* Sparkles */}
          <Sparkles
            className="absolute -top-2 -right-2 w-6 h-6 text-primary"
            style={{
              animation: stage === 'visible' ? 'sparkle 0.8s ease-out infinite' : 'none',
            }}
          />
          <Sparkles
            className="absolute -bottom-1 -left-3 w-5 h-5 text-primary/70"
            style={{
              animation: stage === 'visible' ? 'sparkle 0.8s ease-out 0.2s infinite' : 'none',
            }}
          />
        </div>

        {/* Text */}
        <div className="text-center mt-2">
          <h2 className="text-2xl font-bold text-foreground">{message}</h2>
          {submessage && (
            <p className="text-sm text-muted-foreground mt-1">{submessage}</p>
          )}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes success-particle {
          0% {
            transform: scale(0) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: scale(1) translate(
              ${Math.random() > 0.5 ? '' : '-'}${20 + Math.random() * 40}px,
              ${Math.random() > 0.5 ? '' : '-'}${20 + Math.random() * 40}px
            );
            opacity: 0;
          }
        }
        
        @keyframes success-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}