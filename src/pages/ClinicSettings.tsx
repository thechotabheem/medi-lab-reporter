import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { SkeletonForm } from '@/components/ui/skeleton';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2 } from 'lucide-react';
import { BasicInfoSection } from '@/components/clinic-settings';

interface ClinicData {
  name: string;
  doctor_name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
}

const defaultFormData: ClinicData = {
  name: '',
  doctor_name: '',
  phone: '',
  email: '',
  address: '',
  website: '',
};

export default function ClinicSettings() {
  const navigate = useNavigate();
  const { clinic, clinicId, isLoading: clinicLoading, refreshClinic } = useClinic();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ClinicData>(defaultFormData);
  const [formInitialized, setFormInitialized] = useState(false);

  // Populate form from the already-resolved clinic context
  useEffect(() => {
    if (!clinicLoading && clinic) {
      setFormData({
        doctor_name: (clinic as any).doctor_name || '',
        name: clinic.name || '',
        phone: clinic.phone || '',
        email: clinic.email || '',
        address: clinic.address || '',
        website: (clinic as any).website || '',
      });
      setFormInitialized(true);
    }
  }, [clinic, clinicLoading]);

  const handleChange = (field: keyof ClinicData, value: string | boolean) => {
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
          doctor_name: formData.doctor_name || null,
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          website: formData.website || null,
        } as any)
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
    <EnhancedPageLayout>
      <PageHeader
        title="Clinic Settings"
        subtitle="Configure branding and details"
        icon={<Building2 className="h-5 w-5" />}
        showBack
        backPath="/settings"
      />
      
      <HeaderDivider />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
          {(clinicLoading || !formInitialized) ? (
            <Card className="animate-pulse-glow">
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
              <FadeIn delay={100}>
                <BasicInfoSection
                  formData={formData}
                  onChange={handleChange}
                />
              </FadeIn>

              <FadeIn delay={150}>
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
    </EnhancedPageLayout>
  );
}
