import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PatientSelector } from '@/components/reports/PatientSelector';
import { TemplateSelector } from '@/components/reports/TemplateSelector';
import { DynamicReportForm } from '@/components/reports/DynamicReportForm';
import { useCreateReport } from '@/hooks/useReports';
import { getReportTypeName } from '@/lib/report-templates';
import type { Patient, ReportType } from '@/types/database';
import { Check, Save } from 'lucide-react';

export default function CreateReport() {
  const navigate = useNavigate();
  const createReport = useCreateReport();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportType | null>(null);
  const [reportDetails, setReportDetails] = useState({
    referring_doctor: '',
    clinical_notes: '',
    test_date: new Date().toISOString().split('T')[0],
  });
  const [reportData, setReportData] = useState<Record<string, string | number | boolean | null>>({});

  const handleReportDataChange = useCallback((data: Record<string, string | number | boolean | null>) => {
    setReportData(data);
  }, []);

  const canSave = selectedPatient && selectedTemplate && reportDetails.test_date;

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

  return (
    <div className="page-container pb-24">
      <PageHeader title="Create New Report" subtitle="Fill in all sections to create a report" showBack backPath="/dashboard" />

      <main className="container mx-auto px-4 py-4 sm:py-6 space-y-6">
        {/* Section 1: Patient Selection */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">1. Select Patient</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Choose the patient for this report</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <PatientSelector onSelect={setSelectedPatient} selectedPatient={selectedPatient} />
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
              {selectedTemplate && selectedPatient
                ? `${getReportTypeName(selectedTemplate)} for ${selectedPatient.first_name} ${selectedPatient.last_name}`
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
        {selectedTemplate && selectedPatient && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">4. Enter Test Results</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Abnormal values will be highlighted</CardDescription>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Patient: <span className="font-medium text-foreground">{selectedPatient.first_name} {selectedPatient.last_name}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <DynamicReportForm
                reportType={selectedTemplate}
                patient={selectedPatient}
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
              disabled={!canSave || createReport.isPending}
              className="text-xs sm:text-sm"
            >
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Save as </span>Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave('completed')}
              disabled={!canSave || createReport.isPending}
              className="text-xs sm:text-sm"
            >
              {createReport.isPending ? (
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
