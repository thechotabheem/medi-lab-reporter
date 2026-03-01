import { WifiOff, CloudOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function OfflineFormBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <Alert variant="destructive" className="border-warning/50 bg-warning/10 text-warning-foreground animate-fade-in-up">
      <WifiOff className="h-4 w-4 !text-warning" />
      <AlertTitle className="text-sm font-semibold text-warning">You're working offline</AlertTitle>
      <AlertDescription className="text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 mt-1">
          <CloudOff className="h-3 w-3 shrink-0" />
          <span>Your changes will be saved locally and synced automatically when you reconnect.</span>
        </div>
      </AlertDescription>
    </Alert>
  );
}
