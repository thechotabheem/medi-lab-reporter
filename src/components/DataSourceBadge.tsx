import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, Database } from 'lucide-react';
import type { DataSource } from '@/hooks/useDataFreshness';

interface DataSourceBadgeProps {
  dataSource: DataSource;
  lastFetchedAt?: Date | null;
}

const config: Record<DataSource, { label: string; dotClass: string; Icon: typeof Wifi }> = {
  live: { label: 'Live', dotClass: 'bg-emerald-500', Icon: Wifi },
  cache: { label: 'Cached', dotClass: 'bg-amber-500', Icon: Database },
  offline: { label: 'Offline', dotClass: 'bg-destructive', Icon: WifiOff },
};

export function DataSourceBadge({ dataSource, lastFetchedAt }: DataSourceBadgeProps) {
  const { label, dotClass, Icon } = config[dataSource];

  const tooltipText = lastFetchedAt
    ? `${label} • Last fetched ${lastFetchedAt.toLocaleTimeString()}`
    : `${label} data`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border border-border bg-muted/50 text-muted-foreground cursor-default select-none">
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass} animate-pulse`} />
          <Icon className="h-3 w-3" />
          <span className="hidden sm:inline">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
