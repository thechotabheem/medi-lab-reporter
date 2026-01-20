import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateReport, useDeleteReport } from '@/hooks/useReportMutations';
import { generateReportPDF, downloadPDF, sharePDFViaWhatsApp } from '@/lib/pdf-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
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
  FileText,
  Download,
  Share2,
  Trash2,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
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
      const doc = await generateReportPDF({ report, patient: report.patient, clinic });
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
      const doc = await generateReportPDF({ report, patient: report.patient, clinic });
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
    await updateReport.mutateAsync({ id: report.id, status: 'completed' });
  };

  const getValueStatus = (
    value: number | string | null | undefined,
    field: { normalRange?: { min?: number; max?: number; male?: { min?: number; max?: number }; female?: { min?: number; max?: number } } },
    gender: Gender
  ): 'normal' | 'abnormal' | 'unknown' => {
    if (value === null || value === undefined || value === '') return 'unknown';
    if (typeof value !== 'number') return 'unknown';
    if (!field.normalRange) return 'unknown';
    let min: number | undefined, max: number | undefined;
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
      <div className="page-container">
        <PageHeader title="Loading..." showBack />
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader className="p-4 sm:p-6"><Skeleton className="h-5 w-28" /></CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <Skeleton key={j} className="h-20 rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="page-container flex items-center justify-center">
        <EmptyState
          icon={FileText}
          title="Report not found"
          description="The report you're looking for doesn't exist or has been deleted."
          actionLabel="Back to Reports"
          onAction={() => navigate('/reports')}
        />
      </div>
    );
  }

  const template = reportTemplates[report.report_type];
  const reportData = report.report_data as Record<string, unknown>;

  return (
    <div className="page-container">
      <PageHeader
        title={getReportTypeName(report.report_type)}
        subtitle={report.report_number}
        icon={<FileText className="h-5 w-5" />}
        showBack
        actions={
          <div className="flex gap-1 sm:gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="text-xs sm:text-sm">
              {isGeneratingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 sm:mr-2" />}
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareWhatsApp} disabled={isGeneratingPDF} className="text-xs sm:text-sm">
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="mx-4 max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          <div className="space-y-4 sm:space-y-6">
            {/* Draft Warning */}
            {report.status === 'draft' && (
              <FadeIn>
                <Card className="border-warning/50 bg-warning/5">
                  <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <IconWrapper variant="warning" size="sm">
                        <AlertTriangle className="h-4 w-4" />
                      </IconWrapper>
                      <span className="text-sm font-medium">This report is still a draft</span>
                    </div>
                    <Button size="sm" onClick={handleMarkComplete} className="w-full sm:w-auto">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Report Details */}
            <FadeIn delay={100}>
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">Report Details</CardTitle>
                    <Badge variant={report.status === 'completed' ? 'default' : report.status === 'verified' ? 'secondary' : 'outline'}>
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Patient</p>
                        <p className="text-sm font-medium cursor-pointer hover:text-primary transition-colors truncate" onClick={() => navigate(`/patients/${report.patient_id}`)}>
                          {report.patient?.first_name} {report.patient?.last_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Test Date</p>
                        <p className="text-sm font-medium">{format(new Date(report.test_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="text-sm font-medium">{format(new Date(report.created_at), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    {report.referring_doctor && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Referring Doctor</p>
                          <p className="text-sm font-medium truncate">{report.referring_doctor}</p>
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
            </FadeIn>

            {/* Test Results */}
            {template.categories.map((category, catIndex) => {
              const categoryHasData = category.fields.some(
                (field) => reportData[field.name] !== undefined && reportData[field.name] !== null && reportData[field.name] !== ''
              );
              if (!categoryHasData) return null;

              return (
                <FadeIn key={category.name} delay={200 + catIndex * 100}>
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg text-primary">{category.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {category.fields.map((field) => {
                          const value = reportData[field.name];
                          if (value === undefined || value === null || value === '') return null;
                          const status = getValueStatus(value as number, field, report.patient?.gender || 'other');
                          const isAbnormal = status === 'abnormal';

                          return (
                            <div
                              key={field.name}
                              className={`p-3 rounded-lg border transition-all ${
                                isAbnormal 
                                  ? 'border-destructive/50 bg-destructive/5' 
                                  : 'border-border hover:border-primary/30'
                              }`}
                            >
                              <p className="text-xs text-muted-foreground mb-1 truncate">{field.label}</p>
                              <p className={`text-base sm:text-lg font-semibold ${isAbnormal ? 'text-destructive' : ''}`}>
                                {String(value)}
                                {field.unit && <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">{field.unit}</span>}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
