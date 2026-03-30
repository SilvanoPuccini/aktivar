import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, MessageCircle, UserPlus, Clock, CheckCheck } from 'lucide-react';
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

  const { data: apiNotifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = useMemo(() => {
    if (!apiNotifications || apiNotifications.length === 0) return [];
    const base = apiNotifications.map(mapApiToLocal);
    return base.map((n) => ({
      ...n,
      isRead: allMarkedRead || readIds.has(n.id) || n.isRead,
    }));
  }, [apiNotifications, readIds, allMarkedRead]);

  const handleNotificationClick = (notification: LocalNotification) => {
    setReadIds((prev) => new Set(prev).add(notification.id));
    markRead.mutate(notification.id);

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
    <div className="min-h-[60vh] bg-surface pb-28 md:pb-12">
      {/* Page header */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl md:text-3xl font-black tracking-tight text-on-surface">
              Notificaciones
            </h1>
            {unreadCount > 0 && (
              <p className="font-label text-sm text-muted mt-1">
                {unreadCount} sin leer
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 rounded-xl bg-surface-container-high/60 px-4 py-2.5 text-sm font-label font-medium text-primary hover:bg-surface-container-highest transition-colors cursor-pointer border border-outline-variant/10"
            >
              <CheckCheck size={16} />
              Marcar todo
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        {notifications.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Bell size={48} />}
              title="Sin notificaciones"
              description="Cuando alguien se una a tus actividades o te envie un mensaje, aparecera aqui."
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-outline-variant/10 overflow-hidden bg-surface-container/30">
            <motion.div
              className="divide-y divide-outline-variant/10"
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
                    className={`flex w-full items-start gap-4 px-5 md:px-6 py-5 text-left transition-colors cursor-pointer hover:bg-surface-container/50 ${
                      !notification.isRead ? 'bg-primary/3' : ''
                    }`}
                  >
                    {/* Avatar with icon badge */}
                    <div className="relative shrink-0">
                      <img
                        src={notification.actor.avatar}
                        alt={notification.actor.full_name}
                        className="h-12 w-12 rounded-xl object-cover border border-outline-variant/15"
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-high border-2 border-surface ${iconColor}`}
                      >
                        <Icon size={11} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-body text-sm leading-relaxed ${
                          notification.isRead ? 'text-on-surface-variant' : 'text-on-surface'
                        }`}
                      >
                        {notification.description}
                      </p>
                      <p className="font-label text-xs text-muted mt-1.5">
                        {notification.timestamp}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!notification.isRead && (
                      <div className="mt-3 shrink-0">
                        <span className="block h-2.5 w-2.5 rounded-full bg-primary" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
