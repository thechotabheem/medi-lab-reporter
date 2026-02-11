import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, RefreshCw, Maximize2 } from 'lucide-react';
import { generateReportPDF } from '@/lib/pdf-generator';
import type { Report, Patient } from '@/types/database';

interface PDFPreviewThumbnailProps {
  clinicBranding: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
    header_text?: string;
    footer_text?: string;
    watermark_text?: string;
    enable_qr_code?: boolean;
    accent_color?: string;
    tagline?: string;
    website?: string;
    font_size?: string;
    show_logo_on_all_pages?: boolean;
    signature_title_left?: string;
    signature_title_right?: string;
    page_size?: string;
    show_abnormal_summary?: boolean;
    show_patient_id?: boolean;
    border_style?: string;
    secondary_color?: string;
    contact_display_format?: string;
    pdf_style?: string;
    logo_watermark_enabled?: boolean;
  };
  clinicId: string;
  onOpenFullPreview: () => void;
}

// Sample data for comprehensive preview
const createMockData = (clinicId: string) => {
  const mockPatient: Patient = {
    id: 'preview-patient',
    clinic_id: clinicId,
    full_name: 'John Sample Patient',
    gender: 'male',
    date_of_birth: '1985-06-15',
    patient_id_number: 'PID-2024-001',
    phone: '+1 555 123 4567',
    email: 'patient@example.com',
    address: '123 Sample Street, City',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockReport: Report = {
    id: 'preview-report',
    clinic_id: clinicId,
    patient_id: mockPatient.id,
    report_type: 'combined',
    report_number: 'RPT-PREVIEW-001',
    test_date: new Date().toISOString().split('T')[0],
    status: 'completed',
    referring_doctor: 'Dr. Sample Physician',
    clinical_notes: 'Sample clinical notes demonstrating how notes appear in the report.',
    included_tests: ['cbc', 'lft', 'lipid_profile'],
    report_data: {
      // CBC data (namespaced)
      'cbc.hemoglobin': 14.5,
      'cbc.rbc': 5.2,
      'cbc.wbc': 7500,
      'cbc.platelets': 250000,
      'cbc.hematocrit': 42,
      'cbc.mcv': 88,
      'cbc.mch': 29,
      'cbc.mchc': 33,
      // LFT data (namespaced) - with some abnormal values
      'lft.bilirubin_total': 1.8, // Slightly high
      'lft.bilirubin_direct': 0.4,
      'lft.sgot': 45, // High
      'lft.sgpt': 52, // High
      'lft.alkaline_phosphatase': 95,
      'lft.total_protein': 7.2,
      'lft.albumin': 4.0,
      'lft.globulin': 3.2,
      // Lipid Profile data (namespaced)
      'lipid_profile.total_cholesterol': 220, // Borderline high
      'lipid_profile.triglycerides': 160,
      'lipid_profile.hdl': 45,
      'lipid_profile.ldl': 140,
      'lipid_profile.vldl': 32,
    },
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { mockPatient, mockReport };
};

export function PDFPreviewThumbnail({ clinicBranding, clinicId, onOpenFullPreview }: PDFPreviewThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateThumbnail = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { mockPatient, mockReport } = createMockData(clinicId);

      const doc = await generateReportPDF({
        report: mockReport,
        patient: mockPatient,
        clinic: clinicBranding,
      });

      // Convert first page to image
      const pdfData = doc.output('datauristring');
      
      // Create a canvas to render PDF page as image
      // We'll use the PDF data URI directly for the iframe preview
      const blob = doc.output('blob');
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
  }, [clinicBranding, clinicId]);

  // Generate thumbnail on mount and when branding changes significantly
  useEffect(() => {
    const timer = setTimeout(() => {
      generateThumbnail();
    }, 500); // Debounce to avoid too many regenerations

    return () => clearTimeout(timer);
  }, [
    clinicBranding.accent_color,
    clinicBranding.border_style,
    clinicBranding.font_size,
    clinicBranding.page_size,
    clinicBranding.show_abnormal_summary,
    clinicBranding.show_patient_id,
    clinicBranding.contact_display_format,
    clinicBranding.pdf_style,
    clinicBranding.logo_watermark_enabled,
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
    <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconWrapper variant="secondary" size="default" className="transition-all duration-300 group-hover:scale-110">
              <FileText className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
            </IconWrapper>
            <div>
              <CardTitle className="text-base sm:text-lg">PDF Preview</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Live preview with sample data
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
              title="PDF Preview"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Includes CBC, Liver Function & Lipid Profile sample data
        </p>
      </CardContent>
    </Card>
  );
}
