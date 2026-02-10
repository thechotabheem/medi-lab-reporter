import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

export const useLogActivity = () => {
  const { clinicId } = useClinic();
  const { user } = useAuth();

  const logActivity = async (params: {
    action: string;
    entity_type: string;
    entity_id?: string;
    entity_name?: string;
    details?: Record<string, unknown>;
  }) => {
    if (!clinicId || !user) return;

    const userName = user.user_metadata?.full_name || user.email || 'Unknown';

    try {
      await supabase.from('activity_logs').insert([{
        clinic_id: clinicId,
        user_id: user.id,
        user_name: userName,
        action: params.action,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        entity_name: params.entity_name,
        details: (params.details || {}) as any,
      }]);
    } catch (e) {
      console.error('Failed to log activity:', e);
    }
  };

  return logActivity;
};

export const useActivityLogs = (limit = 50) => {
  const { clinicId } = useClinic();

  return useQuery({
    queryKey: ['activity-logs', clinicId, limit],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!clinicId,
  });
};
