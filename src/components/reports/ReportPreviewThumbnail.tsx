import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, RefreshCw, Maximize2 } from 'lucide-react';
import { generateReportPDF } from '@/lib/pdf-generator.tsx';
import { supabase } from '@/integrations/supabase/client';
import type { Report, Patient } from '@/types/database';

interface ReportPreviewThumbnailProps {
  report: Report;
  patient: Patient;
  clinicId: string;
  onOpenFullPreview: () => void;
}

export function ReportPreviewThumbnail({ 
  report, 
  patient, 
  clinicId, 
  onOpenFullPreview 
}: ReportPreviewThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateThumbnail = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch clinic branding
      let clinicData = null;
      try {
        const { data } = await supabase
          .from('clinics')
          .select('*')
          .eq('id', clinicId)
          .single();
        clinicData = data;
      } catch {
        // Continue with null clinic data if fetch fails (e.g. offline)
      }

      const blob = await generateReportPDF({
        report,
        patient,
        clinic: clinicData,
      });

      const url = URL.createObjectURL(blob);
      
      // Clean up previous URL
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
      
      setThumbnailUrl(url);
    } catch (err) {
      console.error('Thumbnail generation error:', err);
      setError('Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  }, [report, patient, clinicId]);

  // Generate thumbnail on mount and when data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      generateThumbnail();
    }, 800); // Debounce to avoid too many regenerations

    return () => clearTimeout(timer);
  }, [
    JSON.stringify(report.report_data),
    report.report_type,
    JSON.stringify(report.included_tests),
    patient.full_name,
    patient.gender,
    report.referring_doctor,
    report.test_date,
  ]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, []);

  return (
    <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg h-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconWrapper variant="secondary" size="default" className="transition-all duration-300 group-hover:scale-110">
              <FileText className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
            </IconWrapper>
            <div>
              <CardTitle className="text-base sm:text-lg">Live Preview</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Updates as you type
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={generateThumbnail}
              disabled={isLoading}
              title="Refresh preview"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onOpenFullPreview}
              disabled={isLoading}
              title="Open full preview"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="relative aspect-[210/297] w-full bg-background/50 rounded-lg border border-border/50 overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-xs text-muted-foreground">Generating preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2 p-4">
                <p className="text-sm text-destructive">{error}</p>
                <Button type="button" variant="outline" size="sm" onClick={generateThumbnail}>
                  Retry
                </Button>
              </div>
            </div>
          ) : thumbnailUrl ? (
            <iframe
              src={`${thumbnailUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              className="absolute inset-0 w-full h-full border-0"
              title="Report Preview"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Preview updates automatically
        </p>
      </CardContent>
    </Card>
  );
}
