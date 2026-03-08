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
import { Sentry } from "@/lib/sentry";

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

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('splashShown', 'true');
  };

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-8">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={resetError}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    >
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24,
          buster: '',
        }}
      >
        <ThemeProvider defaultTheme="light">
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
    </Sentry.ErrorBoundary>
  );
};

export default App;
