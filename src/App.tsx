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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SplashScreen } from "@/components/SplashScreen";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";
import { ServiceWorkerUpdate } from "@/components/ServiceWorkerUpdate";
import { OfflineSyncStatus } from "@/components/OfflineSyncStatus";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 2,
      retry: (failureCount, error) => {
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
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

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('splashShown', 'true');
  };

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24,
          buster: '',
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
    </ErrorBoundary>
  );
};

export default App;
