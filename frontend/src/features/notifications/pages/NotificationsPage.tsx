import { useMemo, useState } from 'react';
import { Bell, CheckCheck, Clock, MessageCircle, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, type AppNotification } from '@/services/hooks';

type NotificationType = 'join' | 'message' | 'reminder' | 'spot_opened';
interface LocalNotification {
  id: number;
  type: NotificationType;
  actor: { id: number; full_name: string; avatar: string };
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

function mapApiToLocal(notification: AppNotification): LocalNotification {
  const created = new Date(notification.created_at);
  const diffMin = Math.max(1, Math.floor((Date.now() - created.getTime()) / 60000));
  const timestamp = diffMin < 60 ? `hace ${diffMin} min` : diffMin < 1440 ? `hace ${Math.floor(diffMin / 60)} h` : `hace ${Math.floor(diffMin / 1440)} días`;
  return {
    id: notification.id,
    type: notification.type,
    actor: notification.actor,
    activityId: notification.activity_id,
    description: notification.description,
    timestamp,
    isRead: notification.is_read,
  };
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [markAllState, setMarkAllState] = useState(false);
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const notifications = useMemo(() => (data ?? []).map(mapApiToLocal).map((notification) => ({ ...notification, isRead: notification.isRead || markAllState || readIds.has(notification.id) })), [data, markAllState, readIds]);
  const unread = notifications.filter((notification) => !notification.isRead).length;

  const handleClick = (notification: LocalNotification) => {
    setReadIds((prev) => new Set(prev).add(notification.id));
    markRead.mutate(notification.id);
    navigate(notification.type === 'message' ? `/chat/${notification.activityId}` : `/activity/${notification.activityId}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <section className="editorial-card rounded-[2.25rem] px-6 py-8 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">Inbox</p>
            <h1 className="hero-title text-4xl text-on-surface md:text-6xl">Notificaciones</h1>
            <p className="mt-3 text-on-surface-variant">Actividad reciente, mensajes y movimientos de cupos en una vista más clara.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-[1.2rem] bg-surface px-5 py-4 text-center">
              <p className="section-kicker">Unread</p>
              <p className="mt-2 font-headline text-3xl font-black text-primary">{unread}</p>
            </div>
            {unread > 0 && <button type="button" onClick={() => { setMarkAllState(true); markAll.mutate(); }} className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-3 font-label text-[10px] uppercase tracking-[0.16em] text-primary cursor-pointer"><CheckCheck size={14} /> Marcar todo</button>}
          </div>
        </div>
      </section>

      {notifications.length === 0 ? (
        <EmptyState title="Sin notificaciones" description="Cuando pase algo importante en tu actividad o chat, aparecerá aquí." />
      ) : (
        <section className="space-y-4">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type];
            return (
              <button key={notification.id} type="button" onClick={() => handleClick(notification)} className={`flex w-full items-start gap-4 rounded-[1.75rem] border px-5 py-5 text-left cursor-pointer transition ${notification.isRead ? 'border-outline-variant/10 bg-surface-container' : 'border-primary/20 bg-surface-container-high shadow-[0_18px_40px_rgba(0,0,0,0.15)]'}`}>
                <div className="relative shrink-0">
                  <img src={notification.actor.avatar} alt={notification.actor.full_name} className="h-14 w-14 rounded-[1rem] object-cover" />
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[#442c00]"><Icon size={12} /></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label text-[10px] uppercase tracking-[0.16em] text-primary">{notification.actor.full_name}</p>
                  <p className={`${notification.isRead ? 'text-on-surface-variant' : 'text-on-surface'} text-sm leading-relaxed`}>{notification.description}</p>
                  <p className="mt-2 font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{notification.timestamp}</p>
                </div>
                {!notification.isRead && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
}
