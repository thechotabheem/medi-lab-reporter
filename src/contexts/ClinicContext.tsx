import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Clinic = Tables<'clinics'>;

// Fallback clinic ID when user session/profile is unavailable
export const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001';
const LEGACY_CLINIC_CACHE_KEY = 'lab-reporter-clinic-cache';
const CLINIC_CACHE_KEY_PREFIX = 'lab-reporter-clinic-cache:';
const CLINIC_ID_CACHE_KEY = 'lab-reporter-clinic-id';

const getClinicCacheKey = (id: string) => `${CLINIC_CACHE_KEY_PREFIX}${id}`;

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
  const [clinicId, setClinicId] = useState<string>(() => {
    // Restore cached clinic ID for offline resilience
    try {
      return localStorage.getItem(CLINIC_ID_CACHE_KEY) || DEFAULT_CLINIC_ID;
    } catch {
      return DEFAULT_CLINIC_ID;
    }
  });
  const [clinic, setClinic] = useState<Clinic | null>(() => {
    try {
      // Try cached clinic for the stored ID first, then legacy key
      const cachedId = localStorage.getItem(CLINIC_ID_CACHE_KEY);
      const cached =
        (cachedId && localStorage.getItem(getClinicCacheKey(cachedId))) ||
        localStorage.getItem(getClinicCacheKey(DEFAULT_CLINIC_ID)) ||
        localStorage.getItem(LEGACY_CLINIC_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const resolveClinicId = useCallback(async (): Promise<string> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // No session — return cached ID if available
        try {
          return localStorage.getItem(CLINIC_ID_CACHE_KEY) || DEFAULT_CLINIC_ID;
        } catch {
          return DEFAULT_CLINIC_ID;
        }
      }

      if (!navigator.onLine) {
        // Offline — return cached ID
        try {
          return localStorage.getItem(CLINIC_ID_CACHE_KEY) || DEFAULT_CLINIC_ID;
        } catch {
          return DEFAULT_CLINIC_ID;
        }
      }

      const { data: resolvedClinicId, error } = await supabase.rpc('get_user_clinic_id', {
        _user_id: session.user.id,
      });

      if (error || !resolvedClinicId) {
        if (error) console.error('Error resolving clinic id:', error);
        // Fall back to cached
        try {
          return localStorage.getItem(CLINIC_ID_CACHE_KEY) || DEFAULT_CLINIC_ID;
        } catch {
          return DEFAULT_CLINIC_ID;
        }
      }

      // Cache the resolved ID
      try {
        localStorage.setItem(CLINIC_ID_CACHE_KEY, resolvedClinicId);
      } catch {}

      return resolvedClinicId;
    } catch (error) {
      console.error('Error resolving clinic id:', error);
      // Offline/network error — use cached
      try {
        return localStorage.getItem(CLINIC_ID_CACHE_KEY) || DEFAULT_CLINIC_ID;
      } catch {
        return DEFAULT_CLINIC_ID;
      }
    }
  }, []);

  const fetchClinic = useCallback(async () => {
    setIsLoading(true);

    try {
      const resolvedClinicId = await resolveClinicId();
      setClinicId(resolvedClinicId);

      // Restore cache for resolved clinic first (useful when offline)
      try {
        const cached = localStorage.getItem(getClinicCacheKey(resolvedClinicId));
        if (cached) {
          setClinic(JSON.parse(cached));
        }
      } catch {
        // ignore cache parse errors
      }

      if (!navigator.onLine) {
        // Already loaded from cache above, skip network fetch
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', resolvedClinicId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching clinic:', error);
      } else if (data) {
        setClinic(data);
        // Cache for offline use
        try {
          localStorage.setItem(getClinicCacheKey(resolvedClinicId), JSON.stringify(data));
          localStorage.setItem(LEGACY_CLINIC_CACHE_KEY, JSON.stringify(data));
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
  }, [resolveClinicId]);

  useEffect(() => {
    void fetchClinic();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void fetchClinic();
    });

    return () => subscription.unsubscribe();
  }, [fetchClinic]);

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
