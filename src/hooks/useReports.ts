import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Report, ReportType } from '@/types/database';
import { toast } from 'sonner';

export const useReports = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['reports', profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return [];

      const { data, error } = await supabase
        .from('reports')
        .select('*, patient:patients(*)')
        .eq('clinic_id', profile.clinic_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
    enabled: !!profile?.clinic_id,
  });
};

export const useCreateReport = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportData: {
      patient_id: string;
      report_type: ReportType;
      report_data: Record<string, string | number | boolean | null>;
      referring_doctor?: string;
      clinical_notes?: string;
      test_date: string;
      status: 'draft' | 'completed';
    }) => {
      if (!profile?.clinic_id) throw new Error('No clinic found');

      // Generate report number
      const reportNumber = `RPT-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from('reports')
        .insert([{
          clinic_id: profile.clinic_id,
          created_by: user?.id,
          report_number: reportNumber,
          patient_id: reportData.patient_id,
          report_type: reportData.report_type,
          report_data: reportData.report_data,
          referring_doctor: reportData.referring_doctor,
          clinical_notes: reportData.clinical_notes,
          test_date: reportData.test_date,
          status: reportData.status,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create report: ' + error.message);
    },
  });
};
