import { useNavigate } from 'react-router-dom';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/ui/page-header';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import {
  Settings as SettingsIcon,
  Building2,
  Bell,
  FileText,
  AlertTriangle,
  BookOpen,
  LogOut,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { ResetDataDialog } from '@/components/settings/ResetDataDialog';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { signOut, user, isAdmin } = useAuth();
  const { settings: notificationSettings, updateSetting } = useNotificationSettings();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  return (
    <EnhancedPageLayout>
      <PageHeader
        title="Settings"
        subtitle="Configure your preferences"
        icon={<SettingsIcon className="h-5 w-5" />}
        showBack
        backPath="/dashboard"
      />
      
      <HeaderDivider />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
          <div className="space-y-4 sm:space-y-6">
            {/* Admin Panel - admin only */}
            {isAdmin && (
              <FadeIn delay={75}>
                <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <IconWrapper variant="default" size="default" className="transition-all duration-300 group-hover:scale-110">
                        <ShieldCheck className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
                      </IconWrapper>
                      <div>
                        <CardTitle className="text-base sm:text-lg">Account Management</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Manage the 5 allowed accounts
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <Button variant="outline" className="w-full" onClick={() => navigate('/admin')}>
                      Manage Accounts
                    </Button>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Clinic Settings - admin only */}
            {isAdmin && (
              <FadeIn delay={100}>
                <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <IconWrapper variant="secondary" size="default" className="transition-all duration-300 group-hover:scale-110">
                        <Building2 className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
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
                    <Button variant="outline" className="w-full" onClick={() => navigate('/settings/clinic')}>
                      Manage Clinic Settings
                    </Button>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Template Customization - admin only */}
            {isAdmin && (
              <FadeIn delay={150}>
                <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <IconWrapper variant="default" size="default" className="transition-all duration-300 group-hover:scale-110">
                        <FileText className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
                      </IconWrapper>
                      <div>
                        <CardTitle className="text-base sm:text-lg">Report Templates</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Customize test fields and normal ranges
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <Button variant="outline" className="w-full" onClick={() => navigate('/settings/templates')}>
                      Customize Templates
                    </Button>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Documentation */}
            <FadeIn delay={175}>
              <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <IconWrapper variant="secondary" size="default" className="transition-all duration-300 group-hover:scale-110">
                      <BookOpen className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
                    </IconWrapper>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Documentation</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Technical specifications and PRD
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate('/documentation')}
                  >
                    View Documentation
                  </Button>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={225}>
              <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <IconWrapper variant="muted" size="default" className="transition-all duration-300 group-hover:scale-110">
                      <Bell className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
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

            {/* Account */}
            <FadeIn delay={250}>
              <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <IconWrapper variant="secondary" size="default" className="transition-all duration-300 group-hover:scale-110">
                      <LogOut className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
                    </IconWrapper>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Account</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {user?.email}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-2">
                  <Button variant="outline" className="w-full" onClick={() => navigate('/settings/account')}>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Danger Zone - Reset Data (admin only) */}
            {isAdmin && (
              <FadeIn delay={300}>
                <Card className="group animate-pulse-glow card-gradient-overlay transition-all duration-300 hover:border-destructive/40 hover:shadow-lg border-destructive/20">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <IconWrapper variant="destructive" size="default" className="transition-all duration-300 group-hover:scale-110">
                        <AlertTriangle className="h-5 w-5 transition-all duration-300 group-hover:text-destructive" />
                      </IconWrapper>
                      <div>
                        <CardTitle className="text-base sm:text-lg text-destructive">Danger Zone</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Reset all data (patients, reports)
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <ResetDataDialog />
                  </CardContent>
                </Card>
              </FadeIn>
            )}
          </div>
        </main>
      </PageTransition>
    </EnhancedPageLayout>
  );
}
