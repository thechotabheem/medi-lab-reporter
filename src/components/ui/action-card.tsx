import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconWrapper, type IconWrapperProps } from "@/components/ui/icon-wrapper";
import { LucideIcon } from "lucide-react";

interface ActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconVariant?: IconWrapperProps["variant"];
  onClick?: () => void;
  className?: string;
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  iconVariant = "default",
  onClick,
  className,
}: ActionCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 ease-out",
        "hover:border-primary/40 hover:shadow-lg hover:-translate-y-1",
        "active:translate-y-0 active:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="p-4 sm:p-6">
        <IconWrapper
          variant={iconVariant}
          size="lg"
          className="mb-3 group-hover:scale-105 transition-transform duration-300"
        >
          <Icon className="h-6 w-6" />
        </IconWrapper>
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs sm:text-sm line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}
