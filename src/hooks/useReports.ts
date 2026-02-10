import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { getPendingActions, type OfflineAction } from '@/lib/offlineQueue';
import type { Report, ReportType, ReportStatus } from '@/types/database';
import { toast } from 'sonner';

export interface ReportWithPending extends Report {
  _isPending?: boolean;
}

export const useReports = () => {
  const { clinicId } = useClinic();
  const [pendingReports, setPendingReports] = useState<ReportWithPending[]>([]);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const actions = await getPendingActions();
        const reports = actions
          .filter((a: OfflineAction) => a.type === 'create-report')
          .map((a: OfflineAction) => ({
            id: `pending-${a.id}`,
            clinic_id: (a.payload.clinic_id as string) || '',
            patient_id: (a.payload.patient_id as string) || '',
            created_by: null,
            report_type: (a.payload.report_type as ReportType) || 'blood_test',
            report_data: (a.payload.report_data as Record<string, unknown>) || {},
            report_number: (a.payload.report_number as string) || 'PENDING',
            referring_doctor: (a.payload.referring_doctor as string) || null,
            clinical_notes: (a.payload.clinical_notes as string) || null,
            test_date: (a.payload.test_date as string) || new Date().toISOString().split('T')[0],
            status: (a.payload.status as ReportStatus) || 'draft',
            included_tests: (a.payload.included_tests as string[]) || null,
            created_at: a.createdAt,
            updated_at: a.createdAt,
            _isPending: true,
          }));
        setPendingReports(reports);
      } catch {
        // IndexedDB unavailable
      }
    };
    loadPending();
    window.addEventListener('online', loadPending);
    return () => window.removeEventListener('online', loadPending);
  }, []);

  const query = useQuery({
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

  const mergedData: ReportWithPending[] | undefined = query.data
    ? [...pendingReports, ...query.data]
    : pendingReports.length > 0
    ? pendingReports
    : undefined;

  return {
    ...query,
    data: mergedData,
  };
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

      const reportNumber = `RPT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

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
