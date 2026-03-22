import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import GlassNav from '@/components/GlassNav';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/activity')) return 'home';
    if (path === '/explore') return 'explore';
    if (path === '/create') return 'create';
    if (path.startsWith('/trip')) return 'trips';
    if (path === '/profile') return 'profile';
    if (path.startsWith('/chat')) return 'home';
    if (path === '/notifications') return 'home';
    return 'home';
  };

  const handleTabChange = (tab: string) => {
    const routes: Record<string, string> = {
      home: '/',
      explore: '/explore',
      create: '/create',
      trips: '/',
      profile: '/profile',
    };
    navigate(routes[tab] || '/');
  };

  // Hide bottom nav on activity detail page (per Stitch UX: focused task)
  const hideNav = location.pathname.startsWith('/activity/');

  return (
    <div className="min-h-screen bg-surface">
      <Outlet />
      {!hideNav && (
        <GlassNav
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
          notificationCount={3}
        />
      )}
    </div>
  );
}
