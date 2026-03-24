import type { Category } from '@/types/activity';

export const categories: Category[] = [
  { id: 1, name: 'Running', slug: 'running', icon: 'zap', color: '#FF9800', is_outdoor: true },
  { id: 2, name: 'Trekking', slug: 'trekking', icon: 'mountain', color: '#7BDA96', is_outdoor: true },
  { id: 3, name: 'Festival', slug: 'festival', icon: 'music', color: '#FFC56C', is_outdoor: true },
  { id: 4, name: 'Ciclismo', slug: 'ciclismo', icon: 'bike', color: '#5B9CF6', is_outdoor: true },
  { id: 5, name: 'Kayak', slug: 'kayak', icon: 'waves', color: '#4ECDC4', is_outdoor: true },
  { id: 6, name: 'Cine', slug: 'cine', icon: 'film', color: '#FFB4AB', is_outdoor: false },
  { id: 7, name: 'Viaje', slug: 'viaje', icon: 'plane', color: '#D6C4AC', is_outdoor: true },
  { id: 8, name: 'Social', slug: 'social', icon: 'users', color: '#E1E3DA', is_outdoor: false },
  { id: 9, name: 'Deporte', slug: 'deporte', icon: 'trophy', color: '#F0A500', is_outdoor: true },
  { id: 10, name: 'Camping', slug: 'camping', icon: 'tent', color: '#7BDA96', is_outdoor: true },
  { id: 11, name: 'Surf', slug: 'surf', icon: 'waves', color: '#5B9CF6', is_outdoor: true },
];
