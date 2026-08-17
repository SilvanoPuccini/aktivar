import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import PaymentPage from '../PaymentPage'
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
  useCreatePaymentIntent: vi.fn(),
  useJoinActivity: vi.fn(),
}))

vi.mock('@/services/hooks', () => hooksMock)

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}))
vi.mock('react-hot-toast', () => ({ default: toastMock }))

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
  what_to_bring: '',
  spots_remaining: 3,
  confirmed_count: 7,
  participants_preview: [],
  participants: [],
  weather: { temp: 18, description: 'Despejado', icon: 'sun' },
  created_at: '2026-04-01T10:00:00Z',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/payment/42']}>
      <Routes>
        <Route path="/payment/:activityId" element={<PaymentPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PaymentPage', () => {
  it('formats the activity price as CLP currency', () => {
    hooksMock.useActivity.mockReturnValue({ data: baseActivity })
    hooksMock.useCreatePaymentIntent.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ client_secret: '' }) })
    hooksMock.useJoinActivity.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}) })

    renderPage()

    expect(screen.getByText('$15.000')).toBeInTheDocument()
  })

  it('confirms the join after a successful dev-mode payment', async () => {
    const joinMutateAsync = vi.fn().mockResolvedValue({})
    hooksMock.useActivity.mockReturnValue({ data: baseActivity })
    hooksMock.useCreatePaymentIntent.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ client_secret: '' }) })
    hooksMock.useJoinActivity.mockReturnValue({ mutateAsync: joinMutateAsync })

    renderPage()

    await userEvent.click(screen.getByRole('button', { name: /confirmar pago/i }))

    await waitFor(() => expect(joinMutateAsync).toHaveBeenCalledWith(42), { timeout: 3000 })
    await waitFor(() => expect(screen.getByText('Pago confirmado')).toBeInTheDocument(), { timeout: 3000 })
  })

  it('still confirms the payment but warns the user if joining fails', async () => {
    const joinMutateAsync = vi.fn().mockRejectedValue(new Error('network'))
    hooksMock.useActivity.mockReturnValue({ data: baseActivity })
    hooksMock.useCreatePaymentIntent.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ client_secret: '' }) })
    hooksMock.useJoinActivity.mockReturnValue({ mutateAsync: joinMutateAsync })

    renderPage()

    await userEvent.click(screen.getByRole('button', { name: /confirmar pago/i }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(
      expect.stringContaining('Contáctanos'),
    ), { timeout: 3000 })
    await waitFor(() => expect(screen.getByText('Pago confirmado')).toBeInTheDocument(), { timeout: 3000 })
  })
})
