import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { SkeletonForm } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, FileText } from 'lucide-react';

interface ClinicData {
  name: string;
  phone: string;
  email: string;
  address: string;
  header_text: string;
  footer_text: string;
  logo_url: string;
}

export default function ClinicSettings() {
  const navigate = useNavigate();
  const { clinicId, refreshClinic } = useClinic();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<ClinicData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    header_text: '',
    footer_text: '',
    logo_url: '',
  });

  useEffect(() => {
    const fetchClinicData = async () => {
      if (!clinicId) return;

      try {
        const { data, error } = await supabase
          .from('clinics')
          .select('*')
          .eq('id', clinicId)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            header_text: data.header_text || '',
            footer_text: data.footer_text || '',
            logo_url: data.logo_url || '',
          });
        }
      } catch (error: any) {
        toast({ title: 'Error', description: 'Failed to load clinic data.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicData();
  }, [clinicId, toast]);

  const handleChange = (field: keyof ClinicData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinicId) {
      toast({ title: 'Error', description: 'Clinic information not found.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          header_text: formData.header_text || null,
          footer_text: formData.footer_text || null,
          logo_url: formData.logo_url || null,
        })
        .eq('id', clinicId);

      if (error) throw error;

      await refreshClinic();
      toast({ title: 'Settings saved', description: 'Clinic settings updated successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Clinic Settings"
        subtitle="Configure branding and details"
        icon={<Building2 className="h-5 w-5" />}
        showBack
        backPath="/settings"
      />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
          {isLoading ? (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="h-6 w-40 skeleton rounded" />
                <div className="h-4 w-56 skeleton rounded mt-2" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <SkeletonForm />
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Basic Info */}
              <FadeIn delay={100}>
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <IconWrapper size="default">
                        <Building2 className="h-5 w-5" />
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
                        onChange={(e) => handleChange('name', e.target.value)}
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
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="clinic@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="Full clinic address"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Report Branding */}
              <FadeIn delay={200}>
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <IconWrapper variant="secondary" size="default">
                        <FileText className="h-5 w-5" />
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
                      <Label htmlFor="logo_url" className="text-sm">Logo URL</Label>
                      <Input
                        id="logo_url"
                        type="url"
                        value={formData.logo_url}
                        onChange={(e) => handleChange('logo_url', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter a URL to your clinic logo image
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="header_text" className="text-sm">Report Header Text</Label>
                      <Textarea
                        id="header_text"
                        value={formData.header_text}
                        onChange={(e) => handleChange('header_text', e.target.value)}
                        placeholder="Text at the top of reports"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="footer_text" className="text-sm">Report Footer Text</Label>
                      <Textarea
                        id="footer_text"
                        value={formData.footer_text}
                        onChange={(e) => handleChange('footer_text', e.target.value)}
                        placeholder="Text at the bottom of reports"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Actions */}
              <FadeIn delay={300}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 order-2 sm:order-1"
                    onClick={() => navigate('/settings')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 order-1 sm:order-2" disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </FadeIn>
            </form>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
