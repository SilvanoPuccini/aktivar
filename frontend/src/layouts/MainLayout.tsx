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
      notifications: '/notifications',
    };
    navigate(routes[tab] || '/');
  };

  // Hide bottom nav on focused pages
  const hideNav =
    location.pathname.startsWith('/activity/') ||
    location.pathname.startsWith('/chat/') ||
    location.pathname.startsWith('/payment/');

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop: offset content for top header */}
      <div className="md:pt-16">
        <Outlet />
      </div>
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
