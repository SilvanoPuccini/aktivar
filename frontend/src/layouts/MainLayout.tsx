import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import GlassNav from '@/components/GlassNav';
import Footer from '@/components/Footer';

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
    if (path === '/dashboard') return 'home';
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

  // Hide nav on focused pages
  const hideNav =
    location.pathname.startsWith('/activity/') ||
    location.pathname.startsWith('/chat/') ||
    location.pathname.startsWith('/payment/');

  // Full-screen pages that manage their own height
  const isFullScreenPage = location.pathname === '/explore';

  // Pages that show footer (not fullscreen, not feed home which has its own layout)
  const showFooter = !hideNav && !isFullScreenPage && location.pathname !== '/';

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {!hideNav && (
        <GlassNav
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
          notificationCount={3}
        />
      )}

      {/* Content area - offset for fixed header on desktop */}
      <div className={`flex-grow ${!hideNav ? 'md:pt-16' : ''}`}>
        <Outlet />
      </div>

      {showFooter && <Footer />}
    </div>
  );
}
