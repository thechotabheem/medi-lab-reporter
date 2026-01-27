import * as React from "react";
import { cn } from "@/lib/utils";

interface RippleProps {
  ripples: Array<{
    id: number;
    x: number;
    y: number;
    size: number;
  }>;
}

export function Ripple({ ripples }: RippleProps) {
  return (
    <>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-primary/20 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </>
  );
}

interface RippleContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const RippleContainer = React.forwardRef<HTMLDivElement, RippleContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

RippleContainer.displayName = "RippleContainer";
