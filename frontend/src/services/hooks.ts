import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import api, { endpoints } from './api';
import analytics from '@/lib/analytics';
import { mockActivities } from '@/data/activities';
import { categories as mockCategories } from '@/data/categories';
import { mockChatMessages, mockOrganizerDashboard } from '@/data/mockDevData';
import type { Activity, ActivityParticipant, Category } from '@/types/activity';
import type { User } from '@/types/user';
import type { ChatMessage } from '@/types/chat';

async function withFallback<T>(request: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await request();
  } catch {
    // Only use mock data in development, never in production
    if (import.meta.env.DEV) {
      return fallback();
    }
    throw new Error('API request failed');
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

        if (import.meta.env.DEV) {
          return mockActivities.find((activity) => String(activity.id) === id);
        }

        throw error;
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
      queryClient.invalidateQueries({ queryKey: ['activityParticipants', activityId] });
    },
  });
}

export function useActivityParticipants(activityId: number | undefined) {
  return useQuery<ActivityParticipant[]>({
    queryKey: ['activityParticipants', activityId],
    queryFn: async () => {
      const res = await api.get(endpoints.participants(activityId!));
      return res.data.results ?? res.data;
    },
    enabled: !!activityId,
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ activityId, userId }: { activityId: number; userId: number }) => {
      const res = await api.post(endpoints.removeParticipant(activityId), { user_id: userId });
      return res.data;
    },
    onSuccess: (_data, { activityId }) => {
      queryClient.invalidateQueries({ queryKey: ['activityParticipants', activityId] });
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

