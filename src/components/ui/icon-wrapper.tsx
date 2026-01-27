import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const iconWrapperVariants = cva(
  "inline-flex items-center justify-center rounded-xl transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        muted: "bg-muted text-muted-foreground",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        ghost: "bg-transparent text-foreground",
        gradient: "gradient-primary text-primary-foreground",
        interactive: "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
      },
      size: {
        sm: "h-8 w-8",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-14 w-14",
      },
      glow: {
        true: "shadow-glow-sm",
        false: "",
      },
      hoverPulse: {
        true: "hover:animate-icon-pulse cursor-pointer",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: false,
      hoverPulse: false,
    },
  }
);

export interface IconWrapperProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconWrapperVariants> {}

const IconWrapper = React.forwardRef<HTMLDivElement, IconWrapperProps>(
  ({ className, variant, size, glow, hoverPulse, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(iconWrapperVariants({ variant, size, glow, hoverPulse, className }))}
        {...props}
      />
    );
  }
);
IconWrapper.displayName = "IconWrapper";

export { IconWrapper, iconWrapperVariants };
