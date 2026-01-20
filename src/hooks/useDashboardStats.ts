import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth } from 'date-fns';

interface DashboardStats {
  totalReports: number;
  totalPatients: number;
  monthlyReports: number;
  draftReports: number;
}

export const useDashboardStats = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', profile?.clinic_id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!profile?.clinic_id) {
        return { totalReports: 0, totalPatients: 0, monthlyReports: 0, draftReports: 0 };
      }

      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      const [reportsRes, patientsRes, monthlyRes, draftsRes] = await Promise.all([
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', profile.clinic_id),
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', profile.clinic_id),
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', profile.clinic_id)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', profile.clinic_id)
          .eq('status', 'draft'),
      ]);

      return {
        totalReports: reportsRes.count || 0,
        totalPatients: patientsRes.count || 0,
        monthlyReports: monthlyRes.count || 0,
        draftReports: draftsRes.count || 0,
      };
    },
    enabled: !!profile?.clinic_id,
  });
};
