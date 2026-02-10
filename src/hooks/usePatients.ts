import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { getPendingActions, type OfflineAction } from '@/lib/offlineQueue';
import type { Patient } from '@/types/database';

export interface PatientWithPending extends Patient {
  _isPending?: boolean;
}

export const usePatients = () => {
  const { clinicId } = useClinic();
  const [pendingPatients, setPendingPatients] = useState<PatientWithPending[]>([]);

  // Load pending offline patients
  useEffect(() => {
    const loadPending = async () => {
      try {
        const actions = await getPendingActions();
        const patients = actions
          .filter((a: OfflineAction) => a.type === 'create-patient')
          .map((a: OfflineAction) => ({
            id: `pending-${a.id}`,
            clinic_id: (a.payload.clinic_id as string) || '',
            full_name: (a.payload.full_name as string) || 'Unknown',
            date_of_birth: (a.payload.date_of_birth as string) || '',
            gender: (a.payload.gender as Patient['gender']) || 'other',
            phone: (a.payload.phone as string) || null,
            email: (a.payload.email as string) || null,
            patient_id_number: (a.payload.patient_id_number as string) || null,
            address: (a.payload.address as string) || null,
            created_at: a.createdAt,
            updated_at: a.createdAt,
            _isPending: true,
          }));
        setPendingPatients(patients);
      } catch {
        // IndexedDB unavailable
      }
    };
    loadPending();
    // Re-check on online event
    window.addEventListener('online', loadPending);
    return () => window.removeEventListener('online', loadPending);
  }, []);

  const query = useQuery({
    queryKey: ['patients', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!clinicId,
  });

  // Merge pending patients into the list
  const mergedData: PatientWithPending[] | undefined = query.data
    ? [...pendingPatients, ...query.data]
    : pendingPatients.length > 0
    ? pendingPatients
    : undefined;

  return {
    ...query,
    data: mergedData,
  };
};
