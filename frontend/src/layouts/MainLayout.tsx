import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import GlassNav from '@/components/GlassNav';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/stores/authStore';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/explore') return 'explore';
    if (path === '/create') return 'create';
    if (path === '/profile') return 'profile';
    if (path === '/notifications') return 'notifications';
    if (path === '/dashboard') return 'dashboard';
    return 'home';
  };

  const handleTabChange = (tab: string) => {
    const routes: Record<string, string> = {
      home: '/',
      explore: '/explore',
      create: '/create',
      profile: isAuthenticated ? '/profile' : '/login',
      notifications: '/notifications',
      dashboard: '/dashboard',
    };
    navigate(routes[tab] || '/');
  };

  const immersiveRoutes = ['/activity/', '/chat/', '/payment/'];
  const isImmersive = immersiveRoutes.some((prefix) => location.pathname.startsWith(prefix));
  const isFullBleed = location.pathname === '/explore';

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      {!isImmersive && (
        <GlassNav
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
          isAuthenticated={isAuthenticated}
          notificationCount={3}
        />
      )}

      {!isImmersive && <div className="hidden h-20 shrink-0 md:block" />}

      <main className="relative flex-1">
        {isImmersive || isFullBleed ? (
          <Outlet />
        ) : (
          <section className="premium-shell py-8 md:py-10 lg:py-12">
            <Outlet />
          </section>
        )}
      </main>

      {!isImmersive && <div className="h-24 shrink-0 md:hidden" />}
      {!isImmersive && !isFullBleed && <Footer />}
    </div>
  );
}
