import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { endpoints } from './api';
import type { Activity, Category } from '@/types/activity';
import type { User } from '@/types/user';
import type { ChatMessage } from '@/types/chat';

// ---- Activities ----

export function useActivities(params?: { search?: string; category?: string }) {
  return useQuery<Activity[]>({
    queryKey: ['activities', params],
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params?.search) queryParams.search = params.search;
      if (params?.category) queryParams.category__slug = params.category;
      const res = await api.get(endpoints.activities, { params: queryParams });
      // Handle paginated or plain array response
      return res.data.results ?? res.data;
    },
  });
}

export function useActivity(id: string | undefined) {
  return useQuery<Activity>({
    queryKey: ['activity', id],
    queryFn: async () => {
      const res = await api.get(`${endpoints.activities}${id}/`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get(endpoints.categories);
      return res.data.results ?? res.data;
    },
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
  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await api.get(endpoints.me);
      return res.data;
    },
    enabled: !!sessionStorage.getItem('aktivar_access_token'),
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

// ---- Trips ----

export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.get(endpoints.trips);
      return res.data.results ?? res.data;
    },
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trip', id],
    queryFn: async () => {
      const res = await api.get(`${endpoints.trips}${id}/`);
      return res.data;
    },
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
    queryFn: async () => {
      const res = await api.get(endpoints.messages(activityId!));
      return res.data.results ?? res.data;
    },
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
      const res = await api.post(`${endpoints.payments}create-intent/`, {
        activity_id: activityId,
        amount,
      });
      return res.data;
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
      const res = await api.get(`${endpoints.payments}my/`);
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

export function useNotifications() {
  return useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get(`${endpoints.notifications}`);
      return res.data.results ?? res.data;
    },
    retry: 1,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (notificationId: number) => {
      await api.patch(`${endpoints.notifications}${notificationId}/`, {
        is_read: true,
      });
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
      await api.post(`${endpoints.notifications}mark-all-read/`);
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
