import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { FileText, Clock, ArrowRight, User } from 'lucide-react';
import { format } from 'date-fns';
import { getReportTypeName } from '@/lib/report-templates';
import type { Report, Patient, ReportType } from '@/types/database';

export const RecentReportsWidget = () => {
  const navigate = useNavigate();
  const { clinicId } = useClinic();

  const { data: recentReports, isLoading } = useQuery({
    queryKey: ['recent-reports', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      
      const { data, error } = await supabase
        .from('reports')
        .select('id, report_type, report_number, test_date, status, patient:patients(full_name)')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as (Pick<Report, 'id' | 'report_type' | 'report_number' | 'test_date' | 'status'> & { patient: Pick<Patient, 'full_name'> | null })[];
    },
    enabled: !!clinicId,
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!recentReports?.length) {
    return null; // Don't show if no reports
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Recent Reports
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/reports')}
            className="text-xs h-7 px-2"
          >
            View All
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {recentReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
              onClick={() => navigate(`/reports/${report.id}`)}
            >
              <IconWrapper size="sm" className="shrink-0">
                <FileText className="h-3.5 w-3.5" />
              </IconWrapper>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {getReportTypeName(report.report_type as ReportType)}
                  </span>
                  <Badge
                    variant={report.status === 'completed' ? 'default' : 'outline'}
                    className="text-2xs shrink-0"
                  >
                    {report.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 truncate">
                    <User className="h-3 w-3" />
                    {report.patient?.full_name || 'Unknown'}
                  </span>
                  <span className="shrink-0">
                    {format(new Date(report.test_date), 'MMM d')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
