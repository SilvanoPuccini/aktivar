import React, { type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AchievementsPage from '@/features/achievements/pages/AchievementsPage'
import SafetyPage from '@/features/safety/pages/SafetyPage'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

const hookMocks = vi.hoisted(() => ({
  useRankDashboard: vi.fn(),
  useSafetyDashboard: vi.fn(),
  useInitiateSOS: vi.fn(),
  useUpdateSafetyChecklist: vi.fn(),
}))

vi.mock('@/services/hooks', () => hookMocks)

function renderWithRouter(node: ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>)
}

describe('ecosystem page guardrails', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    hookMocks.useInitiateSOS.mockReturnValue({ isPending: false, mutate: vi.fn() })
    hookMocks.useUpdateSafetyChecklist.mockReturnValue({ mutate: vi.fn() })
  })

  it('keeps achievements CTA visible when rank payload is incomplete', () => {
    hookMocks.useRankDashboard.mockReturnValue({
      data: {
        title: 'Fallback Rank',
        level: 0,
        current_xp: 0,
        next_level_xp: 0,
        total_distance_km: 0,
        peak_elevation_m: 0,
        group_saves: 0,
        next_unlock: 'Pending sync',
        badges: [],
        challenges: [],
      },
      isLoading: false,
      refetch: vi.fn(),
    })

    renderWithRouter(<AchievementsPage />)

    expect(screen.getByText(/0% hacia el próximo desbloqueo premium/i)).toBeInTheDocument()
    expect(screen.getByText(/no badges yet/i)).toBeInTheDocument()
    expect(screen.getByText(/no active challenges/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /explore marketplace/i })).toBeVisible()
  })

  it('keeps safety actions visible when dashboard arrays are empty and gear target is invalid', () => {
    hookMocks.useSafetyDashboard.mockReturnValue({
      data: {
        status: {
          expedition_protocol: 'Manual fallback',
          current_location: 'Fallback Ridge',
          temperature_c: 0,
          wind_kmh: 0,
          visibility_m: 0,
          risk_level: 'warning',
          storm_warning: 'Manual weather review required.',
          system_status: 'Degraded',
          last_sync_at: 'not-a-date',
        },
        checklist: {
          gear_progress: 0,
          gear_target: 0,
          route_status: 'incomplete',
          health_status: 'ready',
          permits_count: 0,
          updated_at: '2026-04-01T15:35:00Z',
        },
        contacts: [],
        logs: [],
        active_trip: null,
      },
      isLoading: false,
      refetch: vi.fn(),
    })

    renderWithRouter(<SafetyPage />)

    expect(screen.getByText(/0% del equipo esencial confirmado/i)).toBeInTheDocument()
    expect(screen.getByText(/no critical contacts configured/i)).toBeInTheDocument()
    expect(screen.getByText(/no safety events yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hold to broadcast/i })).toBeVisible()
  })
})
