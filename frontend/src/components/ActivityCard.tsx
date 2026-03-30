import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BadgeCheck, Calendar, MapPin } from 'lucide-react';
import type { Activity } from '@/types/activity';
import SpotsBar from './SpotsBar';
import CategoryChip from './CategoryChip';

function PriceBadge({ isFree, price }: { isFree: boolean; price: number }) {
  const label = isFree ? 'GRATIS' : `$${price.toLocaleString('es-CL')}`;
  return (
    <span className={`px-3 py-1 rounded-lg font-label text-xs font-bold ${
      isFree ? 'bg-secondary/90 text-on-secondary' : 'bg-primary-container text-on-primary-container'
    }`}>
      {label}
    </span>
  );
}

interface ActivityCardProps {
  activity: Activity;
  onClick?: () => void;
  onJoin?: () => void;
  variant?: 'feed' | 'compact';
}

export default function ActivityCard({
  activity,
  onClick,
  variant = 'feed',
}: ActivityCardProps) {
  const startDate = new Date(activity.start_datetime);
  const formattedDate = format(startDate, "d MMM · HH:mm", { locale: es });
  const spotsRemaining = activity.spots_remaining;
  const percentage = activity.capacity > 0 ? (activity.confirmed_count / activity.capacity) * 100 : 100;

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-container/60 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-headline font-bold text-sm text-on-surface truncate">{activity.title}</h3>
          <div className="mt-1 flex items-center gap-2">
            <CategoryChip category={activity.category} size="sm" />
            <span className="font-label text-xs text-muted">{formattedDate}</span>
          </div>
          <div className="mt-2">
            <SpotsBar capacity={activity.capacity} taken={activity.confirmed_count} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <article
      onClick={onClick}
      className="group bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10 hover:border-outline-variant/25 transition-all cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-44 w-full">
        <img src={activity.cover_image} alt={activity.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-surface-lowest/80 backdrop-blur-sm text-on-surface font-label text-[10px] font-bold rounded-md tracking-wider">
            {activity.category.name.toUpperCase()}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <PriceBadge isFree={activity.is_free} price={activity.price} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <h2 className="font-headline text-base font-bold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {activity.title}
        </h2>

        <div className="flex items-center gap-1.5 text-muted text-xs">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{activity.location_name}</span>
        </div>

        <div className="flex items-center gap-1.5 text-muted text-xs">
          <Calendar size={13} className="shrink-0" />
          <span>{formattedDate}</span>
        </div>

        {/* Organizer */}
        <div className="flex items-center gap-2 pt-1">
          <img
            src={activity.organizer.avatar}
            alt={activity.organizer.full_name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-xs text-on-surface-variant font-medium truncate">
            {activity.organizer.full_name}
          </span>
          {activity.organizer.is_verified_email && (
            <BadgeCheck size={12} className="text-secondary shrink-0" />
          )}
        </div>

        {/* Capacity */}
        <div className="pt-2 border-t border-outline-variant/10">
          <div className="flex justify-between text-[10px] font-label font-bold uppercase tracking-wider mb-1.5">
            <span className="text-muted">Cupos</span>
            <span className={spotsRemaining <= 5 ? 'text-error' : 'text-muted'}>
              {spotsRemaining > 0 ? `${spotsRemaining} disponibles` : 'Completo'}
            </span>
          </div>
          <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
