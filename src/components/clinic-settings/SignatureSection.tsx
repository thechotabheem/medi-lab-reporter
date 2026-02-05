import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { PenLine } from 'lucide-react';

interface SignatureSectionProps {
  formData: {
    signature_title_left: string;
    signature_title_right: string;
  };
  onChange: (field: string, value: string) => void;
}

export function SignatureSection({ formData, onChange }: SignatureSectionProps) {
  return (
    <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <IconWrapper variant="muted" size="default" className="transition-all duration-300 group-hover:scale-110">
            <PenLine className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
          </IconWrapper>
          <div>
            <CardTitle className="text-base sm:text-lg">Signature Configuration</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Customize signature titles on reports
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="signature_title_left" className="text-sm">Left Signature Title</Label>
            <Input
              id="signature_title_left"
              value={formData.signature_title_left}
              onChange={(e) => onChange('signature_title_left', e.target.value)}
              placeholder="Lab Technician"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signature_title_right" className="text-sm">Right Signature Title</Label>
            <Input
              id="signature_title_right"
              value={formData.signature_title_right}
              onChange={(e) => onChange('signature_title_right', e.target.value)}
              placeholder="Pathologist"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          These titles appear above the signature lines on PDF reports
        </p>
      </CardContent>
    </Card>
  );
}
