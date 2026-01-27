import * as React from "react";
import { useState, useRef, useCallback } from "react";
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
  const tiltRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({ transform: '', transition: '' });

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
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.3s ease-out'
    });
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (glowEffect) {
      createRipple(e);
    }
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
          "group cursor-pointer transition-all duration-300 ease-out h-full relative overflow-hidden",
          !glowEffect && "hover:border-primary/40 hover:shadow-lg",
          glowEffect && "animate-pulse-glow border-primary/20 card-gradient-overlay",
          className
        )}
        onClick={handleClick}
      >
        {glowEffect && <Ripple ripples={ripples} />}
        <CardHeader className="p-4 sm:p-6 h-full flex flex-col relative z-10">
          <IconWrapper
            variant={iconVariant}
            size="lg"
            className="mb-3 group-hover:scale-105 transition-transform duration-300 shrink-0"
          >
            <Icon className="h-5 w-5" />
          </IconWrapper>
          <CardTitle className="text-sm sm:text-base font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs sm:text-sm line-clamp-2 mt-1 flex-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </div>
  );
}
