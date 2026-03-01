import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createIDBPersister } from "@/lib/queryPersister";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { ClinicProvider } from "@/contexts/ClinicContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SplashScreen } from "@/components/SplashScreen";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";
import { ServiceWorkerUpdate } from "@/components/ServiceWorkerUpdate";
import { OfflineSyncStatus } from "@/components/OfflineSyncStatus";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep cached data for 24 hours so it's available offline
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 2, // 2 min stale time
      retry: (failureCount, error) => {
        // Don't retry when offline
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
      // Use cached data when network fails
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

const persister = createIDBPersister();

function KeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        navigate('/reports/new');
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        navigate('/patients/new');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  return null;
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    const hasShownSplash = sessionStorage.getItem('splashShown');
    if (hasShownSplash) {
      setShowSplash(false);
      setIsFirstLoad(false);
    }
  }, []);

  // Global unhandled rejection handler to prevent silent crashes
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error('Unhandled rejection:', event.reason);
      event.preventDefault();
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('splashShown', 'true');
  };

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        buster: '', // Cache buster string
      }}
    >
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <ClinicProvider>
            <TooltipProvider>
              {showSplash && isFirstLoad && (
                <SplashScreen onComplete={handleSplashComplete} />
              )}
              <OfflineBanner />
              <ServiceWorkerUpdate />
              <OfflineSyncStatus />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <KeyboardShortcuts />
                <AnimatedRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </ClinicProvider>
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
