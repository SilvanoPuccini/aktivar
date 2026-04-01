import type { ChatMessage } from '@/types/chat'
import type { Community, JournalStory, MarketplaceListing, RankDashboard, SafetyDashboard } from '@/types/ecosystem'
import { mockActivities } from './activities'
import { mockUsers } from './users'

export const mockCommunities: Community[] = [
  {
    id: 1,
    name: 'Andes Sunrise Club',
    slug: 'andes-sunrise-club',
    category: 'mountain',
    tagline: 'Amaneceres de altura con operación cuidada.',
    description: 'Crew enfocada en salidas de montaña con briefing serio, pacing claro y logística compartida para cada ascenso.',
    cover_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=900&fit=crop',
    location_name: 'Bariloche, Argentina',
    member_count: 482,
    activity_label: 'Alpinismo + trekking',
    cadence_label: 'Weekly ops',
    is_featured: true,
    is_joined: false,
  },
  {
    id: 2,
    name: 'Pacific Wave Patrol',
    slug: 'pacific-wave-patrol',
    category: 'water',
    tagline: 'Surf y agua fría con mejor coordinación.',
    description: 'Comunidad para sesiones costeras, chequeos de swell y logística compartida hacia spots del Pacífico sur.',
    cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=900&fit=crop',
    location_name: 'Pichilemu, Chile',
    member_count: 318,
    activity_label: 'Surf + rescue basics',
    cadence_label: 'Twice a week',
    is_featured: false,
    is_joined: false,
  },
  {
    id: 3,
    name: 'Ruta Austral Riders',
    slug: 'ruta-austral-riders',
    category: 'road',
    tagline: 'Road miles with stronger crew culture.',
    description: 'Ciclistas y overlanders que coordinan tramos, clima, paradas y soporte entre Patagonia y la cordillera.',
    cover_image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&h=900&fit=crop',
    location_name: 'Coyhaique, Chile',
    member_count: 229,
    activity_label: 'Bikepacking + road',
    cadence_label: 'Open rotation',
    is_featured: false,
    is_joined: false,
  },
]

export const mockJournalStories: JournalStory[] = [
  {
    id: 1,
    title: 'Dawn push above Catedral',
    slug: 'dawn-push-above-catedral',
    category_label: 'Mountain journal',
    region_label: 'Bariloche',
    summary: 'Un ascenso editorial sobre ritmo, frío temprano y equipo pequeño tomando decisiones precisas antes del amanecer.',
    body: 'La ventana se abría por pocas horas. El equipo salió ligero, con radio check, pacing corto y una lectura del terreno que convirtió la subida en una operación limpia y memorable.',
    author_name: 'Catalina Reyes',
    cover_image: 'https://images.unsplash.com/photo-1508261305436-4de2c4b9d2b0?w=1400&h=900&fit=crop',
    featured_quote: 'Subir temprano no era épica vacía: era la forma correcta de llegar bien.',
    distance_km: 14,
    elevation_m: 1180,
    read_time_minutes: 7,
    is_featured: true,
    is_trending: true,
    published_at: '2026-03-26T09:00:00Z',
  },
  {
    id: 2,
    title: 'Basecamp discipline on the Patagonian wind line',
    slug: 'basecamp-discipline-patagonian-wind-line',
    category_label: 'Field notes',
    region_label: 'Patagonia',
    summary: 'Cómo un campamento bien operado cambia el ánimo, la seguridad y la lectura del terreno cuando entra el viento fuerte.',
    body: 'Cada carpa, cada corte de cocina y cada check de capas aportó a una sensación de control que permitió seguir disfrutando incluso cuando el clima cambió el tono de la expedición.',
    author_name: 'Valentina Silva',
    cover_image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1400&h=900&fit=crop',
    featured_quote: 'La estética del campamento también era seguridad.',
    distance_km: 9,
    elevation_m: 420,
    read_time_minutes: 5,
    is_featured: false,
    is_trending: true,
    published_at: '2026-03-23T11:30:00Z',
  },
  {
    id: 3,
    title: 'Three hours of Pacific swell and zero wasted motion',
    slug: 'three-hours-pacific-swell-zero-wasted-motion',
    category_label: 'Water dispatch',
    region_label: 'Pichilemu',
    summary: 'Una sesión corta, táctica y ordenada donde el mar exigió foco y lectura compartida.',
    body: 'Entre sets rápidos y viento lateral, el grupo sostuvo una comunicación limpia y una rotación de entrada que hizo sentir la sesión más seria y más disfrutable.',
    author_name: 'Santiago Herrera',
    cover_image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1400&h=900&fit=crop',
    featured_quote: 'No se trataba de aguantar más, sino de leer mejor.',
    distance_km: 4,
    elevation_m: 0,
    read_time_minutes: 4,
    is_featured: false,
    is_trending: true,
    published_at: '2026-03-20T15:00:00Z',
  },
]

export const mockMarketplaceListings: MarketplaceListing[] = [
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
    cover_image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=900&fit=crop',
    is_featured: true,
    seller_name: 'Catalina Reyes',
    created_at: '2026-03-25T12:00:00Z',
  },
  {
    id: 102,
    title: 'Carbon Trekking Poles',
    slug: 'carbon-trekking-poles',
    category: 'climbing',
    subcategory: 'Summit support',
    condition: 'good',
    price: 89000,
    rating: 4.7,
    location_name: 'Santiago',
    cover_image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&h=900&fit=crop',
    is_featured: false,
    seller_name: 'Andrés Martínez',
    created_at: '2026-03-24T09:30:00Z',
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
    cover_image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&h=900&fit=crop',
    is_featured: false,
    seller_name: 'Valentina Silva',
    created_at: '2026-03-27T08:10:00Z',
  },
]

export const mockRankDashboard: RankDashboard = {
  title: 'Andes Expedition Lead',
  level: 12,
  current_xp: 1840,
  next_level_xp: 2200,
  total_distance_km: 1460,
  peak_elevation_m: 3650,
  group_saves: 8,
  next_unlock: 'Glacier operations badge',
  badges: [
    { id: 1, name: 'Route Builder', icon: 'compass', description: 'Planned multi-stop expeditions.', is_locked: false, earned_at: '2026-01-11T10:00:00Z' },
    { id: 2, name: 'Safety Lead', icon: 'shield', description: 'Closed pre-ex safety loops.', is_locked: false, earned_at: '2026-02-05T12:00:00Z' },
    { id: 3, name: 'Night Mover', icon: 'moon', description: 'Completed overnight missions.', is_locked: false, earned_at: '2026-02-22T12:00:00Z' },
    { id: 4, name: 'Crew Mentor', icon: 'users', description: 'Led first-time explorers.', is_locked: true, earned_at: null },
  ],
  challenges: [
    { id: 1, title: 'Bariloche logistics sprint', description: 'Completa 3 salidas con checklist completo.', progress: 2, target: 3, reward_label: '120 XP', percent: 67 },
    { id: 2, title: 'Marketplace prep', description: 'Publica una pieza clave de gear.', progress: 0, target: 1, reward_label: 'Seller crest', percent: 0 },
  ],
}

export const mockSafetyDashboard: SafetyDashboard = {
  status: {
    expedition_protocol: 'Cold-front readiness',
    current_location: 'Paso del Viento',
    temperature_c: 4,
    wind_kmh: 36,
    visibility_m: 900,
    risk_level: 'warning',
    storm_warning: 'Wind gusts rising after 16:00. Keep turnaround discipline and radio windows every 20 minutes.',
    system_status: 'Nominal',
    last_sync_at: '2026-04-01T15:42:00Z',
  },
  checklist: {
    gear_progress: 8,
    gear_target: 10,
    route_status: 'ready',
    health_status: 'incomplete',
    permits_count: 3,
    updated_at: '2026-04-01T15:35:00Z',
  },
  contacts: [
    { contact_name: 'Parque Nacional Ops', contact_phone: '+54 294 555 0101', relationship: 'Ranger desk' },
    { contact_name: 'Catalina Reyes', contact_phone: '+56 9 1234 5678', relationship: 'Trip lead' },
    { contact_name: 'Basecamp Medical', contact_phone: '+54 294 555 0199', relationship: 'Medical support' },
  ],
  logs: [
    { id: 1, message: 'Wind line updated after noon weather pull.', severity: 'warning', created_at: '2026-04-01T14:20:00Z' },
    { id: 2, message: 'Primary route brief acknowledged by entire crew.', severity: 'info', created_at: '2026-04-01T13:05:00Z' },
  ],
  active_trip: { id: 2, origin_name: 'Bariloche basecamp', destination_name: 'Paso del Viento' },
}

export const mockNotifications = [
  {
    id: 1,
    type: 'message' as const,
    actor: { id: mockUsers[1].id, full_name: mockUsers[1].full_name, avatar: mockUsers[1].avatar },
    activity_id: mockActivities[0].id,
    description: 'Matías dejó una actualización de horario para la salida de mañana.',
    created_at: '2026-04-01T15:20:00Z',
    is_read: false,
  },
  {
    id: 2,
    type: 'join' as const,
    actor: { id: mockUsers[2].id, full_name: mockUsers[2].full_name, avatar: mockUsers[2].avatar },
    activity_id: mockActivities[5].id,
    description: 'Valentina se sumó a tu expedición de camping.',
    created_at: '2026-04-01T11:10:00Z',
    is_read: false,
  },
]

export const mockOrganizerDashboard = {
  total_activities: 12,
  by_status: { published: 4, completed: 8 },
  participants: { total: 128, unique: 84 },
  revenue: { total: 1540000, fees: 138000, payout: 1402000 },
  ratings: { average: 4.9, total_reviews: 46 },
  recent_activities: [
    { id: mockActivities[0].id, title: mockActivities[0].title, status: 'confirmed', start_datetime: mockActivities[0].start_datetime, capacity: mockActivities[0].capacity, confirmed: mockActivities[0].confirmed_count },
    { id: mockActivities[5].id, title: mockActivities[5].title, status: 'briefing', start_datetime: mockActivities[5].start_datetime, capacity: mockActivities[5].capacity, confirmed: mockActivities[5].confirmed_count },
    { id: mockActivities[2].id, title: mockActivities[2].title, status: 'completed', start_datetime: mockActivities[2].start_datetime, capacity: mockActivities[2].capacity, confirmed: mockActivities[2].confirmed_count },
  ],
}

export const mockChatMessages: ChatMessage[] = [
  {
    id: 1,
    author: { id: mockUsers[1].id, full_name: mockUsers[1].full_name, avatar: mockUsers[1].avatar },
    content: 'Equipo, adelantamos salida 20 minutos para ganar ventana de clima.',
    message_type: 'text',
    created_at: '2026-04-01T14:00:00Z',
    reactions: [],
  },
  {
    id: 2,
    author: { id: mockUsers[0].id, full_name: mockUsers[0].full_name, avatar: mockUsers[0].avatar },
    content: 'Recibido. Llevo el briefing final y el chequeo de radios.',
    message_type: 'text',
    created_at: '2026-04-01T14:03:00Z',
    reactions: [],
  },
]

export function joinMockCommunity(communityId: number) {
  const community = mockCommunities.find((item) => item.id === communityId)
  if (!community) throw new Error('Community not found')
  community.is_joined = true
  community.member_count += 1
  return community
}

export function createMockMarketplaceListing(payload: Partial<MarketplaceListing>) {
  const listing: MarketplaceListing = {
    id: Date.now(),
    title: payload.title ?? 'Untitled listing',
    slug: String(payload.title ?? 'listing').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    category: payload.category ?? 'camping',
    subcategory: payload.subcategory ?? 'General gear',
    condition: payload.condition ?? 'excellent',
    price: payload.price ?? 0,
    rating: 5,
    location_name: payload.location_name ?? 'Bariloche',
    cover_image: payload.cover_image ?? 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=900&fit=crop',
    is_featured: false,
    seller_name: mockUsers[0].full_name,
    created_at: new Date().toISOString(),
  }
  mockMarketplaceListings.unshift(listing)
  return listing
}

export function updateMockSafetyChecklist(payload: Partial<SafetyDashboard['checklist']>) {
  mockSafetyDashboard.checklist = { ...mockSafetyDashboard.checklist, ...payload, updated_at: new Date().toISOString() }
  return mockSafetyDashboard.checklist
}

export function markAllMockNotificationsRead() {
  mockNotifications.forEach((item) => {
    item.is_read = true
  })
}

export function markMockNotificationRead(notificationId: number) {
  const notification = mockNotifications.find((item) => item.id === notificationId)
  if (notification) notification.is_read = true
}
