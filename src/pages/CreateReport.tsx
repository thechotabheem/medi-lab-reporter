import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLogActivity } from '@/hooks/useActivityLog';
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
import { TestSelectionSummary } from '@/components/reports/TestSelectionSummary';
import { ReportPreviewThumbnail } from '@/components/reports/ReportPreviewThumbnail';
import type { QuickCustomTestData } from '@/components/reports/QuickCustomTestDialog';
import { DraftBanner } from '@/components/reports/DraftBanner';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import { SuccessAnimation } from '@/components/ui/success-animation';
import { useDraftReport } from '@/hooks/useDraftReport';
import { useClinic } from '@/contexts/ClinicContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { getReportTypeName } from '@/lib/report-templates';
import { isCustomTemplateCode, getReportSaveParams } from '@/lib/template-utils';
import { generateReportPDF, downloadPDF } from '@/lib/pdf-generator.tsx';
import { ageToDateOfBirth } from '@/lib/utils';
import type { Patient, Report, ReportType } from '@/types/database';
import { Check, Save, Layers, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import { enqueueAction } from '@/lib/offlineQueue';
import { generateReportNumber, generatePatientId } from '@/lib/id-generators';

export default function CreateReport() {
  const navigate = useNavigate();
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
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
  
  // Quick custom tests
  const [quickCustomTests, setQuickCustomTests] = useState<QuickCustomTestData[]>([]);

  const [reportDetails, setReportDetails] = useState({
    referring_doctor: '',
    clinical_notes: '',
    test_date: new Date().toISOString().split('T')[0],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  // Validate that at least one field has data
  const validateReportData = (): boolean => {
    if (isCombinedMode) {
      // Check if any test has at least one non-empty value
      const hasData = Object.values(combinedReportData).some(testData => 
        Object.values(testData).some(value => 
          value !== null && value !== '' && value !== undefined
        )
      );
      if (!hasData) {
        toast.error('Please fill in at least one test value before saving');
        return false;
      }
    } else {
      // Single test mode
      const hasData = Object.values(reportData).some(value => 
        value !== null && value !== '' && value !== undefined
      );
      if (!hasData) {
        toast.error('Please fill in at least one test value before saving');
        return false;
      }
    }
    return true;
  };

  const handlePreviewPDF = async () => {
    if (!previewReport) {
      toast.error('Please select a patient and test type first');
      return;
    }

    setIsGeneratingPreview(true);
    try {
      const { report, patient } = previewReport;
      
      // Fetch clinic branding
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      const pdfBlob = await generateReportPDF({
        report,
        patient,
        clinic: clinicData,
      });

      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleExportPDF = async () => {
    if (!previewReport) {
      toast.error('Please select a patient and test type first');
      return;
    }

    setIsExporting(true);
    try {
      const { report, patient } = previewReport;
      
      // Fetch clinic branding
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      const pdfBlob = await generateReportPDF({
        report,
        patient,
        clinic: clinicData,
      });

      downloadPDF(pdfBlob, `${patient.full_name}_Report_${report.report_number}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async (status: 'draft' | 'completed') => {
    if (!clinicId) return;

    // Validate data for completed reports (skip validation for drafts)
    if (status === 'completed' && !validateReportData()) {
      return;
    }

    setIsSaving(true);

    try {
      let patientId: string;

      // If new patient, create them first
      if (newPatientData && !selectedPatient) {
        // Auto-generate patient ID if not provided
        const patientIdNumber = newPatientData.patient_id_number || await generatePatientId(clinicId);

        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            clinic_id: clinicId,
            full_name: newPatientData.full_name,
            date_of_birth: ageToDateOfBirth(newPatientData.age),
            gender: newPatientData.gender,
            phone: newPatientData.phone || null,
            patient_id_number: patientIdNumber,
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

      // Determine report type first so we can generate the number
      const effectiveType = isCombinedMode ? 'combined' : (selectedTemplate || 'combined');

      // Generate report number based on type
      const reportNumber = await generateReportNumber(effectiveType, clinicId);

      // Determine report type and data
      let reportType: ReportType;
      let finalReportData: Record<string, unknown>;
      let includedTests: string[] | null = null;

      if (isCombinedMode && selectedTests.length > 0) {
        reportType = 'combined';
        finalReportData = combinedReportData;
        includedTests = selectedTests;
      } else if (selectedTemplate) {
        const saveParams = getReportSaveParams(selectedTemplate, reportData);
        reportType = saveParams.reportType;
        finalReportData = saveParams.finalReportData;
        includedTests = saveParams.includedTests;
      } else {
        throw new Error('No test type selected');
      }

      // Create the report
      const reportPayload = {
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
      };

      if (!navigator.onLine) {
        // If new patient was just created inline, attach to payload for later sync
        if (newPatientData && !selectedPatient) {
          (reportPayload as any)._newPatient = {
            clinic_id: clinicId,
            full_name: newPatientData.full_name,
            date_of_birth: ageToDateOfBirth(newPatientData.age),
            gender: newPatientData.gender,
            phone: newPatientData.phone || null,
            patient_id_number: newPatientData.patient_id_number || null,
          };
        }
        await enqueueAction('create-report', reportPayload as any);
        clearDraft();
        const testCount = isCombinedMode ? selectedTests.length : 1;
        setSuccessMessage({
          title: 'Saved Offline!',
          subtitle: `Your ${testCount > 1 ? 'combined ' : ''}report will sync when connected`,
        });
        setShowSuccess(true);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: reportError } = await supabase
        .from('reports')
        .insert([reportPayload]);

      if (reportError) throw reportError;

      // Log activity
      const patientName = selectedPatient?.full_name || newPatientData?.full_name || 'Unknown';
      logActivity({
        action: 'created',
        entity_type: 'report',
        entity_name: `${reportNumber} for ${patientName}`,
      });

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
      console.error('Report save error:', error);
      const message = error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error) ? String((error as any).message) : JSON.stringify(error);
      // Network error fallback - enqueue offline
      const errorMsg = typeof message === 'string' ? message : 'Unknown error';
      if (!navigator.onLine || errorMsg.includes('fetch')) {
        const reportPayload = {
          clinic_id: clinicId,
          report_number: `RPT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(), // fallback for offline
          report_type: isCombinedMode ? 'combined' : selectedTemplate,
          report_data: isCombinedMode ? combinedReportData : reportData,
          included_tests: isCombinedMode ? selectedTests : null,
          referring_doctor: reportDetails.referring_doctor || null,
          clinical_notes: reportDetails.clinical_notes || null,
          test_date: reportDetails.test_date,
          status,
        };
        await enqueueAction('create-report', reportPayload as any);
        clearDraft();
        toast.success('Saved offline - will sync when connected');
        navigate('/dashboard');
        return;
      }
      toast.error('Failed to save: ' + errorMsg);
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
  
  // Memoize preview report to avoid repeated calls
  const previewReport = useMemo(() => {
    const patient = patientForForm;
    if (!patient) return null;

    // Determine report type and data
    let reportType: ReportType;
    let finalReportData: Record<string, unknown>;
    let includedTests: string[] | null = null;

    if (isCombinedMode && selectedTests.length > 0) {
      reportType = 'combined';
      finalReportData = combinedReportData;
      includedTests = selectedTests;
    } else if (selectedTemplate) {
      const saveParams = getReportSaveParams(selectedTemplate, reportData);
      reportType = saveParams.reportType;
      finalReportData = saveParams.finalReportData;
      includedTests = saveParams.includedTests;
    } else {
      return null;
    }

    const report: Report = {
      id: 'preview',
      clinic_id: clinicId || '',
      created_by: null,
      report_number: `PREVIEW-${Date.now().toString(36).toUpperCase()}`,
      patient_id: patient.id,
      report_type: reportType,
      report_data: finalReportData,
      included_tests: includedTests,
      referring_doctor: reportDetails.referring_doctor || null,
      clinical_notes: reportDetails.clinical_notes || null,
      test_date: reportDetails.test_date,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return { report, patient };
  }, [patientForForm, isCombinedMode, selectedTests, combinedReportData, selectedTemplate, reportData, clinicId, reportDetails]);

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
              customTests={quickCustomTests}
              onAddCustomTest={(test) => {
                setQuickCustomTests(prev => [...prev, test]);
                // Also add to selected tests for the combined report
                setSelectedTests(prev => [...prev, test.code as ReportType]);
              }}
            />
            {/* Summary card for selected tests */}
            {isCombinedMode && (selectedTests.length > 0 || quickCustomTests.length > 0) && (
              <div className="mt-4">
                <TestSelectionSummary 
                  selectedTests={selectedTests} 
                  customTests={quickCustomTests}
                />
              </div>
            )}
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

        {/* Section 4: Test Results with Live Preview */}
        {patientForForm && (isCombinedMode ? selectedTests.length > 0 : selectedTemplate) && (
          <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
            {/* Test Results Form */}
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
            
            {/* Live PDF Preview Thumbnail */}
            {previewReport && clinicId && (
              <div className="hidden lg:block animate-fade-in-up animation-delay-400">
                <div className="sticky top-4">
                  <ReportPreviewThumbnail
                    report={previewReport.report}
                    patient={previewReport.patient}
                    clinicId={clinicId}
                    onOpenFullPreview={handlePreviewPDF}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer with Save Buttons */}
      <footer className="app-footer">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviewPDF}
              disabled={!hasPatient || !hasTest || isGeneratingPreview}
              className="text-xs sm:text-sm"
            >
              {isGeneratingPreview ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Eye className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportPDF}
              disabled={!hasPatient || !hasTest || isExporting}
              className="text-xs sm:text-sm"
            >
              {isExporting ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Download className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Export</span>
            </Button>
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
