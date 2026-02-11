import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { FileDown, QrCode, Eye, Image, AlertTriangle, IdCard, Palette, Stamp } from 'lucide-react';

interface PDFOptionsSectionProps {
  formData: {
    page_size: string;
    show_logo_on_all_pages: boolean;
    show_abnormal_summary: boolean;
    show_patient_id: boolean;
    watermark_text: string;
    enable_qr_code: boolean;
    pdf_style: string;
    logo_watermark_enabled: boolean;
  };
  onChange: (field: string, value: string | boolean) => void;
}

export function PDFOptionsSection({ formData, onChange }: PDFOptionsSectionProps) {
  return (
    <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <IconWrapper variant="muted" size="default" className="transition-all duration-300 group-hover:scale-110">
            <FileDown className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
          </IconWrapper>
          <div>
            <CardTitle className="text-base sm:text-lg">PDF Options</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Advanced settings for PDF generation
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pdf_style" className="text-sm">Report Style</Label>
            <Select
              value={formData.pdf_style}
              onValueChange={(value) => onChange('pdf_style', value)}
            >
              <SelectTrigger id="pdf_style">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern (clean, minimal)</SelectItem>
                <SelectItem value="classic">Classic (traditional, formal)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="page_size" className="text-sm">Page Size</Label>
            <Select
              value={formData.page_size}
              onValueChange={(value) => onChange('page_size', value)}
            >
              <SelectTrigger id="page_size">
                <SelectValue placeholder="Select page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                <SelectItem value="legal">Legal (8.5 × 14 in)</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="space-y-2">
          <Label htmlFor="watermark_text" className="text-sm">Watermark Text</Label>
          <Input
            id="watermark_text"
            value={formData.watermark_text}
            onChange={(e) => onChange('watermark_text', e.target.value)}
            placeholder="e.g., CONFIDENTIAL, DRAFT"
          />
          <p className="text-xs text-muted-foreground">
            Appears as a diagonal watermark on PDF reports
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="space-y-0.5">
              <Label className="text-sm flex items-center gap-2">
                <Image className="h-4 w-4" />
                Logo on All Pages
              </Label>
              <p className="text-xs text-muted-foreground">
                Display logo on continuation pages
              </p>
            </div>
            <Switch
              checked={formData.show_logo_on_all_pages}
              onCheckedChange={(checked) => onChange('show_logo_on_all_pages', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="space-y-0.5">
              <Label className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Abnormal Values Summary
              </Label>
              <p className="text-xs text-muted-foreground">
                Show highlighted box with abnormal results
              </p>
            </div>
            <Switch
              checked={formData.show_abnormal_summary}
              onCheckedChange={(checked) => onChange('show_abnormal_summary', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="space-y-0.5">
              <Label className="text-sm flex items-center gap-2">
                <IdCard className="h-4 w-4" />
                Show Patient ID
              </Label>
              <p className="text-xs text-muted-foreground">
                Include patient ID number on reports
              </p>
            </div>
            <Switch
              checked={formData.show_patient_id}
              onCheckedChange={(checked) => onChange('show_patient_id', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="space-y-0.5">
              <Label className="text-sm flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code on Reports
              </Label>
              <p className="text-xs text-muted-foreground">
                Add a QR code linking to the online report
              </p>
            </div>
            <Switch
              checked={formData.enable_qr_code}
              onCheckedChange={(checked) => onChange('enable_qr_code', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm flex items-center gap-2">
                <Stamp className="h-4 w-4" />
                Logo Watermark
              </Label>
              <p className="text-xs text-muted-foreground">
                Show clinic logo as a faint watermark on every page
              </p>
            </div>
            <Switch
              checked={formData.logo_watermark_enabled}
              onCheckedChange={(checked) => onChange('logo_watermark_enabled', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
