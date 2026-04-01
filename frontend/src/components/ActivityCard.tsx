import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpRight, BadgeCheck, Calendar, MapPin } from 'lucide-react';
import type { Activity } from '@/types/activity';
import CategoryChip from './CategoryChip';
import SpotsBar from './SpotsBar';

function PriceBadge({ isFree, price }: { isFree: boolean; price: number }) {
  const label = isFree ? 'Gratis' : `$${price.toLocaleString('es-CL')}`;
  return (
    <span className="rounded-full bg-surface/80 px-3 py-1.5 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface backdrop-blur-sm">
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

export default function ActivityCard({ activity, onClick, variant = 'feed' }: ActivityCardProps) {
  const startDate = new Date(activity.start_datetime);
  const formattedDate = format(startDate, "d MMM · HH:mm", { locale: es });
  const spotsRemaining = activity.spots_remaining;

  if (variant === 'compact') {
    return (
      <button type="button" onClick={onClick} className="flex w-full items-center gap-4 p-4 text-left cursor-pointer">
        <img src={activity.cover_image} alt={activity.title} className="h-24 w-24 shrink-0 rounded-[1.15rem] object-cover" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <CategoryChip category={activity.category} size="sm" />
            <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{formattedDate}</span>
          </div>
          <h3 className="font-headline text-lg font-black uppercase leading-tight tracking-tight text-on-surface line-clamp-2">
            {activity.title}
          </h3>
          <p className="flex items-center gap-1.5 text-sm text-on-surface-variant">
            <MapPin size={14} />
            <span className="truncate">{activity.location_name}</span>
          </p>
          <SpotsBar capacity={activity.capacity} taken={activity.confirmed_count} />
        </div>
      </button>
    );
  }

  return (
    <article
      onClick={onClick}
      className="group editorial-card cursor-pointer overflow-hidden rounded-[2rem] transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[1.05] overflow-hidden rounded-[1.3rem] m-3 mb-0">
        <img src={activity.cover_image} alt={activity.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/15 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <CategoryChip category={activity.category} size="sm" />
        </div>
        <div className="absolute bottom-4 right-4">
          <PriceBadge isFree={activity.is_free} price={activity.price} />
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 md:px-6 md:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-primary">Expedición abierta</p>
            <h2 className="font-headline text-2xl font-black uppercase leading-[1.02] tracking-tight text-on-surface line-clamp-2">
              {activity.title}
            </h2>
          </div>
          <div className="rounded-full bg-surface-container-high p-2 text-on-surface-variant transition-colors group-hover:text-primary">
            <ArrowUpRight size={18} />
          </div>
        </div>

        <div className="grid gap-2 text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-primary" />
            <span className="truncate">{activity.location_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-primary" />
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src={activity.organizer.avatar} alt={activity.organizer.full_name} className="h-11 w-11 rounded-full object-cover" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-on-surface">{activity.organizer.full_name}</span>
                {activity.organizer.is_verified_email && <BadgeCheck size={14} className="shrink-0 text-secondary" />}
              </div>
              <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Host</span>
            </div>
          </div>
          <span className={`font-label text-[10px] uppercase tracking-[0.16em] ${spotsRemaining <= 3 ? 'text-error' : 'text-on-surface-variant'}`}>
            {spotsRemaining > 0 ? `${spotsRemaining} cupos` : 'Completo'}
          </span>
        </div>

        <SpotsBar capacity={activity.capacity} taken={activity.confirmed_count} />
      </div>
    </article>
  );
}
