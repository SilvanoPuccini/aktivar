import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CloudSun, BadgeCheck } from 'lucide-react';
import type { Activity } from '@/types/activity';
import SpotsBar from './SpotsBar';
import CategoryChip from './CategoryChip';

/* ---------- sub-components inlined for pieces not yet extracted ---------- */

function VerifiedBadge() {
  return <BadgeCheck size={14} className="text-secondary shrink-0" />;
}

function WeatherBadge({ temp, description }: { temp: number; description: string }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-container/80 px-2 py-0.5 text-xs font-[Space_Grotesk] text-on-surface-variant backdrop-blur-md">
      <CloudSun size={12} />
      <span>{Math.round(temp)}°</span>
      <span className="hidden sm:inline">{description}</span>
    </div>
  );
}

function PriceBadge({ isFree, price }: { isFree: boolean; price: number }) {
  const label = isFree
    ? 'Gratis'
    : `$${price.toLocaleString('es-CL')}`;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold font-[Space_Grotesk] ${
        isFree
          ? 'bg-secondary/90 text-[#0b2914]'
          : 'bg-primary-container/90 text-[#442c00]'
      }`}
    >
      {label}
    </span>
  );
}

/* ---------- main component ---------- */

interface ActivityCardProps {
  activity: Activity;
  onClick?: () => void;
  onJoin?: () => void;
  variant?: 'feed' | 'compact';
}

export default function ActivityCard({
  activity,
  onClick,
  onJoin,
  variant = 'feed',
}: ActivityCardProps) {
  const startDate = new Date(activity.start_datetime);
  const formattedDate = format(startDate, "EEE d MMM · HH:mm", { locale: es });
  const urgency = activity.spots_remaining > 0 && activity.spots_remaining <= 3;

  /* ---- compact variant ---- */
  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onClick}
        className="flex items-center gap-3 rounded-xl bg-surface-container p-3 cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-[Epilogue] font-bold text-sm text-on-surface truncate">
            {activity.title}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <CategoryChip
              category={activity.category}
              size="sm"
            />
            <span className="font-[Space_Grotesk] text-xs text-muted">
              {formattedDate}
            </span>
          </div>
          <div className="mt-2">
            <SpotsBar
              capacity={activity.capacity}
              taken={activity.confirmed_count}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  /* ---- feed variant (default) ---- */
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="rounded-xl bg-surface-container overflow-hidden cursor-pointer"
      style={{
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      {/* cover image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={activity.cover_image}
          alt={activity.title}
          className="h-full w-full object-cover"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent" />

        {/* overlays */}
        <div className="absolute top-3 left-3">
          <CategoryChip category={activity.category} size="sm" />
        </div>

        {activity.category.is_outdoor && activity.weather && (
          <div className="absolute top-3 right-3">
            <WeatherBadge
              temp={activity.weather.temp}
              description={activity.weather.description}
            />
          </div>
        )}

        <div className="absolute bottom-3 right-3">
          <PriceBadge isFree={activity.is_free} price={activity.price} />
        </div>
      </div>

      {/* body */}
      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-[Epilogue] font-bold text-base text-on-surface leading-snug">
          {activity.title}
        </h3>

        <span className="font-[Space_Grotesk] text-xs text-muted">
          {activity.location_name}
        </span>

        <span className="font-[Space_Grotesk] text-xs text-on-surface-variant">
          {formattedDate}
        </span>

        {/* organizer row */}
        <div className="flex items-center gap-2 mt-1">
          <img
            src={activity.organizer.avatar}
            alt={activity.organizer.full_name}
            className="w-6 h-6 rounded-full object-cover border border-outline-variant"
          />
          <span className="font-[Plus_Jakarta_Sans] text-xs text-on-surface-variant">
            {activity.organizer.full_name}
          </span>
          {activity.organizer.is_verified_email && <VerifiedBadge />}
        </div>

        {/* spots */}
        <div className="mt-1">
          <SpotsBar
            capacity={activity.capacity}
            taken={activity.confirmed_count}
          />
        </div>

        {urgency && (
          <span className="self-start rounded-full bg-error/15 px-2.5 py-0.5 text-xs font-semibold font-[Space_Grotesk] text-error">
            ¡{activity.spots_remaining} cupos!
          </span>
        )}

        {onJoin && activity.spots_remaining > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onJoin();
            }}
            className="mt-1 self-end rounded-full px-4 py-1.5 text-xs font-semibold font-[Space_Grotesk] uppercase tracking-wider text-[#442c00] cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #ffc56c, #f0a500)',
            }}
          >
            Unirme
          </button>
        )}
      </div>
    </motion.div>
  );
}
