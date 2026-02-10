import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { EnhancedPageLayout } from '@/components/ui/enhanced-page-layout';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, ClipboardList, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <EnhancedPageLayout className="flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4 animate-fade-in">
        {/* Animated 404 illustration */}
        <div className="relative mb-8">
          <div className="text-[120px] sm:text-[160px] font-bold text-primary/10 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <span className="text-3xl sm:text-4xl">🔬</span>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">
          The page <code className="text-primary/80 bg-primary/10 px-2 py-0.5 rounded text-xs">{location.pathname}</code> doesn't exist in Lab Reporter.
        </p>

        {/* Suggested links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate('/reports')}
          >
            <ClipboardList className="h-4 w-4" />
            Reports
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate('/patients')}
          >
            <Users className="h-4 w-4" />
            Patients
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    </EnhancedPageLayout>
  );
};

export default NotFound;
