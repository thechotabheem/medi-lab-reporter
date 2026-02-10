import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, ClipboardList, Users, Settings, ShieldCheck } from 'lucide-react';

const baseNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', matchPaths: ['/', '/dashboard'] },
  { label: 'Reports', icon: ClipboardList, path: '/reports', matchPaths: ['/reports'] },
  { label: 'Patients', icon: Users, path: '/patients', matchPaths: ['/patients'] },
  { label: 'Settings', icon: Settings, path: '/settings', matchPaths: ['/settings'] },
];

const adminNavItem = { label: 'Admin', icon: ShieldCheck, path: '/admin', matchPaths: ['/admin'] };

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;

  const isActive = (item: typeof navItems[0]) =>
    item.matchPaths.some((p) => location.pathname === p || (p !== '/' && location.pathname.startsWith(p)));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t border-border/60 bg-card/95 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-200',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className={cn('h-5 w-5 transition-transform duration-200', active && 'scale-110')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
