import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommunitiesPage from '@/features/communities/pages/CommunitiesPage'
import LoginPage from '@/features/auth/pages/LoginPage'

const navigateMock = vi.fn()
const loginStoreMock = vi.fn()
const apiPostMock = vi.fn()
const apiGetMock = vi.fn()
const locationMock = {
  pathname: '/communities',
  search: '',
  hash: '',
  state: null as null | { from?: string },
  key: 'test',
}

const authState = {
  isAuthenticated: false,
  login: loginStoreMock,
}

const hookMocks = vi.hoisted(() => ({
  useCommunities: vi.fn(),
  useFeaturedCommunity: vi.fn(),
  useJoinCommunity: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => locationMock,
  }
})

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector?: (state: typeof authState) => unknown) => (selector ? selector(authState) : authState),
}))

vi.mock('@/services/api', () => ({
  default: {
    post: apiPostMock,
    get: apiGetMock,
  },
  endpoints: {
    login: '/auth/token/',
    me: '/users/me/',
  },
}))

vi.mock('@/services/hooks', () => hookMocks)

function renderWithRouter(node: React.ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>)
}

describe('ecosystem CTA handoffs', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    loginStoreMock.mockReset()
    apiPostMock.mockReset()
    apiGetMock.mockReset()
    authState.isAuthenticated = false
    locationMock.pathname = '/communities'
    locationMock.search = ''
    locationMock.hash = ''
    locationMock.state = null
    sessionStorage.clear()

    hookMocks.useCommunities.mockReturnValue({ data: [{
      id: 1,
      name: 'Fallback Club',
      slug: 'fallback-club',
      category: 'mountain',
      tagline: 'Fallback',
      description: 'Fallback community',
      cover_image: 'https://example.com/community.jpg',
      location_name: 'Bariloche',
      member_count: 10,
      activity_label: 'Weekend hikes',
      cadence_label: 'Weekly',
      is_featured: true,
      is_joined: false,
    }] })
    hookMocks.useFeaturedCommunity.mockReturnValue({ data: {
      id: 1,
      name: 'Fallback Club',
      slug: 'fallback-club',
      category: 'mountain',
      tagline: 'Fallback',
      description: 'Fallback community',
      cover_image: 'https://example.com/community.jpg',
      location_name: 'Bariloche',
      member_count: 10,
      activity_label: 'Weekend hikes',
      cadence_label: 'Weekly',
      is_featured: true,
      is_joined: false,
    } })
    hookMocks.useJoinCommunity.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  it('sends unauthenticated community joins to login with a return target', async () => {
    const user = userEvent.setup()

    renderWithRouter(<CommunitiesPage />)
    await user.click(screen.getAllByRole('button', { name: /join community|join/i })[0])

    expect(sessionStorage.getItem('aktivar_post_auth_path')).toBe('/communities')
    expect(navigateMock).toHaveBeenCalledWith('/login', { state: { from: '/communities' } })
  })

  it('returns login users to the requested protected route', async () => {
    const user = userEvent.setup()
    locationMock.pathname = '/login'
    locationMock.state = { from: '/safety' }
    apiPostMock.mockResolvedValue({ data: { access: 'token', refresh: 'refresh' } })
    apiGetMock.mockResolvedValue({ data: { id: 1, full_name: 'Demo Explorer' } })

    renderWithRouter(<LoginPage />)
    await user.type(screen.getByRole('textbox', { name: /email address/i }), DEMO_EMAIL)
    await user.type(screen.getByRole('textbox', { name: /password/i }), DEMO_PASSWORD)
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(loginStoreMock).toHaveBeenCalled()
      expect(navigateMock).toHaveBeenCalledWith('/safety', { replace: true })
    })
  })
})
