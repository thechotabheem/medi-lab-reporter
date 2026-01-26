import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import type { Report, ReportType } from '@/types/database';
import { toast } from 'sonner';

export const useReports = () => {
  const { clinicId } = useClinic();

  return useQuery({
    queryKey: ['reports', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*, patient:patients(*)')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
    enabled: !!clinicId,
  });
};

export const useCreateReport = () => {
  const { clinicId } = useClinic();
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
      if (!clinicId) throw new Error('No clinic found');

      // Generate report number
      const reportNumber = `RPT-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from('reports')
        .insert([{
          clinic_id: clinicId,
          created_by: null,
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
