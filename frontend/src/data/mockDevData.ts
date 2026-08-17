import type { ChatMessage } from '@/types/chat'
import { mockActivities } from './activities'
import { mockUsers } from './users'

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

export function markAllMockNotificationsRead() {
  mockNotifications.forEach((item) => {
    item.is_read = true
  })
}

export function markMockNotificationRead(notificationId: number) {
  const notification = mockNotifications.find((item) => item.id === notificationId)
  if (notification) notification.is_read = true
}
