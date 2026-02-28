import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Clinic = Tables<'clinics'>;

// Fallback clinic ID used only when no user is logged in (e.g. during loading)
const FALLBACK_CLINIC_ID = '00000000-0000-0000-0000-000000000001';
const CLINIC_CACHE_KEY = 'lab-reporter-clinic-cache';
const CLINIC_ID_CACHE_KEY = 'lab-reporter-clinic-id-cache';

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
    return {
      clinic: null,
      clinicId: FALLBACK_CLINIC_ID,
      isLoading: true,
      refreshClinic: async () => {},
    } as ClinicContextType;
  }
  return context;
};

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [clinicId, setClinicId] = useState<string>(() => {
    try {
      return localStorage.getItem(CLINIC_ID_CACHE_KEY) || FALLBACK_CLINIC_ID;
    } catch {
      return FALLBACK_CLINIC_ID;
    }
  });

  const [clinic, setClinic] = useState<Clinic | null>(() => {
    try {
      const cached = localStorage.getItem(CLINIC_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Step 1: Resolve the user's clinic_id from their profile
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const resolveClinicId = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_clinic_id', {
          _user_id: user.id,
        });
        if (!error && data) {
          setClinicId(data);
          try {
            localStorage.setItem(CLINIC_ID_CACHE_KEY, data);
          } catch {}
        }
      } catch (err) {
        console.error('Error resolving clinic ID:', err);
        // Keep cached/fallback value
      }
    };

    resolveClinicId();
  }, [user]);

  // Step 2: Fetch clinic data when clinicId changes
  const fetchClinic = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching clinic:', error);
      } else if (data) {
        setClinic(data);
        try {
          localStorage.setItem(CLINIC_CACHE_KEY, JSON.stringify(data));
        } catch {}
      }
    } catch (error) {
      console.error('Error fetching clinic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId) {
      fetchClinic();
    }
  }, [clinicId]);

  const refreshClinic = async () => {
    await fetchClinic();
  };

  const value = {
    clinic,
    clinicId,
    isLoading,
    refreshClinic,
  };

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};
