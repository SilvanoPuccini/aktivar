import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Lazy load pages for code splitting
const FeedPage = lazy(() => import('@/features/activities/pages/FeedPage'));
const ActivityDetailPage = lazy(() => import('@/features/activities/pages/ActivityDetailPage'));
const CreateActivityPage = lazy(() => import('@/features/activities/pages/CreateActivityPage'));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));
const TripDetailPage = lazy(() => import('@/features/transport/pages/TripDetailPage'));
const OnboardingPage = lazy(() => import('@/features/auth/pages/OnboardingPage'));

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="font-display text-4xl font-black text-on-surface">
          AKT<span className="text-primary">IVAR</span>
        </div>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-surface-container-highest">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Auth routes (no bottom nav) */}
          <Route element={<AuthLayout />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* Main app routes (with bottom nav) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<FeedPage />} />
            <Route path="/activity/:id" element={<ActivityDetailPage />} />
            <Route path="/create" element={<CreateActivityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/trip/:id" element={<TripDetailPage />} />
          </Route>
        </Routes>
      </Suspense>

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1d201b',
            color: '#e1e3da',
            border: '1px solid #514533',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            borderRadius: '12px',
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
  );
}
