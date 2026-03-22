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

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
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
        window.location.href = '/onboarding';
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

  // Health
  health: '/health/',
} as const;
