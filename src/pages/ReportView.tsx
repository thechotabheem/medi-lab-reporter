import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateReport, useDeleteReport } from '@/hooks/useReportMutations';
import { generateReportPDF, downloadPDF, sharePDFViaWhatsApp } from '@/lib/pdf-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  FileText,
  Download,
  Share2,
  Trash2,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Report, Patient, Clinic, Gender } from '@/types/database';
import { reportTemplates, getReportTypeName } from '@/lib/report-templates';

export default function ReportView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const deleteReport = useDeleteReport();
  const updateReport = useUpdateReport();

  const { data: report, isLoading } = useQuery({
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
    enabled: !!id && !!profile?.clinic_id,
  });

  const { data: clinic } = useQuery({
    queryKey: ['clinic', profile?.clinic_id],
    queryFn: async () => {
      if (!profile?.clinic_id) return null;
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', profile.clinic_id)
        .single();
      if (error) throw error;
      return data as Clinic;
    },
    enabled: !!profile?.clinic_id,
  });

  const handleDownloadPDF = async () => {
    if (!report?.patient) return;
    setIsGeneratingPDF(true);
    try {
      const doc = await generateReportPDF({
        report,
        patient: report.patient,
        clinic,
      });
      downloadPDF(doc, `${report.report_number}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!report?.patient) return;
    setIsGeneratingPDF(true);
    try {
      const doc = await generateReportPDF({
        report,
        patient: report.patient,
        clinic,
      });
      await sharePDFViaWhatsApp(doc, report.patient.phone || undefined);
    } catch (error) {
      console.error('Failed to share PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDelete = async () => {
    if (!report?.id) return;
    await deleteReport.mutateAsync(report.id);
    navigate('/reports');
  };

  const handleMarkComplete = async () => {
    if (!report?.id) return;
    await updateReport.mutateAsync({
      id: report.id,
      status: 'completed',
    });
  };

  const getValueStatus = (
    value: number | string | null | undefined,
    field: { normalRange?: { min?: number; max?: number; male?: { min?: number; max?: number }; female?: { min?: number; max?: number } } },
    gender: Gender
  ): 'normal' | 'abnormal' | 'unknown' => {
    if (value === null || value === undefined || value === '') return 'unknown';
    if (typeof value !== 'number') return 'unknown';
    if (!field.normalRange) return 'unknown';

    let min: number | undefined;
    let max: number | undefined;

    if (field.normalRange.male && field.normalRange.female) {
      const genderRange = gender === 'male' ? field.normalRange.male : field.normalRange.female;
      min = genderRange.min;
      max = genderRange.max;
    } else {
      min = field.normalRange.min;
      max = field.normalRange.max;
    }

    if (min !== undefined && value < min) return 'abnormal';
    if (max !== undefined && value > max) return 'abnormal';
    return 'normal';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Report not found</p>
            <Button onClick={() => navigate('/reports')} className="mt-4">
              Back to Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const template = reportTemplates[report.report_type];
  const reportData = report.report_data as Record<string, unknown>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">{getReportTypeName(report.report_type)}</h1>
              <p className="text-xs text-muted-foreground">{report.report_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              disabled={isGeneratingPDF}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this report. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Report Status */}
          {report.status === 'draft' && (
            <Card className="border-yellow-500/50 bg-yellow-500/10">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">This report is still a draft</span>
                </div>
                <Button size="sm" onClick={handleMarkComplete}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Patient & Report Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report Details</CardTitle>
                <Badge
                  variant={
                    report.status === 'completed'
                      ? 'default'
                      : report.status === 'verified'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {report.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Patient</p>
                    <p
                      className="text-sm font-medium cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/patients/${report.patient_id}`)}
                    >
                      {report.patient?.first_name} {report.patient?.last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Test Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(report.test_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {format(new Date(report.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {report.referring_doctor && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Referring Doctor</p>
                      <p className="text-sm font-medium">{report.referring_doctor}</p>
                    </div>
                  </div>
                )}
              </div>
              {report.clinical_notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Clinical Notes</p>
                  <p className="text-sm">{report.clinical_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          {template.categories.map((category) => {
            const categoryHasData = category.fields.some(
              (field) => reportData[field.name] !== undefined && reportData[field.name] !== null && reportData[field.name] !== ''
            );
            if (!categoryHasData) return null;

            return (
              <Card key={category.name}>
                <CardHeader>
                  <CardTitle className="text-lg text-primary">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {category.fields.map((field) => {
                      const value = reportData[field.name];
                      if (value === undefined || value === null || value === '') return null;

                      const status = getValueStatus(value as number, field, report.patient?.gender || 'other');
                      const isAbnormal = status === 'abnormal';

                      return (
                        <div
                          key={field.name}
                          className={`p-3 rounded-lg border ${
                            isAbnormal ? 'border-destructive/50 bg-destructive/10' : 'border-border'
                          }`}
                        >
                          <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                          <p
                            className={`text-lg font-semibold ${
                              isAbnormal ? 'text-destructive' : ''
                            }`}
                          >
                            {String(value)}
                            {field.unit && (
                              <span className="text-sm font-normal text-muted-foreground ml-1">
                                {field.unit}
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
