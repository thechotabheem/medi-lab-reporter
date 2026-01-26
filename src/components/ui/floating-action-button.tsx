import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export const FloatingActionButton = ({
  onClick,
  icon = <Plus className="h-6 w-6" />,
  label,
  className,
}: FloatingActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg',
        'bg-primary hover:bg-primary/90 text-primary-foreground',
        'transition-all duration-200 hover:scale-105 active:scale-95',
        'print-hide',
        label && 'w-auto px-4 gap-2',
        className
      )}
      size="icon"
    >
      {icon}
      {label && <span className="font-medium">{label}</span>}
    </Button>
  );
};
