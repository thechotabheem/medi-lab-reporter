import * as React from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div className={cn("animate-fade-in", className)}>
      {children}
    </div>
  );
}

interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({ children, className, staggerDelay = 50 }: StaggeredListProps) {
  return (
    <div className={cn("", className)}>
      {React.Children.map(children, (child, index) => (
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * staggerDelay}ms`, animationFillMode: "backwards" }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <div
      className={cn("animate-fade-in", className)}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      {children}
    </div>
  );
}

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, className }: ScaleInProps) {
  return (
    <div
      className={cn("animate-scale-in", className)}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      {children}
    </div>
  );
}
