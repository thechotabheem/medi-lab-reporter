import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { Building2 } from 'lucide-react';

interface BasicInfoSectionProps {
  formData: {
    name: string;
    phone: string;
    email: string;
    address: string;
    website: string;
  };
  onChange: (field: string, value: string) => void;
}

export function BasicInfoSection({ formData, onChange }: BasicInfoSectionProps) {
  return (
    <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <IconWrapper size="default" className="transition-all duration-300 group-hover:scale-110">
            <Building2 className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
          </IconWrapper>
          <div>
            <CardTitle className="text-base sm:text-lg">Basic Information</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Your clinic's contact details
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm">Clinic Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Your Clinic Name"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="clinic@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="text-sm">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => onChange('website', e.target.value)}
            placeholder="https://www.yourclinic.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm">Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="Full clinic address"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
