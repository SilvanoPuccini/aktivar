export interface Community {
  id: number;
  name: string;
  slug: string;
  category: 'mountain' | 'water' | 'air' | 'survival' | 'road';
  tagline: string;
  description: string;
  cover_image: string;
  location_name: string;
  member_count: number;
  activity_label: string;
  cadence_label: string;
  is_featured: boolean;
  is_joined: boolean;
}

export interface JournalStory {
  id: number;
  title: string;
  slug: string;
  category_label: string;
  region_label: string;
  summary: string;
  body: string;
  author_name: string;
  cover_image: string;
  featured_quote: string;
  distance_km: number;
  elevation_m: number;
  read_time_minutes: number;
  is_featured: boolean;
  is_trending: boolean;
  published_at: string;
}

export interface MarketplaceListing {
  id: number;
  title: string;
  slug: string;
  category: 'camping' | 'climbing' | 'water_sports' | 'tech' | 'packs';
  subcategory: string;
  condition: 'new' | 'excellent' | 'good';
  price: number;
  rating: number;
  location_name: string;
  cover_image: string;
  is_featured: boolean;
  seller_name: string;
  created_at: string;
}

export interface RankBadge {
  id: number;
  name: string;
  icon: string;
  description: string;
  is_locked: boolean;
  earned_at: string | null;
}

export interface RankChallenge {
  id: number;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward_label: string;
  percent: number;
}

export interface RankDashboard {
  title: string;
  level: number;
  current_xp: number;
  next_level_xp: number;
  total_distance_km: number;
  peak_elevation_m: number;
  group_saves: number;
  next_unlock: string;
  badges: RankBadge[];
  challenges: RankChallenge[];
}

export interface SafetyStatus {
  expedition_protocol: string;
  current_location: string;
  temperature_c: number;
  wind_kmh: number;
  visibility_m: number;
  risk_level: 'green' | 'warning' | 'high';
  storm_warning: string;
  system_status: string;
  last_sync_at: string;
}

export interface SafetyChecklist {
  gear_progress: number;
  gear_target: number;
  route_status: 'completed' | 'incomplete' | 'ready';
  health_status: 'completed' | 'incomplete' | 'ready';
  permits_count: number;
  updated_at: string;
}

export interface SafetyContact {
  contact_name: string;
  contact_phone: string;
  relationship: string;
}

export interface SafetyLogEntry {
  id: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
}

export interface SafetyDashboard {
  status: SafetyStatus;
  checklist: SafetyChecklist;
  contacts: SafetyContact[];
  logs: SafetyLogEntry[];
  active_trip: { id: number; destination_name: string; origin_name: string } | null;
}
