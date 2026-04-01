import type { MarketplaceListing } from '@/types/ecosystem';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=900&fit=crop';
const DEFAULT_LOCATION = 'Ubicación por confirmar';
const DEFAULT_SELLER = 'Seller verificado';

function asText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown) {
  return value === true;
}

function asCategory(value: unknown): MarketplaceListing['category'] {
  return ['camping', 'climbing', 'water_sports', 'tech', 'packs'].includes(String(value))
    ? value as MarketplaceListing['category']
    : 'camping';
}

function asCondition(value: unknown): MarketplaceListing['condition'] {
  return ['new', 'excellent', 'good'].includes(String(value))
    ? value as MarketplaceListing['condition']
    : 'good';
}

function buildSlug(title: string, fallbackId: number) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || `listing-${fallbackId}`;
}

export function normalizeMarketplaceListing(value: unknown, index = 0): MarketplaceListing | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Partial<MarketplaceListing>;
  const fallbackId = asNumber(record.id, index + 1);
  const title = asText(record.title, 'Gear listing');

  return {
    id: fallbackId,
    title,
    slug: asText(record.slug, buildSlug(title, fallbackId)),
    category: asCategory(record.category),
    subcategory: asText(record.subcategory, 'General gear'),
    condition: asCondition(record.condition),
    price: Math.max(0, asNumber(record.price, 0)),
    rating: Math.max(0, Math.min(5, asNumber(record.rating, 0))),
    location_name: asText(record.location_name, DEFAULT_LOCATION),
    cover_image: asText(record.cover_image, DEFAULT_IMAGE),
    is_featured: asBoolean(record.is_featured),
    seller_name: asText(record.seller_name, DEFAULT_SELLER),
    created_at: asText(record.created_at, new Date(0).toISOString()),
  };
}

export function normalizeMarketplaceListings(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((listing, index) => normalizeMarketplaceListing(listing, index))
    .filter((listing): listing is MarketplaceListing => listing !== null);
}
