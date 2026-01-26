import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Report } from '@/types/database';
import { toast } from 'sonner';

export const useReport = (reportId: string | undefined) => {
  return useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      if (!reportId) return null;

      const { data, error } = await supabase
        .from('reports')
        .select('*, patient:patients(*)')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      return data as Report;
    },
    enabled: !!reportId,
  });
};

export const usePatientReports = (patientId: string | undefined) => {
  return useQuery({
    queryKey: ['patient-reports', patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
    enabled: !!patientId,
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      report_data?: Record<string, unknown>;
      status?: 'draft' | 'completed' | 'verified';
      referring_doctor?: string;
      clinical_notes?: string;
    }) => {
      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from('reports')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Report updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update report: ' + error.message);
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Report deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete report: ' + error.message);
    },
  });
};
