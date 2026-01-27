import * as React from "react";
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

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (glowEffect) {
      createRipple(e);
    }
    onClick?.();
  };

  return (
    <Card
      ref={containerRef}
      className={cn(
        "group transition-all duration-300 ease-out relative overflow-hidden",
        onClick && "cursor-pointer",
        onClick && !glowEffect && "hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
        glowEffect && "animate-pulse-glow border-primary/20",
        className
      )}
      onClick={handleClick}
    >
      {glowEffect && <Ripple ripples={ripples} />}
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-16 skeleton rounded" />
        ) : (
          <div className="text-xl sm:text-2xl font-bold tracking-tight">
            {value}
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {trend && (
          <p
            className={cn(
              "text-xs mt-1",
              trend.value >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
