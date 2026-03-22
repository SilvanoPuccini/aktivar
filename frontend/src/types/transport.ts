export interface Vehicle {
  id: number;
  brand: string;
  model_name: string;
  color: string;
  plate: string;
  capacity: number;
  photo: string;
  year: number | null;
}

export interface TripStop {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  estimated_time: string | null;
}

export interface TripPassenger {
  id: number;
  user: {
    id: number;
    full_name: string;
    avatar: string;
  };
  pickup_stop: TripStop | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  paid: boolean;
  booked_at: string;
}

export interface TripDriver {
  id: number;
  full_name: string;
  avatar: string;
  driver_rating: number;
  total_trips: number;
  is_verified_driver: boolean;
}

export interface Trip {
  id: number;
  driver: TripDriver;
  vehicle: Vehicle;
  activity: { id: number; title: string } | null;
  origin_name: string;
  origin_latitude: number;
  origin_longitude: number;
  destination_name: string;
  destination_latitude: number;
  destination_longitude: number;
  departure_time: string;
  estimated_arrival: string | null;
  price_per_passenger: number;
  available_seats: number;
  seats_taken: number;
  seats_remaining: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  notes: string;
  stops: TripStop[];
  passengers: TripPassenger[];
}
