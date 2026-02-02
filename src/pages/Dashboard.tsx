import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useWeather } from '@/hooks/useWeather';
import { StatCard } from '@/components/ui/stat-card';
import { ActionCard } from '@/components/ui/action-card';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { SparkleText } from '@/components/ui/sparkle-text';
import { EnhancedPageLayout, HeaderDivider } from '@/components/ui/enhanced-page-layout';

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
    <EnhancedPageLayout>
      {/* Header */}
      <header className="app-header">
        <div className="px-4 py-4 sm:py-5">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <IconWrapper size="default" glow hoverPulse className="animate-breathe">
                <FlaskConical className="h-6 w-6" />
              </IconWrapper>
              <h1 className="font-bold text-xl sm:text-2xl tracking-tight text-foreground animate-breathe animation-delay-2000 cursor-default">
                MedLab Reporter
              </h1>
            </div>
          </div>
        </div>
      </header>
      
      <HeaderDivider />

      {/* Main Content - Fills remaining height */}
      <main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        {/* Welcome Section - Compact */}
        <div className="mb-3 sm:mb-4 animate-fade-in text-center">
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

        {/* Quick Stats - Equal height cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="animate-fade-in-up animation-delay-100 h-full">
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
          <div className="animate-fade-in-up animation-delay-200 h-full">
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
          <div className="animate-fade-in-up animation-delay-300 h-full">
            <StatCard
              title="This Month"
              value={statsLoading ? '-' : stats?.monthlyReports || 0}
              subtitle="Reports created"
              icon={Activity}
              onClick={() => navigate('/reports')}
              loading={statsLoading}
              glowEffect
            />
          </div>
          <div className="animate-fade-in-up animation-delay-400 h-full">
            <StatCard
              title="Pending"
              value={statsLoading ? '-' : stats?.draftReports || 0}
              subtitle="Draft reports"
              icon={FileText}
              onClick={() => navigate('/reports?status=draft')}
              loading={statsLoading}
              glowEffect
            />
          </div>
        </div>

        {/* Quick Actions - Equal height cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-2 sm:gap-4">
          <div className="animate-fade-in-up animation-delay-200 h-full">
            <ActionCard
              title="New Report"
              description="Create a new lab report for a patient"
              icon={Plus}
              iconVariant="interactive"
              onClick={() => navigate('/reports/new')}
              glowEffect
            />
          </div>
          <div className="animate-fade-in-up animation-delay-300 h-full">
            <ActionCard
              title="View Reports"
              description="Browse and manage all lab reports"
              icon={ClipboardList}
              iconVariant="interactive"
              onClick={() => navigate('/reports')}
              glowEffect
            />
          </div>
          <div className="animate-fade-in-up animation-delay-400 h-full">
            <ActionCard
              title="Patients"
              description="Manage patient records and history"
              icon={Users}
              iconVariant="interactive"
              onClick={() => navigate('/patients')}
              glowEffect
            />
          </div>
          <div className="animate-fade-in-up animation-delay-500 h-full">
            <ActionCard
              title="Settings"
              description="Configure clinic branding and preferences"
              icon={Settings}
              iconVariant="interactive"
              onClick={() => navigate('/settings')}
              glowEffect
            />
          </div>
        </div>

      </main>

    </EnhancedPageLayout>
  );
}
