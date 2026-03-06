import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

const ROLE_CACHE_KEY = 'lab-reporter-user-role';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  role: 'admin' | 'lab_technician' | 'receptionist' | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'lab_technician' | 'receptionist' | null>(() => {
    // Restore cached role for offline resilience
    try {
      const cached = localStorage.getItem(ROLE_CACHE_KEY);
      return cached as any || null;
    } catch {
      return null;
    }
  });

  const fetchRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      const resolvedRole = (data?.role as any) || 'lab_technician';
      setRole(resolvedRole);
      // Cache for offline use
      try {
        localStorage.setItem(ROLE_CACHE_KEY, resolvedRole);
      } catch {}
    } catch {
      // Offline - keep cached role from state init
      console.warn('[Auth] Failed to fetch role, using cached value');
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer to avoid deadlock with Supabase auth
        setTimeout(() => fetchRole(session.user.id), 0);
      } else {
        setRole(null);
        try { localStorage.removeItem(ROLE_CACHE_KEY); } catch {}
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try { localStorage.removeItem(ROLE_CACHE_KEY); } catch {}
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, role, isAdmin: role === 'admin', signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
