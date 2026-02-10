import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import CreateReport from "@/pages/CreateReport";
import EditReport from "@/pages/EditReport";
import Reports from "@/pages/Reports";
import ReportView from "@/pages/ReportView";
import Patients from "@/pages/Patients";
import PatientDetail from "@/pages/PatientDetail";
import AddPatient from "@/pages/AddPatient";
import Settings from "@/pages/Settings";
import ClinicSettings from "@/pages/ClinicSettings";
import TemplateEditor from "@/pages/TemplateEditor";
import Documentation from "@/pages/Documentation";
import Install from "@/pages/Install";
import CompareReports from "@/pages/CompareReports";
import AdminPanel from "@/pages/AdminPanel";
import AccountSettings from "@/pages/AccountSettings";
import NotFound from "@/pages/NotFound";

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If not authenticated, show auth page (except install route)
  if (!user && displayLocation.pathname !== '/install') {
    return (
      <Routes location={displayLocation}>
        <Route path="*" element={<Auth />} />
      </Routes>
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
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}
