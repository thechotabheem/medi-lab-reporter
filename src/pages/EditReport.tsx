import { useState, useCallback, useEffect } from 'react';
import { useLogActivity } from '@/hooks/useActivityLog';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { TemplateSelector } from '@/components/reports/TemplateSelector';
import { DynamicReportForm } from '@/components/reports/DynamicReportForm';
import { CombinedReportForm } from '@/components/reports/CombinedReportForm';
import { TestSelectionSummary } from '@/components/reports/TestSelectionSummary';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import { SuccessAnimation } from '@/components/ui/success-animation';
import { Skeleton } from '@/components/ui/skeleton';
import { useClinic } from '@/contexts/ClinicContext';
import { supabase } from '@/integrations/supabase/client';
import { getReportTypeName } from '@/lib/report-templates';
import type { Patient, ReportType, Report } from '@/types/database';
import { Check, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { enqueueAction } from '@/lib/offlineQueue';

export default function EditReport() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();

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

  // Fetch the existing report
  const { data: report, isLoading: isLoadingReport } = useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('reports')
        .select('*, patient:patients(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Report & { patient: Patient };
    },
    enabled: !!id,
  });

  // Initialize form state from existing report
  useEffect(() => {
    if (report) {
      setReportDetails({
        referring_doctor: report.referring_doctor || '',
        clinical_notes: report.clinical_notes || '',
        test_date: report.test_date,
      });

      if (report.report_type === 'combined' && report.included_tests) {
        setSelectedTests(report.included_tests as ReportType[]);
        setCombinedReportData(report.report_data as Record<string, Record<string, string | number | boolean | null>>);
      } else {
        setSelectedTests([report.report_type]);
        setCombinedReportData({ [report.report_type]: report.report_data as Record<string, string | number | boolean | null> });
      }
    }
  }, [report]);

  const handleCombinedDataChange = useCallback((data: Record<string, Record<string, string | number | boolean | null>>) => {
    setCombinedReportData(data);
  }, []);

  const isCombinedReport = report?.report_type === 'combined';
  const canSave = selectedTests.length > 0 && reportDetails.test_date;

  const handleSave = async (status: 'draft' | 'completed') => {
    if (!clinicId || !id || !report) return;

    const shouldBeCombined = selectedTests.length > 1 || isCombinedReport;
    setIsSaving(true);

    try {
      const reportType: ReportType = shouldBeCombined ? 'combined' : selectedTests[0];
      const finalReportData = shouldBeCombined 
        ? combinedReportData 
        : combinedReportData[selectedTests[0]] || {};
      const includedTests = shouldBeCombined ? selectedTests : null;

      const updatePayload = {
        report_type: reportType,
        report_data: finalReportData as any,
        included_tests: includedTests,
        referring_doctor: reportDetails.referring_doctor || null,
        clinical_notes: reportDetails.clinical_notes || null,
        test_date: reportDetails.test_date,
        status,
        updated_at: new Date().toISOString(),
      };

      if (!navigator.onLine) {
        await enqueueAction('update-report', { ...updatePayload, _entityId: id });
        setSuccessMessage({
          title: 'Saved Offline!',
          subtitle: 'Your changes will sync when connected',
        });
        setShowSuccess(true);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: reportError } = await supabase
        .from('reports')
        .update(updatePayload)
        .eq('id', id);

      if (reportError) throw reportError;

      // Log activity
      logActivity({
        action: 'updated',
        entity_type: 'report',
        entity_id: id,
        entity_name: `Report ${report?.report_number || id}`,
      });

      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report', id] });
      
      setSuccessMessage({
        title: status === 'completed' ? 'Report Updated!' : 'Draft Saved!',
        subtitle: `${selectedTests.length > 1 ? 'Combined ' : ''}Report has been updated successfully`,
      });
      setShowSuccess(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      // Network error fallback
      if (!navigator.onLine || (error instanceof Error && error.message.includes('fetch'))) {
        await enqueueAction('update-report', {
          report_type: shouldBeCombined ? 'combined' : selectedTests[0],
          report_data: shouldBeCombined ? combinedReportData : combinedReportData[selectedTests[0]] || {},
          included_tests: shouldBeCombined ? selectedTests : null,
          referring_doctor: reportDetails.referring_doctor || null,
          clinical_notes: reportDetails.clinical_notes || null,
          test_date: reportDetails.test_date,
          status,
          _entityId: id,
        } as any);
        toast.success('Saved offline - will sync when connected');
        navigate(`/reports/${id}`);
        return;
      }
      toast.error('Failed to save: ' + message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessComplete = useCallback(() => {
    setShowSuccess(false);
    navigate(`/reports/${id}`);
  }, [navigate, id]);

  if (isLoadingReport) {
    return (
      <EnhancedPageLayout>
        <PageHeader title="Edit Report" showBack />
        <HeaderDivider />
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </main>
      </EnhancedPageLayout>
    );
  }

  if (!report) {
    return (
      <EnhancedPageLayout>
        <PageHeader title="Report Not Found" showBack />
        <HeaderDivider />
        <main className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-warning" />
              <p>The report you're looking for doesn't exist.</p>
              <Button className="mt-4" onClick={() => navigate('/reports')}>
                Back to Reports
              </Button>
            </CardContent>
          </Card>
        </main>
      </EnhancedPageLayout>
    );
  }

  // Create a patient object for the form
  const patientForForm: Patient = report.patient;

  return (
    <>
      <SuccessAnimation
        isVisible={showSuccess}
        onComplete={handleSuccessComplete}
        message={successMessage.title}
        submessage={successMessage.subtitle}
      />

      <EnhancedPageLayout className="pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
        <PageHeader 
          title="Edit Report" 
          subtitle={`${report.report_number} • ${patientForForm.full_name}`}
          showBack 
          backPath={`/reports/${id}`} 
        />
        
        <HeaderDivider />

        <main className="container mx-auto px-4 py-4 sm:py-6 space-y-6">
          {/* Patient Info Card (read-only) */}
          <Card className="relative animate-fade-in-up card-gradient-overlay">
            <CardHeader className="p-4 sm:p-6 relative z-10">
              <CardTitle className="text-base sm:text-lg">Patient</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {patientForForm.full_name} • {patientForForm.patient_id_number || 'No ID'}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Test Selection */}
          <Card className="relative animate-fade-in-up animation-delay-100 card-gradient-overlay">
            <CardHeader className="p-4 sm:p-6 relative z-10">
              <CardTitle className="text-base sm:text-lg">Selected Tests</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Add more tests to create a combined report, or remove tests
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 relative z-10">
              <TemplateSelector 
                onSelect={() => {}}
                multiSelect={true}
                selectedTypes={selectedTests}
                onMultiSelect={setSelectedTests}
              />
              {/* Summary card */}
              {selectedTests.length > 0 && (
                <div className="mt-4">
                  <TestSelectionSummary selectedTests={selectedTests} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report Details */}
          <Card className="relative animate-fade-in-up animation-delay-200 card-gradient-overlay">
            <CardHeader className="p-4 sm:p-6 relative z-10">
              <CardTitle className="text-base sm:text-lg">Report Details</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {selectedTests.length > 1 
                  ? `Combined Report (${selectedTests.length} tests)`
                  : selectedTests.length === 1 
                    ? getReportTypeName(selectedTests[0])
                    : 'Select at least one test'}
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

          {/* Test Results */}
          {selectedTests.length > 0 && (
            <Card className="relative animate-fade-in-up animation-delay-300 card-gradient-overlay">
              <CardHeader className="p-4 sm:p-6 relative z-10">
                <CardTitle className="text-base sm:text-lg">Test Results</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Abnormal values will be highlighted</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 relative z-10">
                {selectedTests.length > 1 ? (
                  <CombinedReportForm
                    selectedTests={selectedTests}
                    patient={patientForForm}
                    onChange={handleCombinedDataChange}
                    initialData={combinedReportData}
                  />
                ) : (
                  <DynamicReportForm
                    reportType={selectedTests[0]}
                    patient={patientForForm}
                    onChange={(data) => setCombinedReportData({ [selectedTests[0]]: data })}
                    initialData={combinedReportData[selectedTests[0]] || {}}
                  />
                )}
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
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </Button>
            </div>
          </div>
        </footer>
      </EnhancedPageLayout>
    </>
  );
}
