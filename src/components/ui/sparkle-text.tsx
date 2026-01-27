import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparkleProps {
  size: number;
  color: string;
  style: React.CSSProperties;
  delay: number;
}

const Sparkle: React.FC<SparkleProps> = ({ size, color, style, delay }) => {
  return (
    <span
      className="absolute pointer-events-none animate-sparkle"
      style={{
        ...style,
        width: size,
        height: size,
        animationDelay: `${delay}ms, ${delay + 600}ms`,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
          fill={color}
        />
      </svg>
    </span>
  );
};

interface SparkleTextProps {
  children: React.ReactNode;
  className?: string;
  sparkleCount?: number;
}

const SPARKLE_COLORS = [
  '#FF00FF', // Magenta
  '#00D4FF', // Electric Blue
  '#39FF14', // Lime Green
  '#FFD700', // Golden Yellow
  '#FF6B00', // Electric Orange
  '#FF1493', // Hot Pink
  '#8B5CF6', // Violet
];

export const SparkleText: React.FC<SparkleTextProps> = ({
  children,
  className,
  sparkleCount = 8,
}) => {
  const sparkles = useMemo(() => {
    return Array.from({ length: sparkleCount }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 5, // 5-8px (smaller)
      color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
      style: {
        top: `${Math.random() * 100}%`, // Stay within bounds
        left: `${Math.random() * 100}%`,
      },
      delay: i * 400, // Slower stagger
    }));
  }, [sparkleCount]);

  return (
    <span className={cn('relative inline-block', className)}>
      {sparkles.map((sparkle) => (
        <Sparkle
          key={sparkle.id}
          size={sparkle.size}
          color={sparkle.color}
          style={sparkle.style}
          delay={sparkle.delay}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </span>
  );
};
