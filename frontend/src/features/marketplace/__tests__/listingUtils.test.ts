import { describe, expect, it } from 'vitest'
import { normalizeMarketplaceListing, normalizeMarketplaceListings } from '../listingUtils'

describe('listingUtils', () => {
  it('normalizes inconsistent marketplace listings without crashing consumers', () => {
    expect(normalizeMarketplaceListing({
      id: 'bad-id',
      title: '',
      category: 'unknown',
      subcategory: null,
      condition: 'used',
      price: -5,
      rating: 8,
      location_name: null,
      cover_image: '',
      seller_name: undefined,
      created_at: null,
    })).toMatchObject({
      id: 1,
      title: 'Gear listing',
      slug: 'gear-listing',
      category: 'camping',
      subcategory: 'General gear',
      condition: 'good',
      price: 0,
      rating: 5,
      location_name: 'Ubicación por confirmar',
      seller_name: 'Seller verificado',
    })
  })

  it('returns an empty array for non-list responses', () => {
    expect(normalizeMarketplaceListings({ results: [] })).toEqual([])
  })
})
