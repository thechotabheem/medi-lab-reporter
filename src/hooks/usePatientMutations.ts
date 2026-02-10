import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Gender } from '@/types/database';
import { toast } from 'sonner';
import { enqueueAction } from '@/lib/offlineQueue';

interface UpdatePatientData {
  id: string;
  full_name?: string;
  date_of_birth?: string;
  gender?: Gender;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  patient_id_number?: string | null;
}

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePatientData) => {
      const { id, ...updateData } = data;

      if (!navigator.onLine) {
        await enqueueAction('update-patient', { ...updateData, _entityId: id });
        toast.success('Update saved offline - will sync when connected');
        // Return a fake result for optimistic UI
        return { ...updateData, id } as any;
      }

      const { data: result, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient'] });
      if (navigator.onLine) {
        toast.success('Patient updated successfully');
      }
    },
    onError: async (error, variables) => {
      // Network error fallback
      if (!navigator.onLine || error.message?.includes('fetch')) {
        const { id, ...updateData } = variables;
        await enqueueAction('update-patient', { ...updateData, _entityId: id });
        toast.success('Update saved offline - will sync when connected');
        return;
      }
      toast.error('Failed to update patient: ' + error.message);
    },
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: string) => {
      if (!navigator.onLine) {
        await enqueueAction('delete-patient', { _entityId: patientId });
        toast.success('Delete saved offline - will sync when connected');
        return;
      }

      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      if (navigator.onLine) {
        toast.success('Patient deleted successfully');
      }
    },
    onError: async (error, patientId) => {
      if (!navigator.onLine || error.message?.includes('fetch')) {
        await enqueueAction('delete-patient', { _entityId: patientId });
        toast.success('Delete saved offline - will sync when connected');
        return;
      }
      toast.error('Failed to delete patient: ' + error.message);
    },
  });
};

export const usePatient = (patientId: string | undefined) => {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (!patientId) return null;

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
};
