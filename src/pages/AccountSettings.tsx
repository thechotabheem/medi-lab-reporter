import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';
import { User, KeyRound, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      // Verify current password by re-signing in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });
      if (signInErr) {
        toast.error('Current password is incorrect');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EnhancedPageLayout>
      <PageHeader
        title="Account Settings"
        subtitle="Manage your account"
        icon={<User className="h-5 w-5" />}
        showBack
        backPath="/settings"
      />
      <HeaderDivider />

      <PageTransition>
        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-lg">
          <div className="space-y-4 sm:space-y-6">
            {/* Account Info */}
            <FadeIn>
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <IconWrapper variant="secondary" size="default">
                      <Mail className="h-5 w-5" />
                    </IconWrapper>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Account Info</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Your login details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <p className="text-sm font-medium">{user?.email}</p>
                  </div>
                  <div className="space-y-2 mt-3">
                    <Label className="text-muted-foreground text-xs">Name</Label>
                    <p className="text-sm font-medium">{user?.user_metadata?.full_name || '—'}</p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Change Password */}
            <FadeIn delay={100}>
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <IconWrapper variant="default" size="default">
                      <KeyRound className="h-5 w-5" />
                    </IconWrapper>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Change Password</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Update your login password</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="••••••••"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </main>
      </PageTransition>
    </EnhancedPageLayout>
  );
}
