import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/ui/page-header';
import { PatientSelector } from '@/components/reports/PatientSelector';
import { TemplateSelector } from '@/components/reports/TemplateSelector';
import { DynamicReportForm } from '@/components/reports/DynamicReportForm';
import { useCreateReport } from '@/hooks/useReports';
import { getReportTypeName } from '@/lib/report-templates';
import type { Patient, ReportType } from '@/types/database';
import { ArrowLeft, ArrowRight, Check, User, FileText, ClipboardList, Save } from 'lucide-react';

type Step = 'patient' | 'template' | 'details' | 'results';

const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: 'patient', label: 'Patient', icon: <User className="h-4 w-4" /> },
  { key: 'template', label: 'Template', icon: <FileText className="h-4 w-4" /> },
  { key: 'details', label: 'Details', icon: <ClipboardList className="h-4 w-4" /> },
  { key: 'results', label: 'Results', icon: <Save className="h-4 w-4" /> },
];

export default function CreateReport() {
  const navigate = useNavigate();
  const createReport = useCreateReport();

  const [currentStep, setCurrentStep] = useState<Step>('patient');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportType | null>(null);
  const [reportDetails, setReportDetails] = useState({
    referring_doctor: '',
    clinical_notes: '',
    test_date: new Date().toISOString().split('T')[0],
  });
  const [reportData, setReportData] = useState<Record<string, string | number | boolean | null>>({});

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 'patient': return !!selectedPatient;
      case 'template': return !!selectedTemplate;
      case 'details': return !!reportDetails.test_date;
      case 'results': return true;
      default: return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) setCurrentStep(steps[nextIndex].key);
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) setCurrentStep(steps[prevIndex].key);
  };

  const handleReportDataChange = useCallback((data: Record<string, string | number | boolean | null>) => {
    setReportData(data);
  }, []);

  const handleSave = async (status: 'draft' | 'completed') => {
    if (!selectedPatient || !selectedTemplate) return;
    try {
      await createReport.mutateAsync({
        patient_id: selectedPatient.id,
        report_type: selectedTemplate,
        report_data: reportData,
        referring_doctor: reportDetails.referring_doctor || undefined,
        clinical_notes: reportDetails.clinical_notes || undefined,
        test_date: reportDetails.test_date,
        status,
      });
      navigate('/dashboard');
    } catch (error) {}
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'patient':
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Select a Patient</h2>
              <p className="text-sm text-muted-foreground">Choose the patient for this report</p>
            </div>
            <PatientSelector onSelect={setSelectedPatient} selectedPatient={selectedPatient} />
          </div>
        );
      case 'template':
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Choose Report Template</h2>
              <p className="text-sm text-muted-foreground">Select the type of report</p>
            </div>
            <TemplateSelector onSelect={setSelectedTemplate} selectedType={selectedTemplate} />
          </div>
        );
      case 'details':
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Report Details</h2>
              <p className="text-sm text-muted-foreground">Add additional information</p>
            </div>
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Report Information</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {selectedTemplate && getReportTypeName(selectedTemplate)} for {selectedPatient?.first_name} {selectedPatient?.last_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="test_date" className="text-sm">Test Date *</Label>
                    <Input id="test_date" type="date" value={reportDetails.test_date} onChange={(e) => setReportDetails((prev) => ({ ...prev, test_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referring_doctor" className="text-sm">Referring Doctor</Label>
                    <Input id="referring_doctor" placeholder="Dr. John Smith" value={reportDetails.referring_doctor} onChange={(e) => setReportDetails((prev) => ({ ...prev, referring_doctor: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinical_notes" className="text-sm">Clinical Notes</Label>
                  <Textarea id="clinical_notes" placeholder="Enter any clinical notes..." rows={3} value={reportDetails.clinical_notes} onChange={(e) => setReportDetails((prev) => ({ ...prev, clinical_notes: e.target.value }))} />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'results':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Enter Test Results</h2>
                <p className="text-sm text-muted-foreground">Abnormal values will be highlighted</p>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Patient: <span className="font-medium text-foreground">{selectedPatient?.first_name} {selectedPatient?.last_name}</span>
              </div>
            </div>
            {selectedTemplate && selectedPatient && (
              <DynamicReportForm reportType={selectedTemplate} patient={selectedPatient} onChange={handleReportDataChange} initialData={reportData} />
            )}
          </div>
        );
    }
  };

  return (
    <div className="page-container pb-24">
      <PageHeader title="Create New Report" subtitle={`Step ${currentStepIndex + 1} of ${steps.length}`} showBack backPath="/dashboard" />

      {/* Progress */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-[57px] z-30">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-2 gap-1">
            {steps.map((step, index) => (
              <div key={step.key} className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all ${index < currentStepIndex ? 'bg-primary border-primary text-primary-foreground' : index === currentStepIndex ? 'border-primary text-primary shadow-glow-sm' : 'border-muted-foreground/50'}`}>
                  {index < currentStepIndex ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : step.icon}
                </div>
                <span className="hidden sm:inline font-medium">{step.label}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1.5 sm:h-2" />
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-4 sm:py-6">{renderStepContent()}</main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={handleBack} disabled={currentStepIndex === 0} className="text-xs sm:text-sm">
              <ArrowLeft className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex gap-2">
              {currentStep === 'results' ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleSave('draft')} disabled={createReport.isPending} className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Save as </span>Draft
                  </Button>
                  <Button size="sm" onClick={() => handleSave('completed')} disabled={createReport.isPending} className="text-xs sm:text-sm">
                    {createReport.isPending ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" /> : <Check className="h-4 w-4 sm:mr-2" />}
                    <span className="hidden sm:inline">Complete</span>
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={handleNext} disabled={!canProceed()} className="text-xs sm:text-sm">
                  Next<ArrowRight className="h-4 w-4 ml-1 sm:ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
