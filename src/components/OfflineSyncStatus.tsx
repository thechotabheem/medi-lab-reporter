import { useState, useEffect } from 'react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Trash2, CloudOff, X, CheckCircle, Cloud } from 'lucide-react';
import { format } from 'date-fns';

export function OfflineSyncStatus() {
  const {
    pendingCount,
    pendingActions,
    isSyncing,
    retrySync,
    discardAction,
    lastSyncResult,
    showSyncPopup,
    dismissSyncPopup,
  } = useOfflineQueue();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-dismiss sync popup after 5 seconds
  useEffect(() => {
    if (showSyncPopup) {
      const timer = setTimeout(dismissSyncPopup, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSyncPopup, dismissSyncPopup]);

  return (
    <>
      {/* Sync Success Popup - slides in from top */}
      {showSyncPopup && lastSyncResult && lastSyncResult.synced > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
          <Card className="shadow-2xl border-primary/50 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 text-primary animate-bounce" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  Sync Complete!
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastSyncResult.synced} item{lastSyncResult.synced > 1 ? 's' : ''} synced to server
                  {lastSyncResult.failed > 0 && ` • ${lastSyncResult.failed} failed`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 ml-2"
                onClick={dismissSyncPopup}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending queue indicator */}
      {pendingCount > 0 && (
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
                        {action.type.replace(/-/g, ' ')}
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
      )}
    </>
  );
}
