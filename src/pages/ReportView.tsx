import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { useUpdateReport, useDeleteReport } from '@/hooks/useReportMutations';
import { useCustomizedTemplate } from '@/hooks/useCustomTemplates';
import { generateReportPDF, downloadPDF, sharePDFViaWhatsApp } from '@/lib/pdf-generator.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  CheckCircle,
  AlertTriangle,
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Check,
  X,
  Printer,
  Pencil,
  GitCompare,
} from 'lucide-react';
import { formatDate, formatDateTime, formatDateForFile } from '@/lib/date-formats';
import type { Report, Patient, Clinic, Gender } from '@/types/database';
import { getReportTypeName, buildCombinedTemplate, flattenCombinedReportData } from '@/lib/report-templates';
import { calculateAgeFromDOB } from '@/lib/utils';
import '@/styles/print.css';
import { DataSourceBadge } from '@/components/DataSourceBadge';
import { useDataFreshness } from '@/hooks/useDataFreshness';

const calculateAge = (dateOfBirth: string): string => {
  return `${calculateAgeFromDOB(dateOfBirth)} years`;
};

export default function ReportView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clinicId } = useClinic();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { dataSource, lastFetchedAt } = useDataFreshness('report-' + id);

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
    enabled: !!id,
  });

  // Get customized template for this report type
  // For combined reports, build template from included_tests
  const isCombinedReport = report?.report_type === 'combined';
  const { template: baseTemplate, isLoading: isLoadingTemplate } = useCustomizedTemplate(
    isCombinedReport ? null : report?.report_type || null
  );
  
  // Build combined template if needed
  const template = isCombinedReport && report?.included_tests
    ? buildCombinedTemplate(report.included_tests)
    : baseTemplate;

  const { data: clinic } = useQuery({
    queryKey: ['clinic', clinicId],
    queryFn: async () => {
      if (!clinicId) return null;
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();
      if (error) throw error;
      return data as Clinic;
    },
    enabled: !!clinicId,
  });

  const handleDownloadPDF = async () => {
    if (!report?.patient) return;
    setIsGeneratingPDF(true);
    try {
      const blob = await generateReportPDF({ 
        report, 
        patient: report.patient, 
        clinic,
        customTemplate: template,
      });
      const safeName = report.patient.full_name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
      const testDate = report.test_date ? formatDateForFile(report.test_date) : '';
      downloadPDF(blob, `${safeName}_${report.report_number}_${testDate}.pdf`);
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
      const blob = await generateReportPDF({ 
        report, 
        patient: report.patient, 
        clinic,
        customTemplate: template,
      });
      await sharePDFViaWhatsApp(blob, report.patient.phone || undefined);
    } catch (error) {
      console.error('Failed to share PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  const formatNormalRange = (
    field: { normalRange?: { min?: number; max?: number; male?: { min?: number; max?: number }; female?: { min?: number; max?: number } } },
    gender: Gender
  ): string => {
    if (!field.normalRange) return '-';
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
    if (min !== undefined && max !== undefined) return `${min} - ${max}`;
    if (min !== undefined) return `> ${min}`;
    if (max !== undefined) return `< ${max}`;
    return '-';
  };

  if (isLoading || isLoadingTemplate) {
    return (
      <EnhancedPageLayout>
        <PageHeader title="Loading..." showBack />
        <HeaderDivider />
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          <div className="space-y-4 sm:space-y-6">
            <Card className="animate-pulse-glow">
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full mb-4" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </EnhancedPageLayout>
    );
  }

  if (!report) {
    return (
      <EnhancedPageLayout className="flex items-center justify-center">
        <EmptyState
          icon={FileText}
          title="Report not found"
          description="The report you're looking for doesn't exist or has been deleted."
          actionLabel="Back to Reports"
          onAction={() => navigate('/reports')}
        />
      </EnhancedPageLayout>
    );
  }

  // Use template from hook (already includes customizations)
  // For combined reports, flatten the namespaced data
  const rawReportData = report.report_data as Record<string, unknown>;
  const reportData = isCombinedReport && report.included_tests
    ? flattenCombinedReportData(rawReportData, report.included_tests)
    : rawReportData;

  // Collect all abnormal values (only if template is available)
  const abnormalValues: { label: string; value: string; range: string }[] = [];
  if (template) {
    template.categories.forEach((category) => {
      category.fields.forEach((field) => {
        const value = reportData[field.name];
        if (value !== undefined && value !== null && value !== '') {
          const status = getValueStatus(value as number, field, report.patient?.gender || 'other');
          if (status === 'abnormal') {
            abnormalValues.push({
              label: field.label,
              value: `${value}${field.unit ? ` ${field.unit}` : ''}`,
              range: formatNormalRange(field, report.patient?.gender || 'other'),
            });
          }
        }
      });
    });
  }

  return (
    <EnhancedPageLayout>
      <PageHeader
        title={isCombinedReport 
          ? `Combined Report (${report.included_tests?.length || 0} tests)` 
          : getReportTypeName(report.report_type)}
        subtitle={report.report_number}
        icon={<FileText className="h-5 w-5" />}
        showBack
        badge={<DataSourceBadge dataSource={dataSource} lastFetchedAt={lastFetchedAt} />}
        actions={
          <div className="flex gap-1 sm:gap-2 print-hide">
            {/* Compare with other reports */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/patients/${report.patient_id}/compare?reportB=${report.id}`)} 
              className="text-xs sm:text-sm"
            >
              <GitCompare className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Compare</span>
            </Button>
            {/* Edit button for all reports - allows adding tests to convert single to combined */}
            <Button variant="outline" size="sm" onClick={() => navigate(`/reports/${id}/edit`)} className="text-xs sm:text-sm">
              <Pencil className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{isCombinedReport ? 'Edit Tests' : 'Edit'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs sm:text-sm">
              <Printer className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Print</span>
            </Button>
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
      
      <HeaderDivider />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          <div className="space-y-6">
            {/* Draft Warning */}
            {report.status === 'draft' && (
              <FadeIn>
                <Card className="border-warning/50 bg-warning/5 animate-pulse-glow">
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

            {/* Professional Report Card */}
            <FadeIn delay={100}>
              <Card className="overflow-hidden print:shadow-none animate-pulse-glow card-gradient-overlay">
                {/* Clinic Letterhead */}
                <div className="bg-primary/5 border-b border-border p-4 sm:p-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      {clinic?.logo_url ? (
                        <img 
                          src={clinic.logo_url} 
                          alt="Clinic logo" 
                          className="h-12 w-12 object-contain rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-primary" />
                      )}
                      <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                        {clinic?.name || 'Medical Laboratory'}
                      </h1>
                    </div>
                    {clinic?.header_text && (
                      <p className="text-sm text-muted-foreground mb-2">{clinic.header_text}</p>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      {clinic?.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {clinic.address}
                        </span>
                      )}
                      {clinic?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {clinic.phone}
                        </span>
                      )}
                      {clinic?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {clinic.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Report Title Bar */}
                <div className="bg-primary text-primary-foreground px-4 sm:px-6 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">
                    {isCombinedReport 
                      ? `Combined Report (${report.included_tests?.map(t => getReportTypeName(t as any)).join(', ')})`
                      : getReportTypeName(report.report_type)}
                  </h2>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Report #: {report.report_number}</span>
                      <Badge 
                        variant={report.status === 'completed' ? 'secondary' : report.status === 'verified' ? 'default' : 'outline'}
                        className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                      >
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4 sm:p-6">
                  {/* Patient Information Grid */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Patient Name</p>
                        <p 
                          className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                          onClick={() => navigate(`/patients/${report.patient_id}`)}
                        >
                          {report.patient?.full_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Age / Gender</p>
                        <p className="text-sm font-medium">
                          {calculateAge(report.patient?.date_of_birth || '')} / {report.patient?.gender?.charAt(0).toUpperCase()}{report.patient?.gender?.slice(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Patient ID</p>
                        <p className="text-sm font-medium">{report.patient?.patient_id_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Test Date</p>
                        <p className="text-sm font-medium">{formatDate(report.test_date)}</p>
                      </div>
                      {report.referring_doctor && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Referring Doctor</p>
                          <p className="text-sm font-medium">{report.referring_doctor}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Abnormal Values Alert */}
                  {abnormalValues.length > 0 && (
                    <div className="mb-6">
                      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          <h3 className="text-sm font-semibold text-destructive">
                            Abnormal Values Detected ({abnormalValues.length})
                          </h3>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {abnormalValues.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm bg-background/50 rounded px-3 py-2">
                              <span className="font-medium text-destructive">{item.label}</span>
                              <span className="text-muted-foreground">
                                <span className="font-semibold text-destructive">{item.value}</span>
                                <span className="text-xs ml-2">(Ref: {item.range})</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Results Tables */}
                  {template && template.categories.map((category, catIndex) => {
                    const categoryFields = category.fields.filter(
                      (field) => reportData[field.name] !== undefined && reportData[field.name] !== null && reportData[field.name] !== ''
                    );
                    if (categoryFields.length === 0) return null;

                    return (
                      <div key={category.name} className="mb-6 last:mb-0">
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                          <span className="w-1 h-4 bg-primary rounded-full" />
                          {category.name}
                        </h3>
                        
                        {/* Desktop Table */}
                        <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold">Test</TableHead>
                                <TableHead className="font-semibold text-center">Result</TableHead>
                                <TableHead className="font-semibold text-center">Unit</TableHead>
                                <TableHead className="font-semibold text-center">Reference Range</TableHead>
                                <TableHead className="font-semibold text-center w-16">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryFields.map((field, fieldIndex) => {
                                const value = reportData[field.name];
                                const status = getValueStatus(value as number, field, report.patient?.gender || 'other');
                                const isAbnormal = status === 'abnormal';
                                const normalRange = formatNormalRange(field, report.patient?.gender || 'other');

                                return (
                                  <TableRow 
                                    key={field.name}
                                    className={isAbnormal ? 'bg-destructive/5' : fieldIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                                  >
                                    <TableCell className="font-medium">{field.label}</TableCell>
                                    <TableCell className={`text-center font-semibold ${isAbnormal ? 'text-destructive' : ''}`}>
                                      {String(value)}
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground">
                                      {field.unit || '-'}
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground">
                                      {normalRange}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {status === 'unknown' ? (
                                        <span className="text-muted-foreground">-</span>
                                      ) : isAbnormal ? (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/10">
                                          <X className="h-4 w-4 text-destructive" />
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10">
                                          <Check className="h-4 w-4 text-green-600" />
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden space-y-2">
                          {categoryFields.map((field) => {
                            const value = reportData[field.name];
                            const status = getValueStatus(value as number, field, report.patient?.gender || 'other');
                            const isAbnormal = status === 'abnormal';
                            const normalRange = formatNormalRange(field, report.patient?.gender || 'other');

                            return (
                              <div 
                                key={field.name}
                                className={`p-3 rounded-lg border transition-all duration-300 ${isAbnormal ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/20'}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{field.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Ref: {normalRange}
                                    </p>
                                  </div>
                                  <div className="text-right flex items-center gap-2">
                                    <span className={`text-lg font-bold ${isAbnormal ? 'text-destructive' : ''}`}>
                                      {String(value)}
                                    </span>
                                    {field.unit && (
                                      <span className="text-xs text-muted-foreground">{field.unit}</span>
                                    )}
                                    {status !== 'unknown' && (
                                      isAbnormal ? (
                                        <X className="h-4 w-4 text-destructive" />
                                      ) : (
                                        <Check className="h-4 w-4 text-green-600" />
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Clinical Notes */}
                  {report.clinical_notes && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                          <span className="w-1 h-4 bg-primary rounded-full" />
                          Clinical Notes
                        </h3>
                        <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border border-border">
                          {report.clinical_notes}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Footer Section */}
                  <Separator className="my-6" />
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Lab Technician</p>
                      <div className="border-b border-dashed border-muted-foreground/50 pb-1 w-48">
                        <p className="text-sm text-muted-foreground/50">Signature</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Pathologist</p>
                      <div className="border-b border-dashed border-muted-foreground/50 pb-1 w-48">
                        <p className="text-sm text-muted-foreground/50">Signature</p>
                      </div>
                    </div>
                  </div>

                  {/* Report Generation Info */}
                  <div className="mt-6 pt-4 border-t border-border text-center">
                    {clinic?.footer_text && (
                      <p className="text-xs text-muted-foreground italic mb-2">{clinic.footer_text}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Report generated on {formatDateTime(new Date())}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </main>
      </PageTransition>
    </EnhancedPageLayout>
  );
}
