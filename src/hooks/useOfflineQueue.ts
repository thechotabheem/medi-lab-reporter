import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getPendingActions,
  removeAction,
  updateActionStatus,
  getPendingCount,
  type OfflineAction,
} from '@/lib/offlineQueue';
import { playSyncSound, triggerVibration, type SyncResult } from '@/lib/syncNotifications';

const MAX_RETRIES = 3;

export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [showSyncPopup, setShowSyncPopup] = useState(false);
  const syncLockRef = useRef(false);
  const queryClient = useQueryClient();

  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
      const actions = await getPendingActions();
      setPendingActions(actions);
    } catch {
      // IndexedDB may not be available
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (syncLockRef.current || !navigator.onLine) return;
    syncLockRef.current = true;
    setIsSyncing(true);

    try {
      const actions = await getPendingActions();
      if (actions.length === 0) {
        setIsSyncing(false);
        syncLockRef.current = false;
        return;
      }

      let synced = 0;
      let failed = 0;

      for (const action of actions) {
        if (action.retryCount >= MAX_RETRIES) {
          failed++;
          continue;
        }

        try {
          await updateActionStatus(action.id, 'syncing');

          if (action.type === 'create-patient') {
            const { error } = await supabase
              .from('patients')
              .insert(action.payload as any);
            if (error) throw error;
          } else if (action.type === 'create-report') {
            const payload = action.payload as any;
            if (payload._newPatient) {
              const { data: newPatient, error: patientError } = await supabase
                .from('patients')
                .insert(payload._newPatient)
                .select()
                .single();
              if (patientError) throw patientError;
              payload.patient_id = newPatient.id;
              delete payload._newPatient;
            }
            const { error } = await supabase
              .from('reports')
              .insert(payload);
            if (error) throw error;
          } else if (action.type === 'update-patient') {
            const { _entityId, ...updateData } = action.payload as any;
            const entityId = action.entityId || _entityId;
            if (entityId) {
              const { error } = await supabase
                .from('patients')
                .update(updateData)
                .eq('id', entityId);
              if (error) throw error;
            }
          } else if (action.type === 'update-report') {
            const { _entityId, ...updateData } = action.payload as any;
            const entityId = action.entityId || _entityId;
            if (entityId) {
              const { error } = await supabase
                .from('reports')
                .update(updateData)
                .eq('id', entityId);
              if (error) throw error;
            }
          }

          await removeAction(action.id);
          synced++;
        } catch {
          await updateActionStatus(
            action.id,
            'failed',
            action.retryCount + 1
          );
          failed++;
        }
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      const result: SyncResult = { synced, failed };
      setLastSyncResult(result);

      if (synced > 0) {
        // Trigger sound & vibration
        playSyncSound();
        triggerVibration();
        // Show popup
        setShowSyncPopup(true);
        toast.success(`${synced} offline item${synced > 1 ? 's' : ''} synced successfully`);
      }
      if (failed > 0) {
        toast.error(`${failed} item${failed > 1 ? 's' : ''} failed to sync`);
      }
    } catch {
      toast.error('Sync failed unexpectedly');
    } finally {
      setIsSyncing(false);
      syncLockRef.current = false;
      await refreshCount();
    }
  }, [queryClient, refreshCount]);

  const dismissSyncPopup = useCallback(() => {
    setShowSyncPopup(false);
  }, []);

  const discardAction = useCallback(async (id: string) => {
    await removeAction(id);
    await refreshCount();
    toast.info('Queued item discarded');
  }, [refreshCount]);

  const retrySync = useCallback(() => {
    processQueue();
  }, [processQueue]);

  // Listen to online/offline events
  useEffect(() => {
    refreshCount();

    const handleOnline = () => {
      processQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processQueue, refreshCount]);

  // Initial sync attempt if online
  useEffect(() => {
    if (navigator.onLine) {
      processQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    pendingCount,
    pendingActions,
    isSyncing,
    processQueue,
    discardAction,
    retrySync,
    refreshCount,
    lastSyncResult,
    showSyncPopup,
    dismissSyncPopup,
  };
}
