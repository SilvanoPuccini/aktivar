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
    const requestUrl = error.config?.url ?? '';

    // Skip token refresh for auth endpoints — let the caller handle errors
    const isAuthRequest = AUTH_ENDPOINTS.some((ep) => requestUrl.includes(ep));

    if (status === 401 && !isAuthRequest) {
      // Token expired — try refresh using stored refresh token
      const refreshToken = sessionStorage.getItem('aktivar_refresh_token');
      if (!refreshToken) {
        sessionStorage.removeItem('aktivar_access_token');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/onboarding')) {
          savePostAuthPath(buildReturnPath(window.location.pathname, window.location.search, window.location.hash));
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        const newToken = refreshResponse.data.access;
        sessionStorage.setItem('aktivar_access_token', newToken);
        if (refreshResponse.data.refresh) {
          sessionStorage.setItem('aktivar_refresh_token', refreshResponse.data.refresh);
        }

        // Retry original request
        if (error.config) {
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config);
        }
      } catch {
        sessionStorage.removeItem('aktivar_access_token');
        sessionStorage.removeItem('aktivar_refresh_token');
        // Only redirect if we're not already on an auth page
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/onboarding')) {
          savePostAuthPath(buildReturnPath(window.location.pathname, window.location.search, window.location.hash));
          window.location.href = '/login';
        }
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
