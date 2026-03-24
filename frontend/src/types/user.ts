export interface UserProfile {
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  bio_extended: string;
  website: string;
  instagram: string;
  total_activities: number;
  total_km: number;
  total_people_met: number;
  avg_rating?: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned_at: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar: string;
  bio: string;
  phone: string;
  role: 'user' | 'organizer' | 'driver';
  is_verified_email: boolean;
  is_verified_phone: boolean;
  profile: UserProfile;
  created_at: string;
}

export interface DriverProfile {
  license_number: string;
  license_photo: string;
  license_expiry: string;
  is_verified_driver: boolean;
  driver_rating: number;
  total_trips: number;
}
