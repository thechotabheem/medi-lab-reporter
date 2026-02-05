import { useLocation, Routes, Route } from "react-router-dom";
import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
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
import LogoGenerator from "@/pages/LogoGenerator";
import NotFound from "@/pages/NotFound";

// Check for reduced motion preference
const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit">("enter");
  const previousPathRef = useRef(location.pathname);
  const fallbackTimerRef = useRef<number | null>(null);

  // Clear any pending fallback timer
  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  // Complete the transition to the new location
  const completeTransition = useCallback(() => {
    clearFallbackTimer();
    setDisplayLocation(location);
    setTransitionStage("enter");
  }, [location, clearFallbackTimer]);

  useEffect(() => {
    if (location.pathname !== previousPathRef.current) {
      previousPathRef.current = location.pathname;

      // If user prefers reduced motion, skip the exit animation entirely
      if (prefersReducedMotion()) {
        setDisplayLocation(location);
        setTransitionStage("enter");
        return;
      }

      // Start exit animation
      setTransitionStage("exit");

      // Fallback: if animationend doesn't fire within 300ms, force completion
      clearFallbackTimer();
      fallbackTimerRef.current = window.setTimeout(() => {
        completeTransition();
      }, 300);
    }

    // Cleanup on unmount or when location changes again before animation ends
    return () => {
      clearFallbackTimer();
    };
  }, [location, clearFallbackTimer, completeTransition]);

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    // Only react to this wrapper's own animation, not child animations
    if (event.target !== event.currentTarget) return;
    // Only react to the exit animation completing
    if (event.animationName !== "page-exit") return;

    if (transitionStage === "exit") {
      completeTransition();
    }
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out",
        transitionStage === "enter" && "animate-page-enter",
        transitionStage === "exit" && "animate-page-exit"
      )}
      onAnimationEnd={handleAnimationEnd}
    >
      <Routes location={displayLocation}>
        {/* Render Dashboard directly at "/" to avoid initial redirect animation trap */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/install" element={<Install />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports/new" element={<CreateReport />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportView />} />
        <Route path="/reports/:id/edit" element={<EditReport />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/new" element={<AddPatient />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/clinic" element={<ClinicSettings />} />
        <Route path="/settings/templates" element={<TemplateEditor />} />
        <Route path="/settings/logo" element={<LogoGenerator />} />
        <Route path="/documentation" element={<Documentation />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
