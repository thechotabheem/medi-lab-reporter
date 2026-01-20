import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ClinicRegistrationForm } from '@/components/auth/ClinicRegistrationForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { FlaskConical } from 'lucide-react';

type AuthStep = 'auth' | 'clinic';

export default function Auth() {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<AuthStep>('auth');
  const [userData, setUserData] = useState<{ fullName: string; phone?: string } | null>(null);

  // Check for step param in URL
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'clinic') {
      setStep('clinic');
    }
  }, [searchParams]);

  // Redirect if already authenticated with profile
  useEffect(() => {
    if (!isLoading && user && profile) {
      const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, profile, isLoading, navigate, location]);

  // If user exists but no profile, go to clinic step
  useEffect(() => {
    if (!isLoading && user && !profile) {
      setStep('clinic');
    }
  }, [user, profile, isLoading]);

  const handleSignupSuccess = (data: { fullName: string; phone?: string }) => {
    setUserData(data);
    setStep('clinic');
  };

  const handleClinicSuccess = () => {
    navigate('/dashboard', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-radial p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center mb-6 sm:mb-8">
          <IconWrapper 
            size="xl" 
            variant="default" 
            glow 
            className="mb-4 mx-auto animate-float"
          >
            <FlaskConical className="h-8 w-8" />
          </IconWrapper>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            MedLab Reporter
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Professional Medical Lab Reports
          </p>
        </div>

        <Card className="glass-strong shadow-xl border-border/40">
          {step === 'auth' ? (
            <>
              <CardHeader className="text-center pb-2 px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">Welcome</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Sign in to your account or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-4 sm:px-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login" className="text-sm">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login" className="animate-fade-in">
                    <LoginForm onSwitchToSignup={() => setActiveTab('signup')} />
                  </TabsContent>
                  <TabsContent value="signup" className="animate-fade-in">
                    <SignupForm 
                      onSwitchToLogin={() => setActiveTab('login')}
                      onSignupSuccess={handleSignupSuccess}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="pt-6 px-4 sm:px-6">
              <ClinicRegistrationForm 
                userData={userData || { fullName: user?.user_metadata?.full_name || 'User' }}
                onSuccess={handleClinicSuccess}
              />
            </CardContent>
          )}
        </Card>

        <p className="text-center text-2xs sm:text-xs text-muted-foreground mt-6 px-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
