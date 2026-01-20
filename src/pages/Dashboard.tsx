import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { ActionCard } from '@/components/ui/action-card';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  FlaskConical, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Plus,
  Activity,
  ClipboardList
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, userRole, signOut } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const handleSignOut = async () => {
    await signOut();
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="page-container">
      {/* Header */}
      <header className="app-header">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <IconWrapper size="default" glow className="hidden sm:flex">
                <FlaskConical className="h-5 w-5" />
              </IconWrapper>
              <IconWrapper size="sm" className="flex sm:hidden">
                <FlaskConical className="h-4 w-4" />
              </IconWrapper>
              <div>
                <h1 className="font-semibold text-sm sm:text-base">MedLab Reporter</h1>
                <p className="text-2xs sm:text-xs text-muted-foreground capitalize">
                  {userRole?.role?.replace('_', ' ') || 'User'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">
                {profile?.full_name}
              </span>
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="text-xs sm:text-sm"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, <span className="text-gradient-primary">{firstName}!</span>
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Here's an overview of your lab activity
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="animate-fade-in-up animation-delay-100">
            <StatCard
              title="Total Reports"
              value={statsLoading ? '-' : stats?.totalReports || 0}
              subtitle="All time"
              icon={FileText}
              onClick={() => navigate('/reports')}
              loading={statsLoading}
            />
          </div>
          <div className="animate-fade-in-up animation-delay-200">
            <StatCard
              title="Patients"
              value={statsLoading ? '-' : stats?.totalPatients || 0}
              subtitle="Registered"
              icon={Users}
              onClick={() => navigate('/patients')}
              loading={statsLoading}
            />
          </div>
          <div className="animate-fade-in-up animation-delay-300">
            <StatCard
              title="This Month"
              value={statsLoading ? '-' : stats?.monthlyReports || 0}
              subtitle="Reports created"
              icon={Activity}
              loading={statsLoading}
            />
          </div>
          <div className="animate-fade-in-up animation-delay-400">
            <StatCard
              title="Pending"
              value={statsLoading ? '-' : stats?.draftReports || 0}
              subtitle="Draft reports"
              icon={FileText}
              loading={statsLoading}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="animate-fade-in-up animation-delay-200">
            <ActionCard
              title="New Report"
              description="Create a new lab report for a patient"
              icon={Plus}
              iconVariant="default"
              onClick={() => navigate('/reports/new')}
            />
          </div>
          <div className="animate-fade-in-up animation-delay-300">
            <ActionCard
              title="View Reports"
              description="Browse and manage all lab reports"
              icon={ClipboardList}
              iconVariant="default"
              onClick={() => navigate('/reports')}
            />
          </div>
          <div className="animate-fade-in-up animation-delay-400">
            <ActionCard
              title="Patients"
              description="Manage patient records and history"
              icon={Users}
              iconVariant="secondary"
              onClick={() => navigate('/patients')}
            />
          </div>
          <div className="animate-fade-in-up animation-delay-500">
            <ActionCard
              title="Settings"
              description="Configure clinic branding and preferences"
              icon={Settings}
              iconVariant="muted"
              onClick={() => navigate('/settings')}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
