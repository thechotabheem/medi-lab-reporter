import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useWeather } from '@/hooks/useWeather';
import { StatCard } from '@/components/ui/stat-card';
import { ActionCard } from '@/components/ui/action-card';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { RecentReportsWidget } from '@/components/dashboard/RecentReportsWidget';
import { SparkleText } from '@/components/ui/sparkle-text';
import { CursorGlow } from '@/components/ui/cursor-glow';

import { 
  FlaskConical, 
  Users, 
  FileText, 
  Settings, 
  Plus,
  Activity,
  ClipboardList
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { clinic, isLoading: clinicLoading } = useClinic();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { weather } = useWeather();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const clinicName = clinicLoading ? '' : (clinic?.name || 'Medical Lab');

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="page-container">
      <CursorGlow />
      {/* Header */}
      <header className="app-header">
        <div className="container mx-auto px-4 py-4 sm:py-5">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <IconWrapper size="default" glow hoverPulse>
                <FlaskConical className="h-6 w-6" />
              </IconWrapper>
              <h1 className="font-bold text-xl sm:text-2xl tracking-tight text-gradient-primary">
                MedLab Reporter
              </h1>
            </div>
          </div>
        </div>
      </header>
      
      {/* Decorative Divider with Glow */}
      <div className="relative">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute inset-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm" />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8 animate-fade-in text-center">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {getGreeting()}! <span className="text-gradient-primary">You're Welcomed</span>
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Here's an overview of your lab activity at <SparkleText sparkleCount={3}><span className="text-gradient-shimmer font-semibold">{clinicName}</span></SparkleText>
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2 flex items-center justify-center gap-2 flex-wrap">
            <span>
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <span>•</span>
            <span>
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit'
              })}
            </span>
            {weather && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  {weather.icon} {weather.temperature}°C {weather.description}
                </span>
              </>
            )}
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
              glowEffect
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
              glowEffect
            />
          </div>
          <div className="animate-fade-in-up animation-delay-300">
          <StatCard
              title="This Month"
              value={statsLoading ? '-' : stats?.monthlyReports || 0}
              subtitle="Reports created"
              icon={Activity}
              loading={statsLoading}
              glowEffect
            />
          </div>
          <div className="animate-fade-in-up animation-delay-400">
          <StatCard
              title="Pending"
              value={statsLoading ? '-' : stats?.draftReports || 0}
              subtitle="Draft reports"
              icon={FileText}
              loading={statsLoading}
              glowEffect
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="animate-fade-in-up animation-delay-200">
          <ActionCard
              title="New Report"
              description="Create a new lab report for a patient"
              icon={Plus}
              iconVariant="default"
              onClick={() => navigate('/reports/new')}
              glowEffect
            />
          </div>
          <div className="animate-fade-in-up animation-delay-300">
          <ActionCard
              title="View Reports"
              description="Browse and manage all lab reports"
              icon={ClipboardList}
              iconVariant="default"
              onClick={() => navigate('/reports')}
              glowEffect
            />
          </div>
          <div className="animate-fade-in-up animation-delay-400">
          <ActionCard
              title="Patients"
              description="Manage patient records and history"
              icon={Users}
              iconVariant="secondary"
              onClick={() => navigate('/patients')}
              glowEffect
            />
          </div>
          <div className="animate-fade-in-up animation-delay-500">
          <ActionCard
              title="Settings"
              description="Configure clinic branding and preferences"
              icon={Settings}
              iconVariant="muted"
              onClick={() => navigate('/settings')}
              glowEffect
            />
          </div>
        </div>

        {/* Recent Reports Widget */}
        <div className="animate-fade-in-up animation-delay-600">
          <RecentReportsWidget />
        </div>
      </main>

      {/* Mobile FAB */}
      <div className="sm:hidden">
        <FloatingActionButton
          onClick={() => navigate('/reports/new')}
          icon={<Plus className="h-6 w-6" />}
        />
      </div>
    </div>
  );
}
