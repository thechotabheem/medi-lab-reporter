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
import {
  BasicInfoSection,
  ReportBrandingSection,
  SignatureSection,
  VisualStylingSection,
  PDFOptionsSection,
} from '@/components/clinic-settings';

interface ClinicData {
  name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  header_text: string;
  footer_text: string;
  logo_url: string;
  tagline: string;
  watermark_text: string;
  enable_qr_code: boolean;
  accent_color: string;
  secondary_color: string;
  font_size: string;
  show_logo_on_all_pages: boolean;
  signature_title_left: string;
  signature_title_right: string;
  page_size: string;
  show_abnormal_summary: boolean;
  show_patient_id: boolean;
  border_style: string;
  contact_display_format: string;
}

const defaultFormData: ClinicData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  website: '',
  header_text: '',
  footer_text: '',
  logo_url: '',
  tagline: '',
  watermark_text: '',
  enable_qr_code: false,
  accent_color: '#00968F',
  secondary_color: '',
  font_size: 'medium',
  show_logo_on_all_pages: true,
  signature_title_left: 'Lab Technician',
  signature_title_right: 'Pathologist',
  page_size: 'a4',
  show_abnormal_summary: true,
  show_patient_id: true,
  border_style: 'simple',
  contact_display_format: 'inline',
};

export default function ClinicSettings() {
  const navigate = useNavigate();
  const { clinicId, refreshClinic } = useClinic();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ClinicData>(defaultFormData);

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
            website: (data as any).website || '',
            header_text: data.header_text || '',
            footer_text: data.footer_text || '',
            logo_url: data.logo_url || '',
            tagline: (data as any).tagline || '',
            watermark_text: data.watermark_text || '',
            enable_qr_code: data.enable_qr_code || false,
            accent_color: data.accent_color || '#00968F',
            secondary_color: (data as any).secondary_color || '',
            font_size: (data as any).font_size || 'medium',
            show_logo_on_all_pages: (data as any).show_logo_on_all_pages ?? true,
            signature_title_left: (data as any).signature_title_left || 'Lab Technician',
            signature_title_right: (data as any).signature_title_right || 'Pathologist',
            page_size: (data as any).page_size || 'a4',
            show_abnormal_summary: (data as any).show_abnormal_summary ?? true,
            show_patient_id: (data as any).show_patient_id ?? true,
            border_style: (data as any).border_style || 'simple',
            contact_display_format: (data as any).contact_display_format || 'inline',
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
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          website: formData.website || null,
          header_text: formData.header_text || null,
          footer_text: formData.footer_text || null,
          logo_url: formData.logo_url || null,
          tagline: formData.tagline || null,
          watermark_text: formData.watermark_text || null,
          enable_qr_code: formData.enable_qr_code,
          accent_color: formData.accent_color || null,
          secondary_color: formData.secondary_color || null,
          font_size: formData.font_size || 'medium',
          show_logo_on_all_pages: formData.show_logo_on_all_pages,
          signature_title_left: formData.signature_title_left || 'Lab Technician',
          signature_title_right: formData.signature_title_right || 'Pathologist',
          page_size: formData.page_size || 'a4',
          show_abnormal_summary: formData.show_abnormal_summary,
          show_patient_id: formData.show_patient_id,
          border_style: formData.border_style || 'simple',
          contact_display_format: formData.contact_display_format || 'inline',
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
          {isLoading ? (
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
                <ReportBrandingSection
                  formData={formData}
                  onChange={handleChange}
                  clinicId={clinicId}
                />
              </FadeIn>

              <FadeIn delay={200}>
                <SignatureSection
                  formData={formData}
                  onChange={handleChange}
                />
              </FadeIn>

              <FadeIn delay={250}>
                <VisualStylingSection
                  formData={formData}
                  onChange={handleChange}
                />
              </FadeIn>

              <FadeIn delay={300}>
                <PDFOptionsSection
                  formData={formData}
                  onChange={handleChange}
                />
              </FadeIn>

              <FadeIn delay={350}>
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
