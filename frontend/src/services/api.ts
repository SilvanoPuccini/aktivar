import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

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
      // Token expired — try refresh
      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {}, {
          withCredentials: true,
        });
        const newToken = refreshResponse.data.access;
        sessionStorage.setItem('aktivar_access_token', newToken);

        // Retry original request
        if (error.config) {
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config);
        }
      } catch {
        sessionStorage.removeItem('aktivar_access_token');
        // Only redirect if we're not already on an auth page
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/onboarding')) {
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
  verifyEmailRequest: '/users/verify-email/request/',
  verifyEmailConfirm: '/users/verify-email/confirm/',
  verifyPhoneRequest: '/users/verify-phone/request/',
  verifyPhoneConfirm: '/users/verify-phone/confirm/',

  // Activities
  activities: '/activities/',
  categories: '/categories/',

  // Transport
  trips: '/trips/',
  vehicles: '/vehicles/',

  // Chat
  messages: (activityId: number) => `/chat/activities/${activityId}/messages/`,

  // Reviews
  reviews: '/reviews/',
  reports: '/reports/',

  // Payments
  payments: '/payments/',
  subscriptions: '/subscriptions/',

  // Notifications
  notifications: '/notifications/',

  // Connect
  connectOnboarding: '/payments/connect/onboarding/',
  connectDashboard: '/payments/connect/dashboard/',

  // Health
  health: '/health/',
} as const;
