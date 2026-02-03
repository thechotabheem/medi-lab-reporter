import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconWrapper, type IconWrapperProps } from "@/components/ui/icon-wrapper";
import { Ripple } from "@/components/ui/ripple";
import { useRipple } from "@/hooks/useRipple";
import { LucideIcon } from "lucide-react";

interface ActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconVariant?: IconWrapperProps["variant"];
  onClick?: () => void;
  className?: string;
  glowEffect?: boolean;
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  iconVariant = "default",
  onClick,
  className,
  glowEffect = false,
}: ActionCardProps) {
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
    
    // Calculate icon parallax offset (opposite direction, max 8px)
    const iconOffsetX = ((x - centerX) / centerX) * -8;
    const iconOffsetY = ((y - centerY) / centerY) * -8;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate(${magnetX}px, ${magnetY}px) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    });
    
    setIconStyle({
      transform: `translate(${iconOffsetX}px, ${iconOffsetY}px) scale(1.05)`,
      transition: 'transform 0.1s ease-out'
    });
    
    setGlowPosition({ x, y, opacity: 1 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
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
          "group cursor-pointer transition-all duration-300 ease-out relative overflow-hidden h-full",
          !glowEffect && "hover:border-primary/40 hover:shadow-lg",
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
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
            opacity: glowPosition.opacity,
          }}
        />
        <CardHeader className="p-[8%] h-full flex flex-col justify-center relative z-10">
          <IconWrapper
            variant={iconVariant}
            size="lg"
            className="mb-[6%] shrink-0 !h-[clamp(2rem,4vw+2vh,4rem)] !w-[clamp(2rem,4vw+2vh,4rem)]"
            style={iconStyle}
          >
            <Icon className="h-[clamp(1rem,2vw+1vh,2rem)] w-[clamp(1rem,2vw+1vh,2rem)]" />
          </IconWrapper>
          <CardTitle className="text-[clamp(0.75rem,1.5vw+0.8vh,1.5rem)] font-semibold leading-tight">{title}</CardTitle>
          {description && (
            <CardDescription className="text-[clamp(0.6rem,1vw+0.5vh,1rem)] line-clamp-3 mt-[4%] flex-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </div>
  );
}
