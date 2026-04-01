import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ActivityDetailPage from '../ActivityDetailPage'
import type { Activity } from '@/types/activity'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

const hooksMock = vi.hoisted(() => ({
  useActivity: vi.fn(),
  useJoinActivity: vi.fn(),
}))

const authStoreMock = vi.hoisted(() => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/services/hooks', () => hooksMock)
vi.mock('@/stores/authStore', () => authStoreMock)
vi.mock('@/components/ActivityMap', () => ({ default: () => <div data-testid="activity-map" /> }))
vi.mock('@/components/WeatherBadge', () => ({ default: () => <div data-testid="weather-badge" /> }))

const baseActivity: Activity = {
  id: 42,
  title: 'Expedición QA',
  description: 'Checklist',
  category: { id: 1, name: 'Hiking', slug: 'hiking', icon: 'mountain', color: '#fff', is_outdoor: true },
  cover_image: 'https://images.unsplash.com/photo-1',
  organizer: { id: 11, full_name: 'Guide', avatar: 'https://images.unsplash.com/photo-2', is_verified_email: true },
  location_name: 'Cajón',
  latitude: -33.4,
  longitude: -70.6,
  meeting_point: 'Entrada',
  start_datetime: '2026-04-10T09:00:00Z',
  end_datetime: '2026-04-10T13:00:00Z',
  capacity: 10,
  price: 15000,
  is_free: false,
  status: 'published',
  difficulty: 'moderate',
  distance_km: 8,
  what_to_bring: 'Agua, bloqueador',
  spots_remaining: 3,
  confirmed_count: 7,
  participants_preview: [{ id: 21, full_name: 'Explorer', avatar: 'https://images.unsplash.com/photo-3' }],
  participants: [],
  weather: { temp: 18, description: 'Despejado', icon: 'sun' },
  created_at: '2026-04-01T10:00:00Z',
}

function renderPage(initialEntry = '/activity/42') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/activity/:id" element={<ActivityDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  navigateMock.mockReset()
  sessionStorage.clear()
  hooksMock.useJoinActivity.mockReturnValue({ isPending: false, mutate: vi.fn() })
  hooksMock.useActivity.mockReturnValue({ data: baseActivity, isLoading: false })
  authStoreMock.useAuthStore.mockReturnValue({ isAuthenticated: false, user: null })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('activity detail micro-QA', () => {
  it('shows a loading state instead of the not-found empty state while the activity is fetching', () => {
    hooksMock.useActivity.mockReturnValue({ data: undefined, isLoading: true })

    renderPage()

    expect(screen.getByLabelText('Cargando actividad')).toBeInTheDocument()
    expect(screen.queryByText('Actividad no encontrada')).not.toBeInTheDocument()
  })

  it('sends logged-out join attempts through login with a return path', async () => {
    const user = userEvent.setup()

    renderPage('/activity/42?from=feed#join')

    await user.click(screen.getByRole('button', { name: /join activity/i }))

    expect(sessionStorage.getItem('aktivar_post_auth_path')).toBe('/activity/42?from=feed#join')
    expect(navigateMock).toHaveBeenCalledWith('/login', {
      state: { from: '/activity/42?from=feed#join' },
    })
  })

  it('surfaces confirmed participation and keeps chat unlocked without another join CTA', () => {
    authStoreMock.useAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { id: 77 },
    })
    hooksMock.useActivity.mockReturnValue({
      data: {
        ...baseActivity,
        participants: [
          {
            id: 1,
            user: { id: 77, full_name: 'Current User', avatar: 'https://images.unsplash.com/photo-4' },
            status: 'confirmed',
            is_revealed: true,
            joined_at: '2026-04-02T10:00:00Z',
          },
        ],
      },
      isLoading: false,
    })

    renderPage()

    expect(screen.getByRole('button', { name: /you are in/i })).toBeDisabled()
    expect(screen.getAllByRole('button', { name: /open group chat/i })).toHaveLength(2)
    expect(screen.getByText(/tu lugar está confirmado/i)).toBeInTheDocument()
  })

  it('switches to the waitlist CTA when no confirmed spots remain', () => {
    hooksMock.useActivity.mockReturnValue({
      data: {
        ...baseActivity,
        spots_remaining: 0,
        confirmed_count: 10,
      },
      isLoading: false,
    })

    renderPage()

    expect(screen.getByRole('button', { name: /join waitlist/i })).toBeInTheDocument()
    expect(screen.getByText(/entrarás a la lista de espera/i)).toBeInTheDocument()
  })
})
