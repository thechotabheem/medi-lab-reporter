import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/ui/page-header';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { useToast } from '@/hooks/use-toast';
import {
  Settings as SettingsIcon,
  Building2,
  User,
  Bell,
  Palette,
  Save,
  Loader2,
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { profile, userRole, refreshProfile } = useAuth();
  const { settings: notificationSettings, updateSetting } = useNotificationSettings();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Settings"
        subtitle="Configure your preferences"
        icon={<SettingsIcon className="h-5 w-5" />}
        showBack
        backPath="/dashboard"
      />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
          <div className="space-y-4 sm:space-y-6">
            {/* Profile Settings */}
            <FadeIn delay={100}>
              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <IconWrapper size="default">
                      <User className="h-5 w-5" />
                    </IconWrapper>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Profile</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Manage your personal information
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-sm">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => handleProfileChange('full_name', e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        placeholder="Enter your phone"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-2 border-t border-border pt-4">
                    <div className="flex flex-wrap gap-4 sm:gap-6">
                      <div>
                        <span className="text-xs text-muted-foreground">Email</span>
                        <p className="text-sm font-medium truncate">{profile?.email}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Role</span>
                        <p className="text-sm font-medium capitalize">
                          {userRole?.role?.replace('_', ' ') || 'User'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={isSaving} 
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Clinic Settings - Only show for admins */}
            {userRole?.role === 'admin' && (
              <FadeIn delay={200}>
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <IconWrapper variant="secondary" size="default">
                        <Building2 className="h-5 w-5" />
                      </IconWrapper>
                      <div>
                        <CardTitle className="text-base sm:text-lg">Clinic Settings</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Configure clinic branding and details
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => navigate('/settings/clinic')}
                    >
                      Manage Clinic Settings
                    </Button>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Notification Settings */}
            <FadeIn delay={300}>
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <IconWrapper variant="muted" size="default">
                      <Bell className="h-5 w-5" />
                    </IconWrapper>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Notifications</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Manage your notification preferences
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-1">
                  <div className="flex items-center justify-between py-3">
                    <div className="space-y-0.5 pr-4">
                      <Label htmlFor="email-notifications" className="text-sm font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive important updates via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <div className="space-y-0.5 pr-4">
                      <Label htmlFor="report-updates" className="text-sm font-medium">
                        Report Updates
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when reports are completed
                      </p>
                    </div>
                    <Switch
                      id="report-updates"
                      checked={notificationSettings.reportUpdates}
                      onCheckedChange={(checked) => updateSetting('reportUpdates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <div className="space-y-0.5 pr-4">
                      <Label htmlFor="new-patients" className="text-sm font-medium">
                        New Patients
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when new patients are added
                      </p>
                    </div>
                    <Switch
                      id="new-patients"
                      checked={notificationSettings.newPatients}
                      onCheckedChange={(checked) => updateSetting('newPatients', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Appearance Settings */}
            <FadeIn delay={400}>
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <IconWrapper variant="muted" size="default">
                      <Palette className="h-5 w-5" />
                    </IconWrapper>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Appearance</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Customize the look and feel
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    <Label className="text-sm">Theme</Label>
                    <ThemeToggle variant="inline" />
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
