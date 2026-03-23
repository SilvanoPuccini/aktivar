import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../authStore'
import type { User } from '@/types/user'

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  full_name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  bio: 'A test user',
  phone: '+1234567890',
  role: 'user',
  is_verified_email: true,
  is_verified_phone: false,
  profile: {
    location_name: 'Bogota',
    latitude: 4.7110,
    longitude: -74.0721,
    bio_extended: 'Extended bio',
    website: '',
    instagram: '@testuser',
    total_activities: 5,
    total_km: 120,
    total_people_met: 30,
    badges: [],
  },
  created_at: '2025-01-01T00:00:00Z',
}

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
    vi.restoreAllMocks()
  })

  it('has correct initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
  })

  it('login sets user and isAuthenticated to true', () => {
    useAuthStore.getState().login(mockUser)

    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it('logout clears user, sets isAuthenticated to false, and removes token', () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')

    // First login
    useAuthStore.getState().login(mockUser)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // Then logout
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(removeItemSpy).toHaveBeenCalledWith('aktivar_access_token')
  })

  it('setUser sets user and updates isAuthenticated', () => {
    useAuthStore.getState().setUser(mockUser)

    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('setUser with null sets isAuthenticated to false', () => {
    // Set a user first
    useAuthStore.getState().setUser(mockUser)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // Then set null
    useAuthStore.getState().setUser(null)

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setLoading updates isLoading', () => {
    useAuthStore.getState().setLoading(true)
    expect(useAuthStore.getState().isLoading).toBe(true)

    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})
