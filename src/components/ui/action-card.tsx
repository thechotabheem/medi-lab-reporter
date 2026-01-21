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
        "group cursor-pointer transition-all duration-300 ease-out h-full",
        "hover:border-primary/40 hover:shadow-lg hover:-translate-y-1",
        "active:translate-y-0 active:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="p-4 sm:p-6 h-full flex flex-col">
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
  );
}
