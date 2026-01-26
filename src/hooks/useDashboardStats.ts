import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { startOfMonth, endOfMonth } from 'date-fns';

interface DashboardStats {
  totalReports: number;
  totalPatients: number;
  monthlyReports: number;
  draftReports: number;
}

export const useDashboardStats = () => {
  const { clinicId } = useClinic();

  return useQuery({
    queryKey: ['dashboard-stats', clinicId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!clinicId) {
        return { totalReports: 0, totalPatients: 0, monthlyReports: 0, draftReports: 0 };
      }

      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      const [reportsRes, patientsRes, monthlyRes, draftsRes] = await Promise.all([
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId),
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId),
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('status', 'draft'),
      ]);

      return {
        totalReports: reportsRes.count || 0,
        totalPatients: patientsRes.count || 0,
        monthlyReports: monthlyRes.count || 0,
        draftReports: draftsRes.count || 0,
      };
    },
    enabled: !!clinicId,
  });
};
