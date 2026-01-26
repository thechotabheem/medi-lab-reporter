import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import type { Patient } from '@/types/database';

export const usePatients = () => {
  const { clinicId } = useClinic();

  return useQuery({
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
};
