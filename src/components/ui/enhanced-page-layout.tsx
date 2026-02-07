import * as React from "react";
import { cn } from "@/lib/utils";
import { CursorGlow } from "@/components/ui/cursor-glow";

interface EnhancedPageLayoutProps {
  children: React.ReactNode;
  className?: string;
  showCursorGlow?: boolean;
  showDivider?: boolean;
}

export function EnhancedPageLayout({
  children,
  className,
  showCursorGlow = true,
  showDivider = true,
}: EnhancedPageLayoutProps) {
  return (
    <div className={cn("page-container dashboard-bg", className)}>
      {showCursorGlow && <CursorGlow />}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

export function HeaderDivider() {
  return (
    <div className="relative">
      <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute inset-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm" />
    </div>
  );
}
