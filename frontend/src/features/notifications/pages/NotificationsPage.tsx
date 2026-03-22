import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, MessageCircle, UserPlus, Clock, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { mockUsers } from '@/data/users';
import { mockActivities } from '@/data/activities';
import EmptyState from '@/components/EmptyState';

type NotificationType = 'join' | 'message' | 'reminder' | 'spot_opened';

interface Notification {
  id: number;
  type: NotificationType;
  actorId: number;
  activityId: number;
  description: string;
  timestamp: string;
  isRead: boolean;
}

const notificationIcons: Record<NotificationType, LucideIcon> = {
  join: UserPlus,
  message: MessageCircle,
  reminder: Clock,
  spot_opened: Bell,
};

const notificationColors: Record<NotificationType, string> = {
  join: 'text-secondary',
  message: 'text-primary',
  reminder: 'text-on-surface-variant',
  spot_opened: 'text-primary',
};

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'join',
    actorId: mockUsers[2].id,
    activityId: mockActivities[0].id,
    description: `${mockUsers[2].full_name} se unió a ${mockActivities[0].title}`,
    timestamp: 'hace 15 min',
    isRead: false,
  },
  {
    id: 2,
    type: 'message',
    actorId: mockUsers[1].id,
    activityId: mockActivities[0].id,
    description: `${mockUsers[1].full_name} envió un mensaje en ${mockActivities[0].title}`,
    timestamp: 'hace 1h',
    isRead: false,
  },
  {
    id: 3,
    type: 'reminder',
    actorId: mockUsers[0].id,
    activityId: mockActivities[0].id,
    description: `${mockActivities[0].title} comienza mañana a las 7:00`,
    timestamp: 'hace 2h',
    isRead: false,
  },
  {
    id: 4,
    type: 'join',
    actorId: mockUsers[4].id,
    activityId: mockActivities[5].id,
    description: `${mockUsers[4].full_name} se unió a ${mockActivities[5].title}`,
    timestamp: 'hace 3h',
    isRead: true,
  },
  {
    id: 5,
    type: 'spot_opened',
    actorId: mockUsers[3].id,
    activityId: mockActivities[1].id,
    description: `Se abrió un cupo en ${mockActivities[1].title}`,
    timestamp: 'hace 5h',
    isRead: true,
  },
  {
    id: 6,
    type: 'message',
    actorId: mockUsers[5].id,
    activityId: mockActivities[0].id,
    description: `${mockUsers[5].full_name} respondió en el chat de ${mockActivities[0].title}`,
    timestamp: 'ayer',
    isRead: true,
  },
  {
    id: 7,
    type: 'join',
    actorId: mockUsers[8].id,
    activityId: mockActivities[5].id,
    description: `${mockUsers[8].full_name} se unió a ${mockActivities[5].title}`,
    timestamp: 'ayer',
    isRead: true,
  },
  {
    id: 8,
    type: 'reminder',
    actorId: mockUsers[0].id,
    activityId: mockActivities[1].id,
    description: `No olvides confirmar tu asistencia a ${mockActivities[1].title}`,
    timestamp: 'hace 2 días',
    isRead: true,
  },
  {
    id: 9,
    type: 'spot_opened',
    actorId: mockUsers[6].id,
    activityId: mockActivities[7].id,
    description: `Se abrieron 3 cupos en ${mockActivities[7].title}`,
    timestamp: 'hace 3 días',
    isRead: true,
  },
  {
    id: 10,
    type: 'message',
    actorId: mockUsers[7].id,
    activityId: mockActivities[1].id,
    description: `${mockUsers[7].full_name} compartió la ubicación en ${mockActivities[1].title}`,
    timestamp: 'hace 4 días',
    isRead: true,
  },
];

function getActorById(id: number) {
  return mockUsers.find((u) => u.id === id) ?? mockUsers[0];
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
    );

    // Navigate based on type
    if (notification.type === 'message') {
      navigate(`/chat/${notification.activityId}`);
    } else {
      navigate(`/activity/${notification.activityId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b border-outline-variant"
        style={{
          background: 'rgba(17,20,15,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-on-surface">
            Notificaciones
          </h1>
          {unreadCount > 0 && (
            <p className="font-label text-xs text-muted">
              {unreadCount} sin leer
            </p>
          )}
        </div>
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} />}
          title="Sin notificaciones"
          description="Cuando alguien se una a tus actividades o te envíe un mensaje, aparecerá aquí."
        />
      ) : (
        <motion.div
          className="divide-y divide-outline-variant/50"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {notifications.map((notification) => {
            const actor = getActorById(notification.actorId);
            const Icon = notificationIcons[notification.type];
            const iconColor = notificationColors[notification.type];

            return (
              <motion.button
                key={notification.id}
                type="button"
                variants={itemVariants}
                onClick={() => handleNotificationClick(notification)}
                className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors cursor-pointer hover:bg-surface-container/50 ${
                  !notification.isRead ? 'bg-surface-container/30' : ''
                }`}
              >
                {/* Avatar with icon badge */}
                <div className="relative shrink-0">
                  <img
                    src={actor.avatar}
                    alt={actor.full_name}
                    className="h-11 w-11 rounded-full object-cover border border-outline-variant"
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-high border border-outline-variant ${iconColor}`}
                  >
                    <Icon size={11} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-body text-sm leading-snug ${
                      notification.isRead ? 'text-on-surface-variant' : 'text-on-surface'
                    }`}
                  >
                    {notification.description}
                  </p>
                  <p className="font-label text-xs text-muted mt-1">
                    {notification.timestamp}
                  </p>
                </div>

                {/* Unread dot */}
                {!notification.isRead && (
                  <div className="mt-2 shrink-0">
                    <span className="block h-2.5 w-2.5 rounded-full bg-primary" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
