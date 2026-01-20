import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Gender } from '@/types/database';
import { toast } from 'sonner';

interface UpdatePatientData {
  id: string;
  first_name?: string;
  last_name?: string;
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
      toast.success('Patient updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update patient: ' + error.message);
    },
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete patient: ' + error.message);
    },
  });
};

export const usePatient = (patientId: string | undefined) => {
  const { profile } = useAuth();

  return {
    ...require('@tanstack/react-query').useQuery({
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
      enabled: !!patientId && !!profile?.clinic_id,
    }),
  };
};
