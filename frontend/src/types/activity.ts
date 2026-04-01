export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  is_outdoor: boolean;
}

export interface ActivityOrganizer {
  id: number;
  full_name: string;
  avatar: string;
  is_verified_email: boolean;
  total_activities?: number;
  rating?: number;
}

export interface ActivityParticipant {
  id: number;
  user: {
    id: number;
    full_name: string;
    avatar: string;
  };
  status: 'pending' | 'confirmed' | 'waitlisted' | 'cancelled';
  is_revealed: boolean;
  joined_at: string;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  category: Category;
  cover_image: string;
  organizer: ActivityOrganizer;
  location_name: string;
  latitude: number;
  longitude: number;
  meeting_point: string;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
  price: number;
  is_free: boolean;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  difficulty: 'easy' | 'moderate' | 'hard' | 'expert';
  distance_km: number | null;
  what_to_bring: string;
  spots_remaining: number;
  confirmed_count: number;
  participants_preview: { id: number; full_name: string; avatar: string }[];
  participants?: ActivityParticipant[];
  weather?: {
    temp: number;
    description: string;
    icon: string;
  };
  created_at: string;
  updated_at?: string;
}

export type ActivityStatus = Activity['status'];
export type Difficulty = Activity['difficulty'];
