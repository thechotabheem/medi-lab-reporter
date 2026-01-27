import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Dashboard from "@/pages/Dashboard";
import CreateReport from "@/pages/CreateReport";
import Reports from "@/pages/Reports";
import ReportView from "@/pages/ReportView";
import Patients from "@/pages/Patients";
import PatientDetail from "@/pages/PatientDetail";
import AddPatient from "@/pages/AddPatient";
import Settings from "@/pages/Settings";
import ClinicSettings from "@/pages/ClinicSettings";
import TemplateEditor from "@/pages/TemplateEditor";
import Install from "@/pages/Install";
import NotFound from "@/pages/NotFound";

export function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit">("enter");
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== previousPathRef.current) {
      // Start exit animation
      setTransitionStage("exit");
      previousPathRef.current = location.pathname;
    }
  }, [location]);

  const handleAnimationEnd = () => {
    if (transitionStage === "exit") {
      // Update displayed location and start enter animation
      setDisplayLocation(location);
      setTransitionStage("enter");
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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/install" element={<Install />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports/new" element={<CreateReport />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportView />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/new" element={<AddPatient />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/clinic" element={<ClinicSettings />} />
        <Route path="/settings/templates" element={<TemplateEditor />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
