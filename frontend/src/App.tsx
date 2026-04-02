import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { buildReturnPath, savePostAuthPath } from '@/lib/authRedirect';
import { useCurrentUser } from '@/services/hooks';
import { useAuthStore } from '@/stores/authStore';

// Lazy load pages for code splitting
const FeedPage = lazy(() => import('@/features/activities/pages/FeedPage'));
const ActivityDetailPage = lazy(() => import('@/features/activities/pages/ActivityDetailPage'));
const CreateActivityPage = lazy(() => import('@/features/activities/pages/CreateActivityPage'));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));
const TripDetailPage = lazy(() => import('@/features/transport/pages/TripDetailPage'));
const ExplorePage = lazy(() => import('@/features/explore/pages/ExplorePage'));
const ChatPage = lazy(() => import('@/features/chat/pages/ChatPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'));
const PaymentPage = lazy(() => import('@/features/payments/pages/PaymentPage'));
const OnboardingPage = lazy(() => import('@/features/auth/pages/OnboardingPage'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const OrganizerDashboardPage = lazy(() => import('@/features/dashboard/pages/OrganizerDashboardPage'));
const CommunitiesPage = lazy(() => import('@/features/communities/pages/CommunitiesPage'));
const JournalPage = lazy(() => import('@/features/journal/pages/JournalPage'));
const JournalStoryPage = lazy(() => import('@/features/journal/pages/JournalStoryPage'));
const MarketplacePage = lazy(() => import('@/features/marketplace/pages/MarketplacePage'));
const MarketplaceListingPage = lazy(() => import('@/features/marketplace/pages/MarketplaceListingPage'));
const MarketplaceCreatePage = lazy(() => import('@/features/marketplace/pages/MarketplaceCreatePage'));
const SafetyPage = lazy(() => import('@/features/safety/pages/SafetyPage'));
const AchievementsPage = lazy(() => import('@/features/achievements/pages/AchievementsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-6">
        <div className="font-headline text-4xl font-black text-primary tracking-tight uppercase">
          Aktivar
        </div>
        <div className="h-0.5 w-32 overflow-hidden rounded-full bg-surface-container-highest">
          <div
            className="h-full w-1/3 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #ffc56c, #f0a500)',
              animation: 'loading-slide 1.2s ease-in-out infinite',
            }}
          />
        </div>
        <style>{`
          @keyframes loading-slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </div>
    </div>
  );
}

function AuthBootstrap({ children }: { children: ReactNode }) {
  const { setUser, isAuthenticated } = useAuthStore();
  const { data: currentUser, isError } = useCurrentUser();

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      return;
    }
    if (isAuthenticated && isError) {
      // Token invalid/expired and refresh failed
      setUser(null);
      sessionStorage.removeItem('aktivar_access_token');
      sessionStorage.removeItem('aktivar_refresh_token');
    }
  }, [currentUser, isAuthenticated, isError, setUser]);

  return <>{children}</>;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    const returnPath = buildReturnPath(location.pathname, location.search, location.hash);
    savePostAuthPath(returnPath);
    return <Navigate to="/login" replace state={{ from: returnPath }} />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthBootstrap>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Auth routes (no bottom nav) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* Main app routes (with bottom nav) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<FeedPage />} />
            <Route path="/activity/:id" element={<ActivityDetailPage />} />
            <Route path="/create" element={<RequireAuth><CreateActivityPage /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="/trip/:id" element={<TripDetailPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/chat/:activityId" element={<RequireAuth><ChatPage /></RequireAuth>} />
            <Route path="/payment/:activityId" element={<RequireAuth><PaymentPage /></RequireAuth>} />
            <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><OrganizerDashboardPage /></RequireAuth>} />
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/journal/:slug" element={<JournalStoryPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:listingSlug" element={<MarketplaceListingPage />} />
            <Route path="/marketplace/new" element={<RequireAuth><MarketplaceCreatePage /></RequireAuth>} />
            <Route path="/safety" element={<RequireAuth><SafetyPage /></RequireAuth>} />
            <Route path="/achievements" element={<RequireAuth><AchievementsPage /></RequireAuth>} />
          </Route>
        </Routes>
      </Suspense>
      </AuthBootstrap>

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1d201b',
            color: '#e1e3da',
            border: '1px solid rgba(81,69,51,0.2)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            borderRadius: '16px',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#7bda96',
              secondary: '#1d201b',
            },
          },
          error: {
            iconTheme: {
              primary: '#ffb4ab',
              secondary: '#1d201b',
            },
          },
        }}
      />
    </BrowserRouter>
    </QueryClientProvider>
  );
}
