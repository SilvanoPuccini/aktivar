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
    return 'home';
  };

  const handleTabChange = (tab: string) => {
    const routes: Record<string, string> = {
      home: '/',
      explore: '/',
      create: '/create',
      trips: '/',
      profile: '/profile',
    };
    navigate(routes[tab] || '/');
  };

  return (
    <div className="min-h-screen bg-surface">
      <main className="pb-20">
        <Outlet />
      </main>
      <GlassNav
        activeTab={getActiveTab()}
        onTabChange={handleTabChange}
        notificationCount={3}
      />
    </div>
  );
}
