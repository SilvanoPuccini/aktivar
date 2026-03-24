import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, MessageCircle, UserPlus, Clock, ArrowLeft, CheckCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type AppNotification,
} from '@/services/hooks';

type NotificationType = 'join' | 'message' | 'reminder' | 'spot_opened';

interface LocalNotification {
  id: number;
  type: NotificationType;
  actor: {
    id: number;
    full_name: string;
    avatar: string;
  };
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


function mapApiToLocal(apiNotification: AppNotification): LocalNotification {
  const now = new Date();
  const created = new Date(apiNotification.created_at);
  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  let timestamp: string;
  if (diffMin < 60) {
    timestamp = `hace ${diffMin} min`;
  } else if (diffHours < 24) {
    timestamp = `hace ${diffHours}h`;
  } else if (diffDays === 1) {
    timestamp = 'ayer';
  } else {
    timestamp = `hace ${diffDays} dias`;
  }

  return {
    id: apiNotification.id,
    type: apiNotification.type,
    actor: apiNotification.actor,
    activityId: apiNotification.activity_id,
    description: apiNotification.description,
    timestamp,
    isRead: apiNotification.is_read,
  };
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
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [allMarkedRead, setAllMarkedRead] = useState(false);

  // API hooks
  const { data: apiNotifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Derive notifications from API data
  const notifications = useMemo(() => {
    if (!apiNotifications || apiNotifications.length === 0) return [];
    const base = apiNotifications.map(mapApiToLocal);
    return base.map((n) => ({
      ...n,
      isRead: allMarkedRead || readIds.has(n.id) || n.isRead,
    }));
  }, [apiNotifications, readIds, allMarkedRead]);

  const handleNotificationClick = (notification: LocalNotification) => {
    // Mark as read locally
    setReadIds((prev) => new Set(prev).add(notification.id));

    // Mark as read on the API
    markRead.mutate(notification.id);

    // Navigate based on type
    if (notification.type === 'message') {
      navigate(`/chat/${notification.activityId}`);
    } else {
      navigate(`/activity/${notification.activityId}`);
    }
  };

  const handleMarkAllRead = () => {
    setAllMarkedRead(true);
    markAllRead.mutate();
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
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1.5 text-xs font-label text-primary hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <CheckCheck size={14} />
            Marcar todo
          </button>
        )}
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} />}
          title="Sin notificaciones"
          description="Cuando alguien se una a tus actividades o te envie un mensaje, aparecera aqui."
        />
      ) : (
        <motion.div
          className="divide-y divide-outline-variant/50"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {notifications.map((notification) => {
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
                    src={notification.actor.avatar}
                    alt={notification.actor.full_name}
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
