import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { Palette } from 'lucide-react';

interface VisualStylingSectionProps {
  formData: {
    accent_color: string;
    secondary_color: string;
    border_style: string;
    font_size: string;
  };
  onChange: (field: string, value: string) => void;
}

export function VisualStylingSection({ formData, onChange }: VisualStylingSectionProps) {
  return (
    <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <IconWrapper variant="secondary" size="default" className="transition-all duration-300 group-hover:scale-110">
            <Palette className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
          </IconWrapper>
          <div>
            <CardTitle className="text-base sm:text-lg">Visual Styling</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Colors and formatting for reports
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="accent_color" className="text-sm">Accent Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="accent_color"
                type="color"
                value={formData.accent_color}
                onChange={(e) => onChange('accent_color', e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formData.accent_color}
                onChange={(e) => onChange('accent_color', e.target.value)}
                placeholder="#00968F"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Primary color for headers and accents
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color" className="text-sm">Secondary Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="secondary_color"
                type="color"
                value={formData.secondary_color || '#64748b'}
                onChange={(e) => onChange('secondary_color', e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formData.secondary_color}
                onChange={(e) => onChange('secondary_color', e.target.value)}
                placeholder="#64748b"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used for borders and dividers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="border_style" className="text-sm">Border Style</Label>
            <Select
              value={formData.border_style}
              onValueChange={(value) => onChange('border_style', value)}
            >
              <SelectTrigger id="border_style">
                <SelectValue placeholder="Select border style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="double">Double</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font_size" className="text-sm">Font Size</Label>
            <Select
              value={formData.font_size}
              onValueChange={(value) => onChange('font_size', value)}
            >
              <SelectTrigger id="font_size">
                <SelectValue placeholder="Select font size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
