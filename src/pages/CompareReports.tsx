import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useReportComparison } from '@/hooks/useReportComparison';
import { useMultiReportComparison } from '@/hooks/useMultiReportComparison';
import { useClinic } from '@/contexts/ClinicContext';
import { ReportComparisonTable } from '@/components/reports/ReportComparisonTable';
import { MultiReportComparisonTable } from '@/components/reports/MultiReportComparisonTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GitCompare,
  ArrowLeftRight,
  Calendar,
  FileText,
  AlertCircle,
  Download,
  Loader2,
  Share2,
  Plus,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Report, Patient, Gender } from '@/types/database';
import { getReportTypeName } from '@/lib/report-templates';
import { downloadComparisonPDF, shareComparisonPDFViaWhatsApp } from '@/lib/comparison-pdf-generator';
import { downloadMultiComparisonPDF, shareMultiComparisonPDFViaWhatsApp } from '@/lib/multi-comparison-pdf-generator';

type ComparisonMode = 'dual' | 'multi';

export default function CompareReports() {
  const { id: patientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clinic } = useClinic();

  // Determine initial mode from URL params
  const initialReportsParam = searchParams.get('reports');
  const initialReportA = searchParams.get('reportA');
  const initialReportB = searchParams.get('reportB');

  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>(
    initialReportsParam ? 'multi' : 'dual'
  );

  // Dual mode state
  const [reportAId, setReportAId] = useState<string | null>(initialReportA);
  const [reportBId, setReportBId] = useState<string | null>(initialReportB);

  // Multi mode state
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>(
    initialReportsParam ? initialReportsParam.split(',').filter(Boolean) : []
  );

  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Fetch patient
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      if (error) throw error;
      return data as Patient;
    },
    enabled: !!patientId,
  });

  // Fetch all reports for this patient
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['patient-reports-for-comparison', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .order('test_date', { ascending: false });
      if (error) throw error;
      return data as Report[];
    },
    enabled: !!patientId,
  });

  // Auto-select reports on initial load
  useEffect(() => {
    if (reports && reports.length >= 2) {
      if (comparisonMode === 'dual') {
        if (!reportAId && !reportBId) {
          setReportAId(reports[1].id);
          setReportBId(reports[0].id);
        } else if (!reportAId && reportBId) {
          const otherReport = reports.find((r) => r.id !== reportBId);
          if (otherReport) setReportAId(otherReport.id);
        } else if (reportAId && !reportBId) {
          const otherReport = reports.find((r) => r.id !== reportAId);
          if (otherReport) setReportBId(otherReport.id);
        }
      } else {
        // Multi mode
        if (selectedReportIds.length === 0) {
          // Select the 3 most recent (or 2 if only 2 available)
          const count = Math.min(3, reports.length);
          setSelectedReportIds(reports.slice(0, count).map(r => r.id));
        }
      }
    }
  }, [reports, reportAId, reportBId, comparisonMode, selectedReportIds.length]);

  // Update URL when selections change
  useEffect(() => {
    const params = new URLSearchParams();
    if (comparisonMode === 'dual') {
      if (reportAId) params.set('reportA', reportAId);
      if (reportBId) params.set('reportB', reportBId);
    } else {
      if (selectedReportIds.length > 0) {
        params.set('reports', selectedReportIds.join(','));
      }
    }
    setSearchParams(params, { replace: true });
  }, [reportAId, reportBId, selectedReportIds, comparisonMode, setSearchParams]);

  // Fetch full report details for dual mode
  const { data: reportA, isLoading: reportALoading } = useQuery({
    queryKey: ['report', reportAId],
    queryFn: async () => {
      if (!reportAId) return null;
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportAId)
        .single();
      if (error) throw error;
      return data as Report;
    },
    enabled: !!reportAId && comparisonMode === 'dual',
  });

  const { data: reportB, isLoading: reportBLoading } = useQuery({
    queryKey: ['report', reportBId],
    queryFn: async () => {
      if (!reportBId) return null;
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportBId)
        .single();
      if (error) throw error;
      return data as Report;
    },
    enabled: !!reportBId && comparisonMode === 'dual',
  });

  // Fetch selected reports for multi mode
  const { data: multiReports, isLoading: multiReportsLoading } = useQuery({
    queryKey: ['multi-reports', selectedReportIds],
    queryFn: async () => {
      if (selectedReportIds.length < 2) return [];
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .in('id', selectedReportIds);
      if (error) throw error;
      // Sort by date (oldest first)
      return (data as Report[]).sort(
        (a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime()
      );
    },
    enabled: selectedReportIds.length >= 2 && comparisonMode === 'multi',
  });

  // Run comparison for dual mode
  const { comparison: dualComparison, uniqueToA, uniqueToB } = useReportComparison(
    reportA ?? null,
    reportB ?? null,
    (patient?.gender as Gender) || 'other'
  );

  // Run comparison for multi mode
  const { 
    comparison: multiComparison, 
    reportDates, 
    uniqueFields 
  } = useMultiReportComparison(
    multiReports ?? [],
    (patient?.gender as Gender) || 'other'
  );

  // Mode switch handler
  const handleModeChange = (mode: string) => {
    setComparisonMode(mode as ComparisonMode);
    // When switching modes, try to preserve selections
    if (mode === 'multi' && reportAId && reportBId) {
      setSelectedReportIds([reportAId, reportBId]);
    } else if (mode === 'dual' && selectedReportIds.length >= 2) {
      setReportAId(selectedReportIds[0]);
      setReportBId(selectedReportIds[1]);
    }
  };

  // Multi mode: Add report
  const addReport = (reportId: string) => {
    if (selectedReportIds.length < 5 && !selectedReportIds.includes(reportId)) {
      setSelectedReportIds([...selectedReportIds, reportId]);
    }
  };

  // Multi mode: Remove report
  const removeReport = (reportId: string) => {
    if (selectedReportIds.length > 2) {
      setSelectedReportIds(selectedReportIds.filter(id => id !== reportId));
    }
  };

  // Swap reports (dual mode)
  const handleSwap = () => {
    const temp = reportAId;
    setReportAId(reportBId);
    setReportBId(temp);
  };

  // Export comparison PDF
  const handleExportPDF = async () => {
    if (!patient) return;
    
    setIsExporting(true);
    try {
      if (comparisonMode === 'dual' && reportA && reportB) {
        await downloadComparisonPDF({
          reportA,
          reportB,
          patient,
          comparison: dualComparison,
          uniqueToA,
          uniqueToB,
          clinic,
        });
      } else if (comparisonMode === 'multi' && multiReports && multiReports.length >= 2) {
        await downloadMultiComparisonPDF({
          reports: multiReports,
          patient,
          comparison: multiComparison,
          reportDates,
          uniqueFields,
          clinic,
        });
      }
      toast.success('Comparison PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate comparison PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Share comparison via WhatsApp
  const handleShareWhatsApp = async () => {
    if (!patient) return;
    
    setIsSharing(true);
    try {
      if (comparisonMode === 'dual' && reportA && reportB) {
        await shareComparisonPDFViaWhatsApp({
          reportA,
          reportB,
          patient,
          comparison: dualComparison,
          uniqueToA,
          uniqueToB,
          clinic,
        });
      } else if (comparisonMode === 'multi' && multiReports && multiReports.length >= 2) {
        await shareMultiComparisonPDFViaWhatsApp({
          reports: multiReports,
          patient,
          comparison: multiComparison,
          reportDates,
          uniqueFields,
          clinic,
        });
      }
      toast.success('Opening WhatsApp...');
    } catch (error) {
      console.error('Failed to share PDF:', error);
      toast.error('Failed to share comparison PDF');
    } finally {
      setIsSharing(false);
    }
  };

  // Check if same report selected (dual mode)
  const sameReportSelected = comparisonMode === 'dual' && reportAId && reportBId && reportAId === reportBId;

  // Report labels for dual mode
  const reportALabel = useMemo(() => {
    if (!reportA) return 'Baseline';
    return `${format(new Date(reportA.test_date), 'MMM d, yyyy')}`;
  }, [reportA]);

  const reportBLabel = useMemo(() => {
    if (!reportB) return 'Current';
    return `${format(new Date(reportB.test_date), 'MMM d, yyyy')}`;
  }, [reportB]);

  const isLoading = patientLoading || reportsLoading;
  const isComparing = comparisonMode === 'dual' 
    ? (reportALoading || reportBLoading) 
    : multiReportsLoading;

  const hasValidComparison = comparisonMode === 'dual'
    ? (reportAId && reportBId && !sameReportSelected)
    : (selectedReportIds.length >= 2);

  const comparisonDataReady = comparisonMode === 'dual'
    ? dualComparison.length > 0
    : multiComparison.length > 0;

  // Available reports for adding (multi mode)
  const availableReports = reports?.filter(r => !selectedReportIds.includes(r.id)) ?? [];

  if (isLoading) {
    return (
      <EnhancedPageLayout>
        <PageHeader title="Loading..." showBack />
        <HeaderDivider />
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </EnhancedPageLayout>
    );
  }

  if (!patient) {
    return (
      <EnhancedPageLayout className="flex items-center justify-center">
        <EmptyState
          icon={GitCompare}
          title="Patient not found"
          description="The patient you're looking for doesn't exist."
          actionLabel="Back to Patients"
          onAction={() => navigate('/patients')}
        />
      </EnhancedPageLayout>
    );
  }

  if (!reports || reports.length < 2) {
    return (
      <EnhancedPageLayout className="flex items-center justify-center">
        <EmptyState
          icon={GitCompare}
          title="Not enough reports"
          description="You need at least 2 completed reports to compare."
          actionLabel="Back to Patient"
          onAction={() => navigate(`/patients/${patientId}`)}
        />
      </EnhancedPageLayout>
    );
  }

  return (
    <EnhancedPageLayout>
      <PageHeader
        title="Compare Reports"
        subtitle={patient.full_name}
        icon={<GitCompare className="h-5 w-5" />}
        showBack
        backPath={`/patients/${patientId}`}
      />

      <HeaderDivider />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
          <div className="space-y-6">
            {/* Mode Toggle */}
            <FadeIn>
              <Tabs value={comparisonMode} onValueChange={handleModeChange}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="dual">
                    2 Reports
                  </TabsTrigger>
                  <TabsTrigger value="multi" disabled={(reports?.length ?? 0) < 3}>
                    Multi-Report (3-5)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </FadeIn>

            {/* Dual Mode Selectors */}
            {comparisonMode === 'dual' && (
              <FadeIn delay={50}>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-[1fr_auto_1fr] items-start">
                  {/* Report A Selector */}
                  <Card className="animate-pulse-glow card-gradient-overlay">
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                          A
                        </Badge>
                        Baseline Report
                      </CardTitle>
                      <CardDescription className="text-xs">Earlier report to compare from</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <Select value={reportAId || ''} onValueChange={setReportAId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report..." />
                        </SelectTrigger>
                        <SelectContent>
                          {reports.map((r) => (
                            <SelectItem key={r.id} value={r.id} disabled={r.id === reportBId}>
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                <span>{getReportTypeName(r.report_type)}</span>
                                <span className="text-muted-foreground text-xs">
                                  {format(new Date(r.test_date), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {reportA && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(reportA.test_date), 'MMMM d, yyyy')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Swap Button */}
                  <div className="flex items-center justify-center md:pt-12">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleSwap}
                            disabled={!reportAId || !reportBId}
                            className="rounded-full"
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Swap reports</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Report B Selector */}
                  <Card className="animate-pulse-glow card-gradient-overlay">
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                          B
                        </Badge>
                        Current Report
                      </CardTitle>
                      <CardDescription className="text-xs">Later report to compare to</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <Select value={reportBId || ''} onValueChange={setReportBId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report..." />
                        </SelectTrigger>
                        <SelectContent>
                          {reports.map((r) => (
                            <SelectItem key={r.id} value={r.id} disabled={r.id === reportAId}>
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                <span>{getReportTypeName(r.report_type)}</span>
                                <span className="text-muted-foreground text-xs">
                                  {format(new Date(r.test_date), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {reportB && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(reportB.test_date), 'MMMM d, yyyy')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </FadeIn>
            )}

            {/* Multi Mode Selectors */}
            {comparisonMode === 'multi' && (
              <FadeIn delay={50}>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {selectedReportIds.map((id, idx) => {
                      const report = reports.find(r => r.id === id);
                      if (!report) return null;
                      return (
                        <Card key={id} className="relative min-w-[160px] flex-1 max-w-[200px] animate-pulse-glow">
                          {selectedReportIds.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => removeReport(id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-2xs">
                                {idx + 1}
                              </Badge>
                              <span className="text-xs font-medium truncate">
                                {getReportTypeName(report.report_type)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(report.test_date), 'MMM d, yyyy')}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {/* Add Report Button */}
                    {selectedReportIds.length < 5 && availableReports.length > 0 && (
                      <Card className="min-w-[160px] flex-1 max-w-[200px] border-dashed">
                        <CardContent className="p-3">
                          <Select onValueChange={addReport}>
                            <SelectTrigger className="border-none shadow-none p-0 h-auto">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Plus className="h-4 w-4" />
                                <span className="text-xs">Add Report</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {availableReports.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    <span>{getReportTypeName(r.report_type)}</span>
                                    <span className="text-muted-foreground text-xs">
                                      {format(new Date(r.test_date), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {selectedReportIds.length} of 5 reports selected. 
                    {selectedReportIds.length < 5 && availableReports.length > 0 && ' Add more for comprehensive analysis.'}
                  </p>
                </div>
              </FadeIn>
            )}

            {/* Warning if same report selected (dual mode) */}
            {sameReportSelected && (
              <FadeIn delay={100}>
                <Card className="border-warning/50 bg-warning/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    <p className="text-sm text-warning">Please select two different reports to compare.</p>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Comparison Results */}
            {hasValidComparison && (
              <FadeIn delay={200}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <GitCompare className="h-5 w-5 text-primary" />
                      Comparison Results
                    </h2>
                    {!isComparing && comparisonDataReady && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportPDF}
                          disabled={isExporting || isSharing}
                        >
                          {isExporting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Export PDF
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShareWhatsApp}
                          disabled={isExporting || isSharing}
                        >
                          {isSharing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sharing...
                            </>
                          ) : (
                            <>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {isComparing ? (
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : comparisonMode === 'dual' ? (
                    <ReportComparisonTable
                      comparison={dualComparison}
                      uniqueToA={uniqueToA}
                      uniqueToB={uniqueToB}
                      reportALabel={reportALabel}
                      reportBLabel={reportBLabel}
                    />
                  ) : (
                    <MultiReportComparisonTable
                      comparison={multiComparison}
                      reportDates={reportDates}
                      uniqueFields={uniqueFields}
                    />
                  )}
                </div>
              </FadeIn>
            )}
          </div>
        </main>
      </PageTransition>
    </EnhancedPageLayout>
  );
}
