import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const iconWrapperVariants = cva(
  "inline-flex items-center justify-center rounded-xl transition-all duration-200",
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
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: false,
    },
  }
);

export interface IconWrapperProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconWrapperVariants> {}

const IconWrapper = React.forwardRef<HTMLDivElement, IconWrapperProps>(
  ({ className, variant, size, glow, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(iconWrapperVariants({ variant, size, glow, className }))}
        {...props}
      />
    );
  }
);
IconWrapper.displayName = "IconWrapper";

export { IconWrapper, iconWrapperVariants };
