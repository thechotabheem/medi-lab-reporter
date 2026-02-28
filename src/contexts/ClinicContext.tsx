import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Clinic = Tables<'clinics'>;

// Default clinic ID - this is the static UUID for the single default clinic
export const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001';
const CLINIC_CACHE_KEY = 'lab-reporter-clinic-cache';

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
    // Fallback for when component renders before provider is ready (e.g. cache restore)
    return {
      clinic: null,
      clinicId: DEFAULT_CLINIC_ID,
      isLoading: true,
      refreshClinic: async () => {},
    } as ClinicContextType;
  }
  return context;
};

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clinic, setClinic] = useState<Clinic | null>(() => {
    // Restore from localStorage for offline access
    try {
      const cached = localStorage.getItem(CLINIC_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
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
      } else if (data) {
        setClinic(data);
        // Cache for offline use
        try {
          localStorage.setItem(CLINIC_CACHE_KEY, JSON.stringify(data));
        } catch {
          // Storage full
        }
      }
    } catch (error) {
      console.error('Error fetching clinic:', error);
      // Offline - cached data already loaded from state init
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
