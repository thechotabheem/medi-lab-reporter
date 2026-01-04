import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FlaskConical, ArrowLeft, Loader2, Building2 } from 'lucide-react';

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
  const { profile, userRole } = useAuth();
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
      if (!profile?.clinic_id) return;

      try {
        const { data, error } = await supabase
          .from('clinics')
          .select('*')
          .eq('id', profile.clinic_id)
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
        toast({
          title: 'Error',
          description: 'Failed to load clinic data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicData();
  }, [profile?.clinic_id]);

  const handleChange = (field: keyof ClinicData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.clinic_id) {
      toast({
        title: 'Error',
        description: 'Clinic information not found.',
        variant: 'destructive',
      });
      return;
    }

    if (userRole?.role !== 'admin') {
      toast({
        title: 'Permission denied',
        description: 'Only admins can update clinic settings.',
        variant: 'destructive',
      });
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
        .eq('id', profile.clinic_id);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Clinic settings have been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Redirect non-admins
  if (userRole?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only admins can access clinic settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/settings')}>Back to Settings</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold">Clinic Settings</h1>
            <p className="text-xs text-muted-foreground">Configure branding and details</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Your clinic's contact details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Clinic Name *</Label>
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
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="address">Address</Label>
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

            {/* Report Branding */}
            <Card>
              <CardHeader>
                <CardTitle>Report Branding</CardTitle>
                <CardDescription>Customize how your reports look</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
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
                  <Label htmlFor="header_text">Report Header Text</Label>
                  <Textarea
                    id="header_text"
                    value={formData.header_text}
                    onChange={(e) => handleChange('header_text', e.target.value)}
                    placeholder="Text to appear at the top of reports"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text">Report Footer Text</Label>
                  <Textarea
                    id="footer_text"
                    value={formData.footer_text}
                    onChange={(e) => handleChange('footer_text', e.target.value)}
                    placeholder="Text to appear at the bottom of reports"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/settings')}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
