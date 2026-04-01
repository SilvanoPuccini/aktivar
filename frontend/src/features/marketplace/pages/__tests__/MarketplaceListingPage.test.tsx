import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import MarketplaceListingPage from '../MarketplaceListingPage'

const useMarketplaceListingsMock = vi.fn()

vi.mock('@/services/hooks', () => ({
  useMarketplaceListings: () => useMarketplaceListingsMock(),
}))

describe('MarketplaceListingPage', () => {
  beforeEach(() => {
    useMarketplaceListingsMock.mockReset()
  })

  it('prefers the route slug over stale navigation state during listing transitions', () => {
    useMarketplaceListingsMock.mockReturnValue({
      data: [
        {
          id: 101,
          title: 'Expedition Dome Tent',
          slug: 'expedition-dome-tent',
          category: 'camping',
          subcategory: '4-season shelter',
          condition: 'excellent',
          price: 420000,
          rating: 4.9,
          location_name: 'Bariloche',
          cover_image: 'https://example.com/tent.jpg',
          is_featured: true,
          seller_name: 'Catalina Reyes',
          created_at: '2026-03-25T12:00:00Z',
        },
        {
          id: 103,
          title: 'Trail Camera GPS',
          slug: 'trail-camera-gps',
          category: 'tech',
          subcategory: 'Navigation kit',
          condition: 'new',
          price: 215000,
          rating: 4.8,
          location_name: 'Coyhaique',
          cover_image: 'https://example.com/gps.jpg',
          is_featured: false,
          seller_name: 'Valentina Silva',
          created_at: '2026-03-27T08:10:00Z',
        },
      ],
      isLoading: false,
    })

    render(
      <MemoryRouter initialEntries={[{
        pathname: '/marketplace/trail-camera-gps',
        state: {
          listing: {
            id: 101,
            title: 'Expedition Dome Tent',
            slug: 'expedition-dome-tent',
            category: 'camping',
            subcategory: '4-season shelter',
            condition: 'excellent',
            price: 420000,
            rating: 4.9,
            location_name: 'Bariloche',
            cover_image: 'https://example.com/tent.jpg',
            is_featured: true,
            seller_name: 'Catalina Reyes',
            created_at: '2026-03-25T12:00:00Z',
          },
        },
      }]}
      >
        <Routes>
          <Route path="/marketplace/:listingSlug" element={<MarketplaceListingPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Trail Camera GPS' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Expedition Dome Tent' })).not.toBeInTheDocument()
  })

  it('shows a loading fallback while the listing query is pending', () => {
    useMarketplaceListingsMock.mockReturnValue({ data: [], isLoading: true })

    render(
      <MemoryRouter initialEntries={['/marketplace/trail-camera-gps']}>
        <Routes>
          <Route path="/marketplace/:listingSlug" element={<MarketplaceListingPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Cargando gear')).toBeInTheDocument()
  })
})
