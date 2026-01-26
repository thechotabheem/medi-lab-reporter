import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Clinic = Tables<'clinics'>;

// Default clinic ID - this is the static UUID for the single default clinic
export const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001';

interface ClinicContextType {
  clinic: Clinic | null;
  clinicId: string;
  isLoading: boolean;
  refreshClinic: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClinic = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', DEFAULT_CLINIC_ID)
        .maybeSingle();

      if (error) {
        console.error('Error fetching clinic:', error);
      } else {
        setClinic(data);
      }
    } catch (error) {
      console.error('Error fetching clinic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClinic();
  }, []);

  const refreshClinic = async () => {
    await fetchClinic();
  };

  const value = {
    clinic,
    clinicId: DEFAULT_CLINIC_ID,
    isLoading,
    refreshClinic,
  };

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};
