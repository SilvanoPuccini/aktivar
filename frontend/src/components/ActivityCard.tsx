import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BadgeCheck, Star, Sun, Cloud, Calendar, Route } from 'lucide-react';
import type { Activity } from '@/types/activity';
import SpotsBar from './SpotsBar';
import CategoryChip from './CategoryChip';

/* ---------- sub-components ---------- */

function VerifiedBadge() {
  return <BadgeCheck size={14} className="text-secondary shrink-0" />;
}

function WeatherBadge({ temp, description }: { temp: number; description: string }) {
  const isCloud = description.toLowerCase().includes('nub') || description.toLowerCase().includes('cloud');
  const WeatherIcon = isCloud ? Cloud : Sun;
  return (
    <div className="bg-surface-container/80 backdrop-blur-md p-2 rounded-lg flex items-center gap-1">
      <WeatherIcon size={14} className="text-primary" />
      <span className="font-label text-xs font-bold text-[#EDE9DF]">{Math.round(temp)}°C</span>
    </div>
  );
}

function PriceBadge({ isFree, price }: { isFree: boolean; price: number }) {
  const label = isFree ? 'FREE' : `$${price.toLocaleString('es-CL')}`;
  return (
    <span className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full font-label font-bold text-sm shadow-lg">
      {label}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  for (let i = 0; i < 5; i++) {
    stars.push(
      <Star
        key={i}
        size={12}
        className="text-primary"
        fill={i < fullStars ? 'currentColor' : 'none'}
      />,
    );
  }
  return <div className="flex">{stars}</div>;
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
  const formattedDateUpper = format(startDate, "MMM dd '·' hh:mm a", { locale: es }).toUpperCase();
  const spotsRemaining = activity.spots_remaining;
  const percentage = activity.capacity > 0 ? (activity.confirmed_count / activity.capacity) * 100 : 100;

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

  /* ---- feed variant (Stitch design) ---- */
  return (
    <article
      onClick={onClick}
      className="group relative bg-surface-container rounded-[12px] overflow-hidden border border-[#2A3826] transition-all duration-300 hover:shadow-2xl cursor-pointer"
    >
      {/* cover image */}
      <div className="relative h-64 w-full">
        <img
          src={activity.cover_image}
          alt={activity.title}
          className="w-full h-full object-cover"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60" />

        {/* category badge top-left */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-primary text-on-primary font-label text-[10px] font-bold rounded-full tracking-tighter">
            {activity.category.name.toUpperCase()}
          </span>
        </div>

        {/* weather badge top-right */}
        {activity.category.is_outdoor && activity.weather && (
          <div className="absolute top-4 right-4">
            <WeatherBadge
              temp={activity.weather.temp}
              description={activity.weather.description}
            />
          </div>
        )}

        {/* price badge bottom-right */}
        <div className="absolute bottom-4 right-4">
          <PriceBadge isFree={activity.is_free} price={activity.price} />
        </div>
      </div>

      {/* body */}
      <div className="p-5 space-y-4">
        <h2 className="text-xl font-headline font-bold text-[#EDE9DF] leading-tight group-hover:text-primary transition-colors">
          {activity.title}
        </h2>

        {/* organizer row */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img
              src={activity.organizer.avatar}
              alt={activity.organizer.full_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-[#EDE9DF]">
              {activity.organizer.full_name}
              {activity.organizer.is_verified_email && (
                <VerifiedBadge />
              )}
            </p>
            <StarRating rating={activity.organizer.rating ?? 4} />
          </div>
        </div>

        {/* info grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-on-surface/60">
            <Calendar size={18} />
            <span className="text-xs font-label">{formattedDateUpper}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface/60">
            {activity.distance_km !== null && activity.distance_km !== undefined ? (
              <>
                <Route size={18} />
                <span className="text-xs font-label">{activity.distance_km} KM</span>
              </>
            ) : (
              <>
                <Route size={18} />
                <span className="text-xs font-label">{activity.location_name}</span>
              </>
            )}
          </div>
        </div>

        {/* capacity section */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-label font-bold uppercase tracking-wider">
            <span className="text-on-surface/50">Capacity</span>
            <span className={spotsRemaining <= 5 ? 'text-error' : 'text-on-surface/40'}>
              {spotsRemaining > 0 ? `${spotsRemaining} spots left` : 'Full'}
            </span>
          </div>
          <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
