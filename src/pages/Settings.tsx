import { useNavigate } from 'react-router-dom';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/ui/page-header';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import {
  Settings as SettingsIcon,
  Building2,
  Bell,
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { settings: notificationSettings, updateSetting } = useNotificationSettings();

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
            {/* Clinic Settings */}
            <FadeIn delay={100}>
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

            {/* Notification Settings */}
            <FadeIn delay={200}>
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
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
