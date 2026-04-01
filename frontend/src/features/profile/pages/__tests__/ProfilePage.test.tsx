import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ProfilePage from '../ProfilePage'

const hooksMock = vi.hoisted(() => ({
  useCurrentUser: vi.fn(),
  useUploadImage: vi.fn(),
}))

const authStoreMock = vi.hoisted(() => ({
  logout: vi.fn(),
}))

vi.mock('@/services/hooks', () => hooksMock)
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => authStoreMock,
}))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
}

function renderProfile(node: ReactNode) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/profile']}>
        {node}
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('profile page guardrails', () => {
  it('shows a loading state while the profile query is resolving', () => {
    hooksMock.useCurrentUser.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() })
    hooksMock.useUploadImage.mockReturnValue({ mutate: vi.fn() })

    renderProfile(<ProfilePage />)

    expect(screen.getByLabelText('Cargando perfil')).toBeInTheDocument()
  })

  it('shows a retryable error state when profile loading fails', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    hooksMock.useCurrentUser.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch })
    hooksMock.useUploadImage.mockReturnValue({ mutate: vi.fn() })

    renderProfile(<ProfilePage />)

    expect(screen.getByText('No pudimos cargar tu perfil')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders safe fallbacks when optional profile fields are missing', () => {
    hooksMock.useCurrentUser.mockReturnValue({
      data: {
        id: 1,
        email: 'demo@aktivar.app',
        full_name: 'Demo Organizer',
        avatar: '',
        bio: '',
        phone: '',
        role: 'organizer',
        is_verified_email: false,
        is_verified_phone: false,
        profile: undefined,
        created_at: '2026-04-01T00:00:00Z',
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    hooksMock.useUploadImage.mockReturnValue({ mutate: vi.fn() })

    renderProfile(<ProfilePage />)

    expect(screen.getByText('Aún no hay insignias desbloqueadas.')).toBeInTheDocument()
    expect(screen.getByText('Sin ubicación definida')).toBeInTheDocument()
    expect(screen.getByText('Sin Instagram')).toBeInTheDocument()
    expect(screen.getByText('Sin sitio web')).toBeInTheDocument()
    expect(screen.getByText('Email pendiente')).toBeInTheDocument()
  })
})
