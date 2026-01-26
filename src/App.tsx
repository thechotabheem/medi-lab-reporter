import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClinicProvider } from "@/contexts/ClinicContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import CreateReport from "./pages/CreateReport";
import Reports from "./pages/Reports";
import ReportView from "./pages/ReportView";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import AddPatient from "./pages/AddPatient";
import Settings from "./pages/Settings";
import ClinicSettings from "./pages/ClinicSettings";
import TemplateEditor from "./pages/TemplateEditor";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <ClinicProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
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
          </BrowserRouter>
        </TooltipProvider>
      </ClinicProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
