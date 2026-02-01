import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ServiceWorkerUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[SW] Service worker registered:', swUrl);
      
      // Check for updates every 5 minutes
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('[SW] Registration error:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast(
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            <span>New version available!</span>
          </div>
          <Button
            size="sm"
            onClick={() => updateServiceWorker(true)}
            className="shrink-0"
          >
            Refresh
          </Button>
        </div>,
        {
          duration: Infinity,
          id: 'sw-update',
        }
      );
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
