import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useRef, useEffect, useState, useCallback, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-loaded route components for code-splitting
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const CreateReport = lazy(() => import("@/pages/CreateReport"));
const EditReport = lazy(() => import("@/pages/EditReport"));
const Reports = lazy(() => import("@/pages/Reports"));
const ReportView = lazy(() => import("@/pages/ReportView"));
const Patients = lazy(() => import("@/pages/Patients"));
const PatientDetail = lazy(() => import("@/pages/PatientDetail"));
const AddPatient = lazy(() => import("@/pages/AddPatient"));
const Settings = lazy(() => import("@/pages/Settings"));
const ClinicSettings = lazy(() => import("@/pages/ClinicSettings"));
const TemplateEditor = lazy(() => import("@/pages/TemplateEditor"));
const Documentation = lazy(() => import("@/pages/Documentation"));
const Install = lazy(() => import("@/pages/Install"));
const CompareReports = lazy(() => import("@/pages/CompareReports"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));
const AccountSettings = lazy(() => import("@/pages/AccountSettings"));

import { NotFound } from "@/components/NotFound";

function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-8">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Check for reduced motion preference
const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export function AnimatedRoutes() {
  const location = useLocation();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit">("enter");
  const previousPathRef = useRef(location.pathname);
  const fallbackTimerRef = useRef<number | null>(null);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const completeTransition = useCallback(() => {
    clearFallbackTimer();
    setDisplayLocation(location);
    setTransitionStage("enter");
  }, [location, clearFallbackTimer]);

  useEffect(() => {
    if (location.pathname !== previousPathRef.current) {
      previousPathRef.current = location.pathname;

      if (prefersReducedMotion()) {
        setDisplayLocation(location);
        setTransitionStage("enter");
        return;
      }

      setTransitionStage("exit");

      clearFallbackTimer();
      fallbackTimerRef.current = window.setTimeout(() => {
        completeTransition();
      }, 300);
    }

    return () => {
      clearFallbackTimer();
    };
  }, [location, clearFallbackTimer, completeTransition]);

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.animationName !== "page-exit") return;

    if (transitionStage === "exit") {
      completeTransition();
    }
  };

  if (authLoading) {
    return <PageLoader />;
  }

  // If not authenticated, show auth page (except install route)
  if (!user && displayLocation.pathname !== '/install') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes location={displayLocation}>
          <Route path="*" element={<Auth />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      <div
        className={cn(
          "transition-all duration-300 ease-out pb-14 sm:pb-0",
          transitionStage === "enter" && "animate-page-enter",
          transitionStage === "exit" && "animate-page-exit"
        )}
        onAnimationEnd={handleAnimationEnd}
      >
        <div id="main-content">
          <Suspense fallback={<PageLoader />}>
            <Routes location={displayLocation}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
              <Route path="/install" element={<Install />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports/new" element={<CreateReport />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/:id" element={<ReportView />} />
              <Route path="/reports/:id/edit" element={<EditReport />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/new" element={<AddPatient />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/patients/:id/compare" element={<CompareReports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/account" element={<AccountSettings />} />
              <Route path="/settings/clinic" element={isAdmin ? <ClinicSettings /> : <Navigate to="/dashboard" replace />} />
              <Route path="/settings/templates" element={isAdmin ? <TemplateEditor /> : <Navigate to="/dashboard" replace />} />
              <Route path="/admin" element={isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" replace />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}
