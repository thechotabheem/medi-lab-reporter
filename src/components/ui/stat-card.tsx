import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ripple } from "@/components/ui/ripple";
import { useRipple } from "@/hooks/useRipple";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  onClick?: () => void;
  className?: string;
  loading?: boolean;
  glowEffect?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  onClick,
  className,
  loading = false,
  glowEffect = false,
}: StatCardProps) {
  const { ripples, createRipple, containerRef } = useRipple();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isBouncing, setIsBouncing] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({ transform: '', transition: '' });
  const [iconStyle, setIconStyle] = useState({ transform: '', transition: '' });
  const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0, opacity: 0 });

  useEffect(() => {
    // Remove shimmer effect after initial load animation completes
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltRef.current) return;
    
    const rect = tiltRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate tilt angles (max 6 degrees)
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    
    // Calculate magnetic pull toward cursor (max 4px)
    const magnetX = ((x - centerX) / centerX) * 4;
    const magnetY = ((y - centerY) / centerY) * 4;
    
    // Calculate icon parallax offset (opposite direction, max 6px)
    const iconOffsetX = ((x - centerX) / centerX) * -6;
    const iconOffsetY = ((y - centerY) / centerY) * -6;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate(${magnetX}px, ${magnetY}px) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    });
    
    setIconStyle({
      transform: `translate(${iconOffsetX}px, ${iconOffsetY}px) scale(1.1)`,
      transition: 'transform 0.1s ease-out'
    });
    
    setGlowPosition({ x, y, opacity: 1 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translate(0px, 0px) scale3d(1, 1, 1)',
      transition: 'transform 0.3s ease-out'
    });
    setIconStyle({
      transform: 'translate(0px, 0px) scale(1)',
      transition: 'transform 0.3s ease-out'
    });
    setGlowPosition(prev => ({ ...prev, opacity: 0 }));
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (glowEffect) {
      createRipple(e);
    }
    // Trigger bounce animation
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 350);
    onClick?.();
  };

  return (
    <div
      ref={tiltRef}
      style={tiltStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="h-full"
    >
      <Card
        ref={containerRef}
        className={cn(
          "group transition-all duration-300 ease-out relative overflow-hidden h-full",
          onClick && "cursor-pointer",
          onClick && !glowEffect && "hover:border-primary/40",
          glowEffect && "animate-pulse-glow border-primary/20 card-gradient-overlay",
          isInitialLoad && "animate-stat-shimmer",
          isBouncing && "animate-card-bounce",
          className
        )}
        onClick={handleClick}
      >
        {glowEffect && <Ripple ripples={ripples} />}
        <div
          className="absolute pointer-events-none transition-opacity duration-300 rounded-full"
          style={{
            left: glowPosition.x,
            top: glowPosition.y,
            transform: 'translate(-50%, -50%)',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
            opacity: glowPosition.opacity,
          }}
        />
        <CardHeader className="flex flex-row items-center justify-between pb-[0.5vh] space-y-0 relative z-10 px-[2%] pt-[3%]">
          <CardTitle className="font-medium text-muted-foreground" style={{ fontSize: 'clamp(0.65rem, 1.2vw, 1.1rem)' }}>
            {title}
          </CardTitle>
          {Icon && (
            <Icon 
              className="text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:scale-110" 
              style={{ ...iconStyle, width: 'clamp(1rem, 2vw, 2rem)', height: 'clamp(1rem, 2vw, 2rem)' }}
            />
          )}
        </CardHeader>
        <CardContent className="relative z-10 px-[2%] pb-[3%] pt-0 flex-1 flex flex-col justify-center">
          {loading ? (
            <div className="skeleton rounded" style={{ height: 'clamp(1.5rem, 3vh, 3rem)', width: 'clamp(3rem, 6vw, 6rem)' }} />
          ) : (
            <div className="font-bold tracking-tight" style={{ fontSize: 'clamp(1.25rem, 3.5vw, 4rem)' }}>
              {value}
            </div>
          )}
          {subtitle && (
            <p className="text-muted-foreground" style={{ fontSize: 'clamp(0.6rem, 1vw, 1rem)', marginTop: 'clamp(0.125rem, 0.5vh, 0.5rem)' }}>{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                trend.value >= 0 ? "text-success" : "text-destructive"
              )}
              style={{ fontSize: 'clamp(0.6rem, 1vw, 0.875rem)', marginTop: 'clamp(0.25rem, 0.5vh, 0.5rem)' }}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
