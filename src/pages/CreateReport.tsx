import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PatientSelector, NewPatientData } from '@/components/reports/PatientSelector';
import { TemplateSelector } from '@/components/reports/TemplateSelector';
import { DynamicReportForm } from '@/components/reports/DynamicReportForm';
import { CombinedReportForm } from '@/components/reports/CombinedReportForm';
import { DraftBanner } from '@/components/reports/DraftBanner';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import { SuccessAnimation } from '@/components/ui/success-animation';
import { useDraftReport } from '@/hooks/useDraftReport';
import { useClinic } from '@/contexts/ClinicContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { getReportTypeName } from '@/lib/report-templates';
import { ageToDateOfBirth } from '@/lib/utils';
import type { Patient, ReportType } from '@/types/database';
import { Check, Save, Layers } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateReport() {
  const navigate = useNavigate();
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();
  const { draft, hasDraft, saveDraft, clearDraft } = useDraftReport();

  // Mode toggle: single test vs combined
  const [isCombinedMode, setIsCombinedMode] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatientData, setNewPatientData] = useState<NewPatientData | null>(null);
  
  // Single test mode
  const [selectedTemplate, setSelectedTemplate] = useState<ReportType | null>(null);
  const [reportData, setReportData] = useState<Record<string, string | number | boolean | null>>({});
  
  // Combined mode
  const [selectedTests, setSelectedTests] = useState<ReportType[]>([]);
  const [combinedReportData, setCombinedReportData] = useState<Record<string, Record<string, string | number | boolean | null>>>({});

  const [reportDetails, setReportDetails] = useState({
    referring_doctor: '',
    clinical_notes: '',
    test_date: new Date().toISOString().split('T')[0],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', subtitle: '' });
  const [draftApplied, setDraftApplied] = useState(false);

  // Auto-save on changes (after initial load)
  useEffect(() => {
    if (draftApplied || !hasDraft && (selectedPatient || newPatientData || selectedTemplate || selectedTests.length > 0)) {
      saveDraft({
        patient: selectedPatient ? { id: selectedPatient.id, full_name: selectedPatient.full_name } : null,
        newPatientData: newPatientData || null,
        selectedTemplate,
        reportDetails,
        reportData,
        // Extended draft for combined mode
        isCombinedMode,
        selectedTests,
        combinedReportData,
      });
    }
  }, [selectedPatient, newPatientData, selectedTemplate, reportDetails, reportData, draftApplied, isCombinedMode, selectedTests, combinedReportData]);

  const handleReportDataChange = useCallback((data: Record<string, string | number | boolean | null>) => {
    setReportData(data);
  }, []);

  const handleCombinedDataChange = useCallback((data: Record<string, Record<string, string | number | boolean | null>>) => {
    setCombinedReportData(data);
  }, []);

  const handleResumeDraft = useCallback(() => {
    if (!draft) return;
    
    // Restore draft state
    if (draft.patient) {
      supabase
        .from('patients')
        .select('*')
        .eq('id', draft.patient.id)
        .single()
        .then(({ data }) => {
          if (data) setSelectedPatient(data);
        });
    }
    if (draft.newPatientData) {
      setNewPatientData(draft.newPatientData);
    }
    if (draft.selectedTemplate) {
      setSelectedTemplate(draft.selectedTemplate);
    }
    if (draft.reportDetails) {
      setReportDetails(draft.reportDetails);
    }
    if (draft.reportData) {
      setReportData(draft.reportData);
    }
    // Restore combined mode state
    if (draft.isCombinedMode !== undefined) {
      setIsCombinedMode(draft.isCombinedMode);
    }
    if (draft.selectedTests) {
      setSelectedTests(draft.selectedTests);
    }
    if (draft.combinedReportData) {
      setCombinedReportData(draft.combinedReportData);
    }
    
    setDraftApplied(true);
    toast.success('Draft restored');
  }, [draft]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setDraftApplied(true);
    toast.info('Draft discarded');
  }, [clearDraft]);

  // Handle mode toggle - clear selections when switching
  const handleModeToggle = (enabled: boolean) => {
    setIsCombinedMode(enabled);
    if (enabled) {
      // Switching to combined mode - preserve selected template if any
      if (selectedTemplate) {
        setSelectedTests([selectedTemplate]);
      }
      setSelectedTemplate(null);
      setReportData({});
    } else {
      // Switching to single mode - take first selected test
      if (selectedTests.length > 0) {
        setSelectedTemplate(selectedTests[0]);
      }
      setSelectedTests([]);
      setCombinedReportData({});
    }
  };

  // Can save conditions
  const hasPatient = selectedPatient || newPatientData;
  const hasTest = isCombinedMode ? selectedTests.length > 0 : selectedTemplate;
  const canSave = hasPatient && hasTest && reportDetails.test_date;

  // Get display name for patient section
  const getPatientDisplayName = () => {
    if (selectedPatient) {
      return selectedPatient.full_name;
    }
    if (newPatientData) {
      return `${newPatientData.full_name} (new)`;
    }
    return null;
  };

  // Get patient for the form
  const getPatientForForm = (): Patient | null => {
    if (selectedPatient) return selectedPatient;
    if (newPatientData) {
      return {
        id: 'new',
        clinic_id: clinicId || '',
        full_name: newPatientData.full_name,
        date_of_birth: ageToDateOfBirth(newPatientData.age),
        gender: newPatientData.gender,
        phone: newPatientData.phone || null,
        patient_id_number: newPatientData.patient_id_number || null,
        email: null,
        address: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return null;
  };

  // Get test type display name
  const getTestDisplayName = () => {
    if (isCombinedMode && selectedTests.length > 0) {
      if (selectedTests.length === 1) {
        return getReportTypeName(selectedTests[0]);
      }
      return `Combined (${selectedTests.length} tests)`;
    }
    if (selectedTemplate) {
      return getReportTypeName(selectedTemplate);
    }
    return null;
  };

  const handleSave = async (status: 'draft' | 'completed') => {
    if (!clinicId) return;

    setIsSaving(true);

    try {
      let patientId: string;

      // If new patient, create them first
      if (newPatientData && !selectedPatient) {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            clinic_id: clinicId,
            full_name: newPatientData.full_name,
            date_of_birth: ageToDateOfBirth(newPatientData.age),
            gender: newPatientData.gender,
            phone: newPatientData.phone || null,
            patient_id_number: newPatientData.patient_id_number || null,
          })
          .select()
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
        
        queryClient.invalidateQueries({ queryKey: ['patients'] });
      } else if (selectedPatient) {
        patientId = selectedPatient.id;
      } else {
        throw new Error('No patient selected');
      }

      // Generate report number
      const reportNumber = `RPT-${Date.now().toString(36).toUpperCase()}`;

      // Determine report type and data
      let reportType: ReportType;
      let finalReportData: Record<string, unknown>;
      let includedTests: string[] | null = null;

      if (isCombinedMode && selectedTests.length > 0) {
        reportType = 'combined';
        finalReportData = combinedReportData;
        includedTests = selectedTests;
      } else if (selectedTemplate) {
        reportType = selectedTemplate;
        finalReportData = reportData;
      } else {
        throw new Error('No test type selected');
      }

      // Create the report
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: reportError } = await supabase
        .from('reports')
        .insert([{
          clinic_id: clinicId,
          created_by: null as string | null,
          report_number: reportNumber,
          patient_id: patientId,
          report_type: reportType,
          report_data: finalReportData as any,
          included_tests: includedTests,
          referring_doctor: reportDetails.referring_doctor || null,
          clinical_notes: reportDetails.clinical_notes || null,
          test_date: reportDetails.test_date,
          status,
        }]);

      if (reportError) throw reportError;

      // Clear draft on successful save
      clearDraft();

      queryClient.invalidateQueries({ queryKey: ['reports'] });
      
      // Show success animation
      const isNewPatient = newPatientData && !selectedPatient;
      const testCount = isCombinedMode ? selectedTests.length : 1;
      setSuccessMessage({
        title: status === 'completed' ? 'Report Complete!' : 'Draft Saved!',
        subtitle: isNewPatient 
          ? `Patient registered and ${testCount > 1 ? 'combined ' : ''}report created`
          : status === 'completed' 
            ? `Your ${testCount > 1 ? 'combined ' : ''}report is ready for review`
            : 'Your progress has been saved',
      });
      setShowSuccess(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to save: ' + message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessComplete = useCallback(() => {
    setShowSuccess(false);
    navigate('/dashboard');
  }, [navigate]);

  const patientForForm = getPatientForForm();
  const patientDisplayName = getPatientDisplayName();
  const testDisplayName = getTestDisplayName();

  // Show draft banner if there's a draft and we haven't applied or discarded it
  const showDraftBanner = hasDraft && draft && !draftApplied;

  return (
    <>
      {/* Success Animation */}
      <SuccessAnimation
        isVisible={showSuccess}
        onComplete={handleSuccessComplete}
        message={successMessage.title}
        submessage={successMessage.subtitle}
      />

      <EnhancedPageLayout className="pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
        <PageHeader title="Create New Report" subtitle="Fill in all sections to create a report" showBack backPath="/dashboard" />
        
        <HeaderDivider />

      <main className="container mx-auto px-4 py-4 sm:py-6 space-y-6">
        {/* Draft Banner */}
        {showDraftBanner && (
          <DraftBanner
            draft={draft}
            onResume={handleResumeDraft}
            onDiscard={handleDiscardDraft}
          />
        )}

        {/* Section 1: Patient Selection */}
        <Card className="relative animate-fade-in-up animate-pulse-glow card-gradient-overlay">
          <CardHeader className="p-4 sm:p-6 relative z-10">
            <CardTitle className="text-base sm:text-lg">1. Patient</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Add a new patient or select an existing one</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 relative z-10">
            <PatientSelector 
              onSelect={setSelectedPatient} 
              selectedPatient={selectedPatient}
              onNewPatientChange={setNewPatientData}
              newPatientData={newPatientData}
            />
          </CardContent>
        </Card>

        {/* Section 2: Template Selection */}
        <Card className="relative animate-fade-in-up animation-delay-100 animate-pulse-glow card-gradient-overlay">
          <CardHeader className="p-4 sm:p-6 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">2. Select Test Type</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {isCombinedMode 
                    ? 'Select multiple tests to combine into one report' 
                    : 'Choose the type of report to create'}
                </CardDescription>
              </div>
              {/* Combined Mode Toggle */}
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="combined-mode" className="text-sm text-muted-foreground cursor-pointer">
                  Combined Report
                </Label>
                <Switch
                  id="combined-mode"
                  checked={isCombinedMode}
                  onCheckedChange={handleModeToggle}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 relative z-10">
            <TemplateSelector 
              onSelect={setSelectedTemplate} 
              selectedType={selectedTemplate}
              multiSelect={isCombinedMode}
              selectedTypes={selectedTests}
              onMultiSelect={setSelectedTests}
            />
          </CardContent>
        </Card>

        {/* Section 3: Report Details */}
        <Card className="relative animate-fade-in-up animation-delay-200 animate-pulse-glow card-gradient-overlay">
          <CardHeader className="p-4 sm:p-6 relative z-10">
            <CardTitle className="text-base sm:text-lg">3. Report Details</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {testDisplayName && patientDisplayName
                ? `${testDisplayName} for ${patientDisplayName}`
                : 'Add additional information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4 relative z-10">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="test_date" className="text-sm">Test Date *</Label>
                <Input
                  id="test_date"
                  type="date"
                  value={reportDetails.test_date}
                  onChange={(e) => setReportDetails((prev) => ({ ...prev, test_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referring_doctor" className="text-sm">Referring Doctor</Label>
                <Input
                  id="referring_doctor"
                  placeholder="Dr. John Smith"
                  value={reportDetails.referring_doctor}
                  onChange={(e) => setReportDetails((prev) => ({ ...prev, referring_doctor: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinical_notes" className="text-sm">Clinical Notes</Label>
              <Textarea
                id="clinical_notes"
                placeholder="Enter any clinical notes..."
                rows={3}
                value={reportDetails.clinical_notes}
                onChange={(e) => setReportDetails((prev) => ({ ...prev, clinical_notes: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Test Results */}
        {patientForForm && (isCombinedMode ? selectedTests.length > 0 : selectedTemplate) && (
          <Card className="relative animate-fade-in-up animation-delay-300 animate-pulse-glow card-gradient-overlay">
            <CardHeader className="p-4 sm:p-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">4. Enter Test Results</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Abnormal values will be highlighted</CardDescription>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Patient: <span className="font-medium text-foreground">{patientDisplayName}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 relative z-10">
              {isCombinedMode ? (
                <CombinedReportForm
                  selectedTests={selectedTests}
                  patient={patientForForm}
                  onChange={handleCombinedDataChange}
                  initialData={combinedReportData}
                />
              ) : selectedTemplate ? (
                <DynamicReportForm
                  reportType={selectedTemplate}
                  patient={patientForForm}
                  onChange={handleReportDataChange}
                  initialData={reportData}
                />
              ) : null}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer with Save Buttons */}
      <footer className="app-footer">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave('draft')}
              disabled={!canSave || isSaving}
              className="text-xs sm:text-sm"
            >
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Save as </span>Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave('completed')}
              disabled={!canSave || isSaving}
              className="text-xs sm:text-sm"
            >
              {isSaving ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Check className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Complete Report</span>
              <span className="sm:hidden">Complete</span>
            </Button>
          </div>
        </div>
      </footer>
      </EnhancedPageLayout>
    </>
  );
}
