import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Route,
  Check,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

import CategoryChip from '@/components/CategoryChip';
import CTAButton from '@/components/CTAButton';
import VerifiedBadge from '@/components/VerifiedBadge';
import AvatarGroup from '@/components/AvatarGroup';
import SpotsBar from '@/components/SpotsBar';
import WeatherBadge from '@/components/WeatherBadge';
import EmptyState from '@/components/EmptyState';
import ActivityMap from '@/components/ActivityMap';
import { mockActivities } from '@/data/activities';
import { useActivity, useJoinActivity } from '@/services/hooks';
import { useAuthStore } from '@/stores/authStore';

const difficultyConfig: Record<string, { label: string; classes: string }> = {
  easy: { label: 'Fácil', classes: 'bg-secondary/20 text-secondary' },
  moderate: { label: 'Moderado', classes: 'bg-primary/20 text-primary' },
  hard: { label: 'Difícil', classes: 'bg-error/20 text-error' },
  expert: { label: 'Experto', classes: 'bg-error/30 text-error' },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: apiActivity } = useActivity(id);
  const joinMutation = useJoinActivity();

  // Use API data if available, fallback to mock
  const activity = useMemo(
    () => apiActivity ?? mockActivities.find((a) => a.id === Number(id)),
    [id, apiActivity],
  );

  const handleJoin = () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para unirte');
      navigate('/login');
      return;
    }
    if (!activity) return;
    joinMutation.mutate(activity.id, {
      onSuccess: () => toast.success('Te uniste a la actividad!'),
      onError: () => toast.error('No se pudo unir a la actividad'),
    });
  };

  if (!activity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <EmptyState
          title="Actividad no encontrada"
          description="La actividad que buscas no existe o fue eliminada."
          action={{ label: 'Volver al inicio', onClick: () => navigate('/') }}
        />
      </div>
    );
  }

  const startDate = new Date(activity.start_datetime);
  const endDate = new Date(activity.end_datetime);
  const formattedDate = format(startDate, "EEEE d 'de' MMMM, yyyy", { locale: es });
  const formattedTime = `${format(startDate, 'HH:mm', { locale: es })} – ${format(endDate, 'HH:mm', { locale: es })}`;
  const isFull = activity.spots_remaining <= 0;
  const almostFull = !isFull && activity.spots_remaining <= 3;
  const diff = difficultyConfig[activity.difficulty] ?? difficultyConfig.easy;
  const priceLabel = activity.is_free
    ? 'Gratis'
    : `$${activity.price.toLocaleString('es-CL')} CLP`;
  const whatToBring = activity.what_to_bring
    ? activity.what_to_bring.split(',').map((s) => s.trim())
    : [];

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: activity!.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* ---- Hero ---- */}
      <div className="relative h-72 sm:h-80 lg:h-96 overflow-hidden">
        <img
          src={activity.cover_image}
          alt={activity.title}
          className="h-full w-full object-cover"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface" />

        {/* back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-on-surface cursor-pointer"
          style={{ background: 'rgba(17,20,15,0.55)', backdropFilter: 'blur(12px)' }}
        >
          <ArrowLeft size={20} />
        </button>

        {/* share button */}
        <button
          type="button"
          onClick={handleShare}
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-on-surface cursor-pointer"
          style={{ background: 'rgba(17,20,15,0.55)', backdropFilter: 'blur(12px)' }}
        >
          <Share2 size={20} />
        </button>

        {/* category chip */}
        <div className="absolute bottom-4 left-4">
          <CategoryChip category={activity.category} size="sm" />
        </div>
      </div>

      {/* ---- Content ---- */}
      <motion.div
        className="px-4 lg:mx-auto lg:max-w-3xl lg:px-0"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="mt-4 font-display text-2xl font-bold text-on-surface sm:text-3xl"
        >
          {activity.title}
        </motion.h1>

        {/* Meta row */}
        <motion.div variants={fadeUp} className="mt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Calendar size={16} className="shrink-0 text-muted" />
            <span className="font-label text-sm capitalize">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Clock size={16} className="shrink-0 text-muted" />
            <span className="font-label text-sm">{formattedTime}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MapPin size={16} className="shrink-0 text-muted" />
            <span className="font-label text-sm">{activity.location_name}</span>
          </div>
        </motion.div>

        {/* Badges row */}
        <motion.div variants={fadeUp} className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 font-label text-xs font-semibold ${diff.classes}`}>
            {diff.label}
          </span>
          {activity.distance_km !== null && (
            <span className="flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 font-label text-xs text-muted">
              <Route size={12} />
              {activity.distance_km} km
            </span>
          )}
        </motion.div>

        {/* ---- Divider ---- */}
        <motion.div variants={fadeUp} className="my-6 h-1 rounded-full bg-surface-container" />

        {/* ---- Organizer ---- */}
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-3 rounded-xl bg-surface-container-high p-4"
        >
          <img
            src={activity.organizer.avatar}
            alt={activity.organizer.full_name}
            className="h-12 w-12 shrink-0 rounded-full border border-outline-variant object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm font-semibold text-on-surface truncate">
                {activity.organizer.full_name}
              </span>
              {activity.organizer.is_verified_email && (
                <VerifiedBadge type="email" size="sm" />
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              {activity.organizer.rating && (
                <span className="flex items-center gap-0.5 font-label text-xs text-primary">
                  <Star size={12} fill="currentColor" />
                  {activity.organizer.rating}
                </span>
              )}
              {activity.organizer.total_activities && (
                <span className="font-label text-xs text-muted">
                  {activity.organizer.total_activities} actividades organizadas
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ---- Description ---- */}
        <motion.div variants={fadeUp} className="mt-6">
          <h2 className="font-display text-lg font-semibold text-on-surface">Descripción</h2>
          <p className="mt-2 font-body text-sm leading-relaxed text-on-surface-variant">
            {activity.description}
          </p>
        </motion.div>

        {/* ---- What to Bring ---- */}
        {whatToBring.length > 0 && (
          <motion.div variants={fadeUp} className="mt-6">
            <h2 className="font-display text-lg font-semibold text-on-surface">
              Qué llevar
            </h2>
            <ul className="mt-2 flex flex-col gap-1.5">
              {whatToBring.map((item) => (
                <li key={item} className="flex items-start gap-2 text-on-surface-variant">
                  <Check size={16} className="mt-0.5 shrink-0 text-secondary" />
                  <span className="font-body text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* ---- Weather ---- */}
        {activity.category.is_outdoor && activity.weather && (
          <motion.div variants={fadeUp} className="mt-6">
            <h2 className="mb-2 font-display text-lg font-semibold text-on-surface">Clima</h2>
            <WeatherBadge
              temp={activity.weather.temp}
              description={activity.weather.description}
            />
          </motion.div>
        )}

        {/* ---- Participants ---- */}
        <motion.div variants={fadeUp} className="mt-6">
          <h2 className="font-display text-lg font-semibold text-on-surface">
            Participantes ({activity.confirmed_count}/{activity.capacity})
          </h2>

          {activity.participants_preview.length > 0 && (
            <div className="mt-3">
              <AvatarGroup users={activity.participants_preview} size="md" />
            </div>
          )}

          <div className="mt-3">
            <SpotsBar capacity={activity.capacity} taken={activity.confirmed_count} />
          </div>

          {almostFull && (
            <p className="mt-2 font-label text-xs font-semibold text-error">
              ¡Solo quedan {activity.spots_remaining} cupos!
            </p>
          )}
        </motion.div>

        {/* ---- Map ---- */}
        <motion.div variants={fadeUp} className="mt-6">
          <h2 className="mb-2 font-display text-lg font-semibold text-on-surface">
            Punto de encuentro
          </h2>
          <p className="mb-3 font-body text-sm text-on-surface-variant">
            {activity.meeting_point}
          </p>
          <div className="h-56 rounded-xl border border-outline-variant overflow-hidden">
            <ActivityMap
              activities={[]}
              singleMarker={{
                lat: activity.latitude,
                lng: activity.longitude,
                label: activity.meeting_point,
              }}
              center={[activity.latitude, activity.longitude]}
              zoom={14}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* ---- Fixed Bottom Bar ---- */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between px-4 py-3 border-t border-white/5"
        style={{
          background: 'rgba(17,20,15,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div>
          <span className="font-display text-lg font-bold text-on-surface">
            {priceLabel}
          </span>
        </div>

        {isFull ? (
          <CTAButton label="Lista de espera" variant="secondary" size="md" onClick={handleJoin} loading={joinMutation.isPending} />
        ) : (
          <CTAButton label="¡Unirme!" variant="primary" size="md" onClick={handleJoin} loading={joinMutation.isPending} />
        )}
      </div>
    </div>
  );
}
