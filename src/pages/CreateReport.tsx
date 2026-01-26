import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PatientSelector, NewPatientData } from '@/components/reports/PatientSelector';
import { TemplateSelector } from '@/components/reports/TemplateSelector';
import { DynamicReportForm } from '@/components/reports/DynamicReportForm';
import { DraftBanner } from '@/components/reports/DraftBanner';
import { useDraftReport, DraftReport } from '@/hooks/useDraftReport';
import { useClinic } from '@/contexts/ClinicContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { getReportTypeName } from '@/lib/report-templates';
import type { Patient, ReportType } from '@/types/database';
import { Check, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateReport() {
  const navigate = useNavigate();
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();
  const { draft, hasDraft, saveDraft, clearDraft } = useDraftReport();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatientData, setNewPatientData] = useState<NewPatientData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportType | null>(null);
  const [reportDetails, setReportDetails] = useState({
    referring_doctor: '',
    clinical_notes: '',
    test_date: new Date().toISOString().split('T')[0],
  });
  const [reportData, setReportData] = useState<Record<string, string | number | boolean | null>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [draftApplied, setDraftApplied] = useState(false);

  // Auto-save on changes (after initial load)
  useEffect(() => {
    if (draftApplied || !hasDraft && (selectedPatient || newPatientData || selectedTemplate)) {
      saveDraft({
        patient: selectedPatient ? { id: selectedPatient.id, full_name: selectedPatient.full_name } : null,
        newPatientData: newPatientData || null,
        selectedTemplate,
        reportDetails,
        reportData,
      });
    }
  }, [selectedPatient, newPatientData, selectedTemplate, reportDetails, reportData, draftApplied]);

  const handleReportDataChange = useCallback((data: Record<string, string | number | boolean | null>) => {
    setReportData(data);
  }, []);

  const handleResumeDraft = useCallback(() => {
    if (!draft) return;
    
    // Restore draft state
    if (draft.patient) {
      // We only have id and name from draft, need to fetch full patient
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
    
    setDraftApplied(true);
    toast.success('Draft restored');
  }, [draft]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setDraftApplied(true);
    toast.info('Draft discarded');
  }, [clearDraft]);

  // Can save if we have (existing patient OR valid new patient data) AND a template AND test date
  const canSave = (selectedPatient || newPatientData) && selectedTemplate && reportDetails.test_date;

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

  // Get patient for the form (use a mock patient object for new patients to calculate reference ranges)
  const getPatientForForm = (): Patient | null => {
    if (selectedPatient) return selectedPatient;
    if (newPatientData) {
      // Import ageToDateOfBirth for converting age to date_of_birth
      const { ageToDateOfBirth } = require('@/lib/utils');
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

  const handleSave = async (status: 'draft' | 'completed') => {
    if (!clinicId || !selectedTemplate) return;

    setIsSaving(true);

    try {
      let patientId: string;

      // If new patient, create them first
      if (newPatientData && !selectedPatient) {
        const { ageToDateOfBirth } = require('@/lib/utils');
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
        
        // Invalidate patients query so the list updates
        queryClient.invalidateQueries({ queryKey: ['patients'] });
      } else if (selectedPatient) {
        patientId = selectedPatient.id;
      } else {
        throw new Error('No patient selected');
      }

      // Generate report number
      const reportNumber = `RPT-${Date.now().toString(36).toUpperCase()}`;

      // Create the report
      const { error: reportError } = await supabase
        .from('reports')
        .insert({
          clinic_id: clinicId,
          created_by: null,
          report_number: reportNumber,
          patient_id: patientId,
          report_type: selectedTemplate,
          report_data: reportData,
          referring_doctor: reportDetails.referring_doctor || null,
          clinical_notes: reportDetails.clinical_notes || null,
          test_date: reportDetails.test_date,
          status,
        });

      if (reportError) throw reportError;

      // Clear draft on successful save
      clearDraft();

      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success(newPatientData && !selectedPatient 
        ? 'Patient registered and report created successfully' 
        : 'Report created successfully'
      );
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Failed to save: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const patientForForm = getPatientForForm();
  const patientDisplayName = getPatientDisplayName();

  // Show draft banner if there's a draft and we haven't applied or discarded it
  const showDraftBanner = hasDraft && draft && !draftApplied;

  return (
    <div className="page-container pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
      <PageHeader title="Create New Report" subtitle="Fill in all sections to create a report" showBack backPath="/dashboard" />

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
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">1. Patient</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Add a new patient or select an existing one</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <PatientSelector 
              onSelect={setSelectedPatient} 
              selectedPatient={selectedPatient}
              onNewPatientChange={setNewPatientData}
              newPatientData={newPatientData}
            />
          </CardContent>
        </Card>

        {/* Section 2: Template Selection */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">2. Select Test Type</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Choose the type of report to create</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <TemplateSelector onSelect={setSelectedTemplate} selectedType={selectedTemplate} />
          </CardContent>
        </Card>

        {/* Section 3: Report Details */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">3. Report Details</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {selectedTemplate && patientDisplayName
                ? `${getReportTypeName(selectedTemplate)} for ${patientDisplayName}`
                : 'Add additional information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
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

        {/* Section 4: Test Results - Only show when patient and template are selected */}
        {selectedTemplate && patientForForm && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
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
            <CardContent className="p-4 sm:p-6 pt-0">
              <DynamicReportForm
                reportType={selectedTemplate}
                patient={patientForForm}
                onChange={handleReportDataChange}
                initialData={reportData}
              />
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
    </div>
  );
}
