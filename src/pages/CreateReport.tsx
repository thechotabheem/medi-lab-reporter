import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PatientSelector } from '@/components/reports/PatientSelector';
import { TemplateSelector } from '@/components/reports/TemplateSelector';
import { DynamicReportForm } from '@/components/reports/DynamicReportForm';
import { useCreateReport } from '@/hooks/useReports';
import { getReportTypeName } from '@/lib/report-templates';
import type { Patient, ReportType } from '@/types/database';
import { ArrowLeft, ArrowRight, Check, User, FileText, ClipboardList, Save } from 'lucide-react';

type Step = 'patient' | 'template' | 'details' | 'results';

const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: 'patient', label: 'Select Patient', icon: <User className="h-4 w-4" /> },
  { key: 'template', label: 'Choose Template', icon: <FileText className="h-4 w-4" /> },
  { key: 'details', label: 'Report Details', icon: <ClipboardList className="h-4 w-4" /> },
  { key: 'results', label: 'Enter Results', icon: <Save className="h-4 w-4" /> },
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
      case 'patient':
        return !!selectedPatient;
      case 'template':
        return !!selectedTemplate;
      case 'details':
        return !!reportDetails.test_date;
      case 'results':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
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
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'patient':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Select a Patient</h2>
              <p className="text-muted-foreground">
                Choose the patient for this report
              </p>
            </div>
            <PatientSelector
              onSelect={setSelectedPatient}
              selectedPatient={selectedPatient}
            />
          </div>
        );

      case 'template':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Choose Report Template</h2>
              <p className="text-muted-foreground">
                Select the type of report you want to create
              </p>
            </div>
            <TemplateSelector
              onSelect={setSelectedTemplate}
              selectedType={selectedTemplate}
            />
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Report Details</h2>
              <p className="text-muted-foreground">
                Add additional information about this report
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Information</CardTitle>
                <CardDescription>
                  Creating {selectedTemplate && getReportTypeName(selectedTemplate)} for{' '}
                  {selectedPatient?.first_name} {selectedPatient?.last_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="test_date">Test Date *</Label>
                    <Input
                      id="test_date"
                      type="date"
                      value={reportDetails.test_date}
                      onChange={(e) =>
                        setReportDetails((prev) => ({ ...prev, test_date: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referring_doctor">Referring Doctor</Label>
                    <Input
                      id="referring_doctor"
                      placeholder="Dr. John Smith"
                      value={reportDetails.referring_doctor}
                      onChange={(e) =>
                        setReportDetails((prev) => ({
                          ...prev,
                          referring_doctor: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinical_notes">Clinical Notes</Label>
                  <Textarea
                    id="clinical_notes"
                    placeholder="Enter any clinical notes or observations..."
                    rows={3}
                    value={reportDetails.clinical_notes}
                    onChange={(e) =>
                      setReportDetails((prev) => ({
                        ...prev,
                        clinical_notes: e.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'results':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Enter Test Results</h2>
                <p className="text-muted-foreground">
                  Fill in the test values. Abnormal values will be highlighted.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Patient: <span className="font-medium text-foreground">{selectedPatient?.first_name} {selectedPatient?.last_name}</span>
              </div>
            </div>

            {selectedTemplate && selectedPatient && (
              <DynamicReportForm
                reportType={selectedTemplate}
                patient={selectedPatient}
                onChange={handleReportDataChange}
                initialData={reportData}
              />
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Create New Report</h1>
                <p className="text-sm text-muted-foreground">
                  Step {currentStepIndex + 1} of {steps.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={`flex items-center gap-2 text-sm ${
                  index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    index < currentStepIndex
                      ? 'bg-primary border-primary text-primary-foreground'
                      : index === currentStepIndex
                      ? 'border-primary text-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className="hidden sm:inline font-medium">{step.label}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {renderStepContent()}
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep === 'results' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleSave('draft')}
                    disabled={createReport.isPending}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSave('completed')}
                    disabled={createReport.isPending}
                  >
                    {createReport.isPending ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Complete Report
                  </Button>
                </>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
