import { useState, useEffect, useRef } from 'react';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export const OfflineBanner = () => {
  const { isOnline } = useNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current && isOnline) {
      toast({
        title: "Back online",
        description: "Your internet connection has been restored.",
        duration: 4000,
      });
      wasOfflineRef.current = false;
    }
  }, [isOnline]);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    // Attempt to fetch a small resource to verify connectivity
    try {
      await fetch('https://www.google.com/favicon.ico', { 
        mode: 'no-cors',
        cache: 'no-store' 
      });
    } catch {
      // Fetch failed, still offline
    }
    
    // Give a moment for the browser's online status to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRetrying(false);
  };

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-amber-50 py-2 px-4 animate-slide-down">
      <div className="flex items-center justify-center gap-3 text-sm font-medium">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>You're offline — Check your internet connection</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRetry}
          disabled={isRetrying}
          className="h-7 px-2.5 bg-amber-700/50 hover:bg-amber-700 text-amber-50 border-none transition-all duration-150 active:scale-[0.97]"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </Button>
      </div>
    </div>
  );
};
