import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { endpoints } from './api';
import type { Activity } from '@/types/activity';
import type { User } from '@/types/user';

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
  return useQuery({
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
