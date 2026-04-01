import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { buildReturnPath, savePostAuthPath } from '@/lib/authRedirect';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let isRefreshingToken = false;
let pendingRefreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  pendingRefreshSubscribers.push(callback);
};

const publishTokenRefresh = (token: string) => {
  pendingRefreshSubscribers.forEach((callback) => callback(token));
  pendingRefreshSubscribers = [];
};

const clearAuthAndRedirect = () => {
  sessionStorage.removeItem('aktivar_access_token');
  window.location.href = '/onboarding';
};

// Request interceptor: inject JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('aktivar_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints that should NOT trigger the 401 refresh/redirect interceptor
const AUTH_ENDPOINTS = ['/auth/token/', '/users/register/'];

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(endpoints.refresh)
    ) {
      originalRequest._retry = true;

      if (isRefreshingToken) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshingToken = true;
      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        const newToken = refreshResponse.data.access;
        sessionStorage.setItem('aktivar_access_token', newToken);
        publishTokenRefresh(newToken);

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch {
        clearAuthAndRedirect();
      } finally {
        isRefreshingToken = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const endpoints = {
  // Auth
  login: '/auth/token/',
  refresh: '/auth/token/refresh/',
  register: '/users/register/',

  // Users
  users: '/users/',
  me: '/users/me/',
  myProfile: '/users/me/profile/',
  myAvatar: '/users/me/avatar/',
  verifyEmailRequest: '/users/verify-email/request/',
  verifyEmailConfirm: '/users/verify-email/confirm/',
  verifyPhoneRequest: '/users/verify-phone/request/',
  verifyPhoneConfirm: '/users/verify-phone/confirm/',

  // Activities (included at /api/v1/activities/)
  activities: '/activities/',
  categories: '/activities/categories/',

  // Transport (included at /api/v1/transport/)
  trips: '/transport/trips/',
  vehicles: '/transport/vehicles/',

  // Chat (included at /api/v1/chat/)
  messages: (activityId: number) => `/chat/activities/${activityId}/messages/`,

  // Reviews (included at /api/v1/reviews/)
  reviews: '/reviews/',
  reports: '/reviews/reports/',

  // Payments (included at /api/v1/payments/)
  payments: '/payments/',
  subscriptions: '/payments/subscriptions/',

  // Notifications (included at /api/v1/notifications/)
  notifications: '/notifications/',

  // Connect (included at /api/v1/payments/)
  connectOnboarding: '/payments/connect/onboarding/',
  connectDashboard: '/payments/connect/dashboard/',

  // Health
  health: '/health/',

  // Ecosystem
  communities: '/ecosystem/communities/',
  journal: '/ecosystem/journal/',
  marketplace: '/ecosystem/marketplace/',
  rank: '/ecosystem/rank/',
  safety: '/ecosystem/safety/',
  safetySos: '/ecosystem/safety/initiate-sos/',
  safetyChecklist: '/ecosystem/safety/checklist/',
} as const;
