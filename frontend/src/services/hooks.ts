import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import api, { endpoints } from './api';
import analytics from '@/lib/analytics';
import { mockActivities } from '@/data/activities';
import { categories as mockCategories } from '@/data/categories';
import {
  createMockMarketplaceListing,
  joinMockCommunity,
  mockChatMessages,
  mockCommunities,
  mockJournalStories,
  mockMarketplaceListings,
  mockOrganizerDashboard,
  mockRankDashboard,
  mockSafetyDashboard,
  updateMockSafetyChecklist,
} from '@/data/ecosystem';
import { mockTrips } from '@/data/trips';
import { normalizeMarketplaceListing, normalizeMarketplaceListings } from '@/features/marketplace/listingUtils';
import type { Activity, Category } from '@/types/activity';
import type { Community, JournalStory, MarketplaceListing, RankDashboard, SafetyChecklist, SafetyDashboard } from '@/types/ecosystem';
import type { User } from '@/types/user';
import type { ChatMessage } from '@/types/chat';

async function withFallback<T>(request: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await request();
  } catch {
    return fallback();
  }
}

// ---- Activities ----

export function useActivities(params?: { search?: string; category?: string }) {
  return useQuery<Activity[]>({
    queryKey: ['activities', params],
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params?.search) queryParams.search = params.search;
      if (params?.category) queryParams.category__slug = params.category;
      return withFallback(async () => {
        const res = await api.get(endpoints.activities, { params: queryParams });
        return res.data.results ?? res.data;
      }, () => {
        const q = params?.search?.trim().toLowerCase();
        return mockActivities.filter((activity) => {
          if (params?.category && activity.category.slug !== params.category) return false;
          if (!q) return true;
          return [activity.title, activity.location_name, activity.description].some((field) => field.toLowerCase().includes(q));
        });
      });
    },
  });
}

export function useActivity(id: string | undefined) {
  return useQuery<Activity | undefined>({
    queryKey: ['activity', id],
    queryFn: async () => {
      try {
        const res = await api.get(`${endpoints.activities}${id}/`);
        return res.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return undefined;
        }

        return mockActivities.find((activity) => String(activity.id) === id);
      }
    },
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(endpoints.categories);
      return res.data.results ?? res.data;
    }, () => mockCategories),
    staleTime: 1000 * 60 * 30, // 30 min
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post(endpoints.activities, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useJoinActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: number) => {
      const res = await api.post(`${endpoints.activities}${activityId}/join/`);
      return res.data;
    },
    onSuccess: (_data, activityId) => {
      analytics.activityJoined(activityId);
      queryClient.invalidateQueries({ queryKey: ['activity', String(activityId)] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useLeaveActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: number) => {
      const res = await api.post(`${endpoints.activities}${activityId}/leave/`);
      return res.data;
    },
    onSuccess: (_data, activityId) => {
      queryClient.invalidateQueries({ queryKey: ['activity', String(activityId)] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

// ---- User ----

export function useCurrentUser() {
  const accessToken = typeof window !== 'undefined' ? sessionStorage.getItem('aktivar_access_token') : null;

  return useQuery<User>({
    queryKey: ['currentUser', accessToken],
    queryFn: async () => {
      const res = await api.get(endpoints.me);
      return res.data;
    },
    enabled: !!accessToken,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.patch(endpoints.myProfile, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// ---- Verification ----

export function useRequestEmailVerification() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.post(endpoints.verifyEmailRequest);
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (token: string) => {
      await api.post(endpoints.verifyEmailConfirm, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useRequestPhoneVerification() {
  return useMutation<void, Error, string>({
    mutationFn: async (phone: string) => {
      await api.post(endpoints.verifyPhoneRequest, { phone });
    },
  });
}

export function useVerifyPhone() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (otp: string) => {
      await api.post(endpoints.verifyPhoneConfirm, { otp });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// ---- Trips ----

export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(endpoints.trips);
      return res.data.results ?? res.data;
    }, () => mockTrips),
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trip', id],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(`${endpoints.trips}${id}/`);
      return res.data;
    }, () => mockTrips.find((trip) => String(trip.id) === id) ?? mockTrips[0]),
    enabled: !!id,
  });
}

export function useBookSeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tripId: number) => {
      const res = await api.post(`${endpoints.trips}${tripId}/book_seat/`);
      return res.data;
    },
    onSuccess: (_data, tripId) => {
      queryClient.invalidateQueries({ queryKey: ['trip', String(tripId)] });
    },
  });
}

// ---- Reviews ----

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { reviewee: number; activity: number; rating: number; comment: string }) => {
      const res = await api.post(endpoints.reviews, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

// ---- Health ----

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await api.get(endpoints.health);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

// ---- Image Upload ----

export function useUploadImage() {
  return useMutation<{ url: string }, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/core/images/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
  });
}

// ---- Chat / Messages ----

export function useMessages(activityId: number | undefined) {
  return useQuery<ChatMessage[]>({
    queryKey: ['messages', activityId],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(endpoints.messages(activityId!));
      return res.data.results ?? res.data;
    }, () => mockChatMessages),
    enabled: !!activityId,
    retry: 1,
  });
}

// ---- Payments ----

interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export function useCreatePaymentIntent() {
  return useMutation<PaymentIntent, Error, { activityId: number; amount: number }>({
    mutationFn: async ({ activityId, amount }) => {
      analytics.paymentStarted(amount);
      const res = await api.post(endpoints.payments, {
        activity: activityId,
        amount,
        currency: 'CLP',
      });
      return {
        id: res.data.payment?.id ?? '',
        client_secret: res.data.client_secret,
        amount,
        currency: 'CLP',
        status: res.data.payment?.status ?? 'pending',
      };
    },
  });
}

interface Payment {
  id: number;
  activity_title: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  created_at: string;
}

export function useUserPayments() {
  return useQuery<Payment[]>({
    queryKey: ['userPayments'],
    queryFn: async () => {
      const res = await api.get(endpoints.payments);
      return res.data.results ?? res.data;
    },
    enabled: !!sessionStorage.getItem('aktivar_access_token'),
  });
}

// ---- Notifications ----

export interface AppNotification {
  id: number;
  type: 'join' | 'message' | 'reminder' | 'spot_opened';
  actor: {
    id: number;
    full_name: string;
    avatar: string;
  };
  activity_id: number;
  description: string;
  created_at: string;
  is_read: boolean;
}

function mapNotificationType(notificationType: string): AppNotification['type'] {
  if (notificationType === 'new_message') return 'message';
  if (notificationType === 'activity_joined') return 'join';
  if (notificationType === 'activity_reminder') return 'reminder';
  return 'spot_opened';
}

export function useNotifications() {
  return useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get(endpoints.notifications);
      const rows = res.data.results ?? res.data;
      return rows.map((row: { id: number; notification_type: string; data?: Record<string, unknown>; body: string; created_at: string; is_read: boolean }) => ({
        id: row.id,
        type: mapNotificationType(row.notification_type),
        actor: (row.data?.actor as AppNotification['actor']) ?? { id: 0, full_name: 'Aktivar', avatar: '' },
        activity_id: Number((row.data?.activity_id as number | string | undefined) ?? 0),
        description: row.body,
        created_at: row.created_at,
        is_read: row.is_read,
      }));
    },
    retry: 1,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (notificationId: number) => {
      await api.post(`${endpoints.notifications}${notificationId}/mark_read/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.post(`${endpoints.notifications}mark_all_read/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function usePushSubscription() {
  return useMutation<void, Error, { subscription: PushSubscriptionJSON }>({
    mutationFn: async ({ subscription }) => {
      await api.post(`${endpoints.notifications}subscribe/`, {
        subscription,
      });
    },
  });
}

// ---- Organizer Dashboard ----

export function useOrganizerDashboard() {
  return useQuery(({
    queryKey: ['organizerDashboard'],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(`${endpoints.activities}dashboard/`);
      return res.data;
    }, () => mockOrganizerDashboard),
    enabled: !!sessionStorage.getItem('aktivar_access_token'),
  }));
}

// ---- Social Features ----

export function useActivityStories(activityId: number | undefined) {
  return useQuery({
    queryKey: ['stories', activityId],
    queryFn: async () => {
      const res = await api.get(`${endpoints.activities}${activityId}/stories/`);
      return res.data.results ?? res.data;
    },
    enabled: !!activityId,
  });
}

export function useSquads() {
  return useQuery({
    queryKey: ['squads'],
    queryFn: async () => {
      const res = await api.get(`${endpoints.activities.replace('activities/', 'squads/')}`);
      return res.data.results ?? res.data;
    },
  });
}

export function useAvailabilityStatuses(params?: { lat?: number; lng?: number; radius_km?: number }) {
  return useQuery({
    queryKey: ['availability', params],
    queryFn: async () => {
      const res = await api.get(`${endpoints.activities.replace('activities/', 'availability/')}`, { params });
      return res.data.results ?? res.data;
    },
  });
}

export function useSwipeActivity() {
  return useMutation({
    mutationFn: async ({ activityId, interested }: { activityId: number; interested: boolean }) => {
      const res = await api.post(`${endpoints.activities.replace('activities/', 'swipes/')}`, {
        activity: activityId,
        interested,
      });
      return res.data;
    },
  });
}

export function useEmergencyContact() {
  return useQuery({
    queryKey: ['emergencyContact'],
    queryFn: async () => {
      const res = await api.get(`${endpoints.trips.replace('trips/', 'emergency-contacts/')}`);
      return res.data;
    },
    enabled: !!sessionStorage.getItem('aktivar_access_token'),
  });
}

export function useTripSplit(tripId: string | undefined) {
  return useQuery({
    queryKey: ['tripSplit', tripId],
    queryFn: async () => {
      const res = await api.get(`${endpoints.trips}${tripId}/split/`);
      return res.data;
    },
    enabled: !!tripId,
    refetchInterval: 10000, // Refresh every 10s for real-time split
  });
}

export function useTriggerEmergency() {
  return useMutation({
    mutationFn: async ({ tripId, latitude, longitude, message }: {
      tripId: number; latitude: number; longitude: number; message?: string;
    }) => {
      const res = await api.post(`${endpoints.trips}${tripId}/emergency/`, {
        latitude, longitude, message,
      });
      return res.data;
    },
  });
}

// ---- Ecosystem ----

export function useCommunities(params?: { search?: string }) {
  return useQuery<Community[]>({
    queryKey: ['communities', params],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(endpoints.communities, { params });
      return res.data.results ?? res.data;
    }, () => {
      const q = params?.search?.trim().toLowerCase();
      return mockCommunities.filter((community) => {
        if (!q) return true;
        return [community.name, community.description, community.location_name, community.activity_label]
          .some((field) => field.toLowerCase().includes(q));
      });
    }),
  });
}

export function useFeaturedCommunity() {
  return useQuery<Community>({
    queryKey: ['communities', 'featured'],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(`${endpoints.communities}featured/`);
      return res.data;
    }, () => mockCommunities.find((community) => community.is_featured) ?? mockCommunities[0]),
  });
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();
  return useMutation<Community, Error, number>({
    mutationFn: async (communityId: number) => withFallback(async () => {
      const res = await api.post(`${endpoints.communities}${communityId}/join/`);
      return res.data;
    }, () => joinMockCommunity(communityId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });
}

export function useJournalStories() {
  return useQuery<JournalStory[]>({
    queryKey: ['journalStories'],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(endpoints.journal);
      return res.data.results ?? res.data;
    }, () => mockJournalStories),
  });
}

export function useFeaturedJournalStory() {
  return useQuery<JournalStory>({
    queryKey: ['journalStories', 'featured'],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(`${endpoints.journal}featured/`);
      return res.data;
    }, () => mockJournalStories.find((story) => story.is_featured) ?? mockJournalStories[0]),
  });
}

export function useTrendingJournalStories() {
  return useQuery<JournalStory[]>({
    queryKey: ['journalStories', 'trending'],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(`${endpoints.journal}trending/`);
      return res.data;
    }, () => mockJournalStories.filter((story) => story.is_trending)),
  });
}

export function useMarketplaceListings(params?: { search?: string; category?: string; ordering?: string }) {
  return useQuery<MarketplaceListing[]>({
    queryKey: ['marketplaceListings', params],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(endpoints.marketplace, { params });
      return normalizeMarketplaceListings(res.data.results ?? res.data);
    }, () => {
      const q = params?.search?.trim().toLowerCase();
      return normalizeMarketplaceListings(mockMarketplaceListings).filter((listing) => {
        if (params?.category && listing.category !== params.category) return false;
        if (!q) return true;
        return [listing.title, listing.location_name, listing.seller_name, listing.subcategory]
          .some((field) => field.toLowerCase().includes(q));
      });
    }),
  });
}

export function useCreateMarketplaceListing() {
  const queryClient = useQueryClient();
  return useMutation<MarketplaceListing, Error, Partial<MarketplaceListing>>({
    mutationFn: async (payload) => withFallback(async () => {
      const res = await api.post(endpoints.marketplace, payload);
      return normalizeMarketplaceListing(res.data) ?? createMockMarketplaceListing(payload);
    }, () => createMockMarketplaceListing(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceListings'] });
    },
  });
}

export function useRankDashboard() {
  return useQuery<RankDashboard>({
    queryKey: ['rankDashboard'],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(endpoints.rank);
      return res.data;
    }, () => mockRankDashboard),
    enabled: !!sessionStorage.getItem('aktivar_access_token'),
  });
}

export function useSafetyDashboard() {
  return useQuery<SafetyDashboard>({
    queryKey: ['safetyDashboard'],
    queryFn: async () => withFallback(async () => {
      const res = await api.get(endpoints.safety);
      return res.data;
    }, () => mockSafetyDashboard),
    enabled: !!sessionStorage.getItem('aktivar_access_token'),
  });
}

export function useInitiateSOS() {
  const queryClient = useQueryClient();
  return useMutation<{ id: number; detail: string }, Error, { message?: string }>({
    mutationFn: async (payload) => withFallback(async () => {
      const res = await api.post(endpoints.safetySos, payload);
      return res.data;
    }, () => ({ id: Date.now(), detail: payload.message ?? 'SOS triggered from command center.' })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetyDashboard'] });
    },
  });
}

export function useUpdateSafetyChecklist() {
  const queryClient = useQueryClient();
  return useMutation<SafetyChecklist, Error, Partial<SafetyChecklist>>({
    mutationFn: async (payload) => withFallback(async () => {
      const res = await api.patch(endpoints.safetyChecklist, payload);
      return res.data;
    }, () => updateMockSafetyChecklist(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetyDashboard'] });
    },
  });
}
