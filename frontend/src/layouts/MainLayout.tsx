import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import GlassNav from '@/components/GlassNav';
import Footer from '@/components/Footer';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

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
      profile: '/profile',
      notifications: '/notifications',
      dashboard: '/dashboard',
    };
    navigate(routes[tab] || '/');
  };

  // Pages that handle their own full-screen layout (no nav, no footer)
  const isImmersive =
    location.pathname.startsWith('/activity/') ||
    location.pathname.startsWith('/chat/') ||
    location.pathname.startsWith('/payment/');

  // Full-bleed pages (explore map) — nav yes, footer no
  const isFullBleed = location.pathname === '/explore';

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Desktop top nav — always visible except immersive pages */}
      {!isImmersive && (
        <GlassNav
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
          notificationCount={3}
        />
      )}

      {/* Spacer for fixed desktop nav (64px = h-16) */}
      {!isImmersive && <div className="hidden md:block h-16 shrink-0" />}

      {/* Page content */}
      <main className="flex-1 px-0 md:px-2 lg:px-0">
        {isFullBleed || isImmersive ? (
          <Outlet />
        ) : (
          <section className="premium-shell py-5 md:py-7 lg:py-9">
            <Outlet />
          </section>
        )}
      </main>

      {/* Mobile bottom spacer for bottom nav */}
      {!isImmersive && <div className="md:hidden h-20 shrink-0" />}

      {/* Footer — only on content pages, never on fullbleed or immersive */}
      {!isImmersive && !isFullBleed && <Footer />}
    </div>
  );
}
