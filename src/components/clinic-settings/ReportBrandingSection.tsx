import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { LogoUploader } from '@/components/clinic/LogoUploader';
import { FileText } from 'lucide-react';

interface ReportBrandingSectionProps {
  formData: {
    logo_url: string;
    tagline: string;
    header_text: string;
    footer_text: string;
  };
  onChange: (field: string, value: string) => void;
  clinicId: string;
}

export function ReportBrandingSection({ formData, onChange, clinicId }: ReportBrandingSectionProps) {
  return (
    <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <IconWrapper variant="secondary" size="default" className="transition-all duration-300 group-hover:scale-110">
            <FileText className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
          </IconWrapper>
          <div>
            <CardTitle className="text-base sm:text-lg">Report Branding</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Customize how your reports look
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">Clinic Logo</Label>
          <LogoUploader
            currentLogoUrl={formData.logo_url}
            onLogoChange={(url) => onChange('logo_url', url)}
            clinicId={clinicId}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline" className="text-sm">Tagline</Label>
          <Input
            id="tagline"
            value={formData.tagline}
            onChange={(e) => onChange('tagline', e.target.value)}
            placeholder="Your clinic's slogan or tagline"
          />
          <p className="text-xs text-muted-foreground">
            Displayed below the clinic name on reports
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="header_text" className="text-sm">Report Header Text</Label>
          <Textarea
            id="header_text"
            value={formData.header_text}
            onChange={(e) => onChange('header_text', e.target.value)}
            placeholder="Text at the top of reports"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="footer_text" className="text-sm">Report Footer Text</Label>
          <Textarea
            id="footer_text"
            value={formData.footer_text}
            onChange={(e) => onChange('footer_text', e.target.value)}
            placeholder="Text at the bottom of reports"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
