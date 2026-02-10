import { useState } from 'react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Trash2, CloudOff, X } from 'lucide-react';
import { format } from 'date-fns';

export function OfflineSyncStatus() {
  const { pendingCount, pendingActions, isSyncing, retrySync, discardAction } = useOfflineQueue();
  const [isOpen, setIsOpen] = useState(false);

  if (pendingCount === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 sm:bottom-6">
      {/* Floating badge */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
        >
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <CloudOff className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {pendingCount} pending
          </span>
        </button>
      )}

      {/* Expanded panel */}
      {isOpen && (
        <Card className="w-72 shadow-2xl border-primary/30">
          <CardHeader className="p-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Offline Queue</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={retrySync}
                disabled={isSyncing || !navigator.onLine}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2 max-h-60 overflow-y-auto">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border text-xs"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate capitalize">
                    {action.type.replace('-', ' ')}
                  </p>
                  <p className="text-muted-foreground">
                    {format(new Date(action.createdAt), 'MMM d, HH:mm')}
                  </p>
                  {action.retryCount >= 3 && (
                    <Badge variant="destructive" className="text-[10px] mt-1">
                      Max retries reached
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => discardAction(action.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            {!navigator.onLine && (
              <p className="text-[10px] text-muted-foreground text-center py-1">
                Will sync automatically when online
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
