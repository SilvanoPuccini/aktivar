import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Share2,
  Heart,
  Calendar,
  Clock,
  MapPin,
  Route,
  Check,
  Star,
  ChevronRight,
  Car,
  Users,
  Mountain,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

import WeatherBadge from '@/components/WeatherBadge';
import EmptyState from '@/components/EmptyState';
import ActivityMap from '@/components/ActivityMap';
import { useActivity, useJoinActivity } from '@/services/hooks';
import { useAuthStore } from '@/stores/authStore';

const difficultyConfig: Record<string, { label: string; classes: string }> = {
  easy: { label: 'Fácil', classes: 'bg-secondary text-on-secondary' },
  moderate: { label: 'Moderado', classes: 'bg-primary text-on-primary' },
  hard: { label: 'Difícil', classes: 'bg-error text-on-error' },
  expert: { label: 'Experto', classes: 'bg-error text-on-error' },
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

  const activity = apiActivity ?? null;

  const handleJoin = () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para unirte');
      navigate('/login');
      return;
    }
    if (!activity) return;
    joinMutation.mutate(activity.id, {
      onSuccess: () => toast.success('Te uniste a la actividad!'),
      onError: (err) => {
        const axiosErr = err as AxiosError<{ detail?: string }>;
        toast.error(axiosErr.response?.data?.detail ?? 'No se pudo unir a la actividad');
      },
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
  const departureTime = format(startDate, 'HH:mm', { locale: es });
  const isFull = activity.spots_remaining <= 0;
  const almostFull = !isFull && activity.spots_remaining <= 3;
  const diff = difficultyConfig[activity.difficulty] ?? difficultyConfig.easy;
  const priceLabel = activity.is_free
    ? 'Gratis'
    : `$${activity.price.toLocaleString('es-CL')}`;
  const whatToBring = activity.what_to_bring
    ? activity.what_to_bring.split(',').map((s) => s.trim())
    : [];

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: activity!.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado');
    }
  }

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* ---- Header ---- */}
      <header className="sticky top-0 w-full z-50 border-b border-outline-variant/10" style={{ background: 'rgba(12,15,10,0.92)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}>
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 md:px-8 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
            <span className="hidden md:inline text-sm font-medium">Volver</span>
          </button>
          <div className="flex items-center gap-2">
            <Mountain size={18} className="text-primary" />
            <span className="text-lg font-headline font-black text-on-surface tracking-tighter">Aktivar</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface/60 hover:bg-surface-container/50 hover:text-primary transition-all cursor-pointer"
            >
              <Share2 size={18} />
            </button>
            <button
              type="button"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface/60 hover:bg-surface-container/50 hover:text-error transition-all cursor-pointer"
            >
              <Heart size={18} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ---- Hero Section ---- */}
        <section className="relative h-72 sm:h-96 lg:h-[480px] w-full overflow-hidden">
          <img
            src={activity.cover_image}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-8 pb-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex gap-2 mb-4">
                <span
                  className={`${diff.classes} px-4 py-1.5 rounded-full font-label text-xs uppercase tracking-widest font-bold`}
                >
                  {diff.label}
                </span>
                {activity.distance_km !== null && (
                  <span className="bg-surface-container-highest/80 backdrop-blur text-primary px-4 py-1.5 rounded-full font-label text-xs uppercase tracking-widest font-bold">
                    {activity.distance_km} KM
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-headline font-black text-on-surface leading-tight tracking-tighter max-w-3xl">
                {activity.title}
              </h1>
              {activity.category?.name && (
                <span className="inline-block mt-2 text-xl md:text-2xl font-headline font-bold text-primary-container">
                  {activity.category.name}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ---- Content Area ---- */}
        <motion.div
          className="px-6 md:px-8 -mt-4 relative z-10 max-w-6xl mx-auto"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
            {/* ---- Main Content (2/3) ---- */}
            <div className="lg:col-span-2 space-y-8">
              {/* Organizer Card */}
              <motion.div
                variants={fadeUp}
                className="bg-surface-container/60 rounded-2xl p-6 md:p-8 border border-outline-variant/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={activity.organizer.avatar}
                        alt={activity.organizer.full_name}
                        className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover"
                      />
                      {activity.organizer.is_verified_email && (
                        <div className="absolute -bottom-1 -right-1 bg-primary p-1 rounded-lg">
                          <Check size={12} className="text-on-primary" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg text-on-surface">
                        {activity.organizer.full_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant font-label">
                        {activity.organizer.rating && (
                          <span className="flex items-center gap-0.5 text-primary-container">
                            <Star size={14} fill="currentColor" />
                            {activity.organizer.rating}
                          </span>
                        )}
                        {activity.organizer.total_activities && (
                          <>
                            <span>•</span>
                            <span>{activity.organizer.total_activities} Actividades</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="bg-surface-container-highest text-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-surface-bright transition-colors cursor-pointer border border-outline-variant/10"
                  >
                    Seguir
                  </button>
                </div>
                {activity.description && (
                  <p className="text-on-surface-variant leading-relaxed text-sm">
                    {activity.description.slice(0, 200)}
                    {activity.description.length > 200 ? '...' : ''}
                  </p>
                )}
              </motion.div>

              {/* The Experience */}
              <motion.div variants={fadeUp} className="space-y-4">
                <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface">
                  La Experiencia
                </h2>
                <div className="bg-surface-container-low rounded-2xl p-6 md:p-8 space-y-6">
                  <p className="text-on-surface-variant leading-relaxed">
                    {activity.description}
                  </p>

                  <div className="pt-4 border-t border-outline-variant/10">
                    <span className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">
                      Equipo ({activity.confirmed_count}/{activity.capacity})
                    </span>
                    <div className="flex items-center">
                      <div className="flex -space-x-3 overflow-hidden">
                        {activity.participants_preview.slice(0, 4).map((user) => (
                          <img
                            key={user.id}
                            src={user.avatar}
                            alt={user.full_name}
                            className="inline-block h-10 w-10 rounded-xl ring-2 ring-surface object-cover"
                          />
                        ))}
                        {activity.confirmed_count > 4 && (
                          <div className="h-10 w-10 rounded-xl bg-surface-container-highest ring-2 ring-surface flex items-center justify-center text-xs font-bold text-primary">
                            +{activity.confirmed_count - 4}
                          </div>
                        )}
                      </div>
                      {almostFull && (
                        <span className="ml-4 text-sm text-error font-semibold italic">
                          ¡Solo quedan {activity.spots_remaining} cupos!
                        </span>
                      )}
                      {!almostFull && !isFull && (
                        <span className="ml-4 text-sm text-on-surface-variant italic">
                          Únete al grupo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* What to Bring */}
              {whatToBring.length > 0 && (
                <motion.div variants={fadeUp} className="space-y-4">
                  <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface">
                    Qué llevar
                  </h2>
                  <div className="bg-surface-container-low rounded-2xl p-6 md:p-8">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {whatToBring.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-on-surface-variant">
                          <div className="mt-0.5 bg-secondary/20 p-1 rounded-md">
                            <Check size={14} className="text-secondary" strokeWidth={3} />
                          </div>
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Weather */}
              {activity.category.is_outdoor && activity.weather && (
                <motion.div variants={fadeUp} className="space-y-4">
                  <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface">
                    Clima
                  </h2>
                  <WeatherBadge
                    temp={activity.weather.temp}
                    description={activity.weather.description}
                  />
                </motion.div>
              )}
            </div>

            {/* ---- Aside Column (1/3) ---- */}
            <aside className="space-y-6">
              {/* Mini Map Card */}
              <motion.div
                variants={fadeUp}
                className="bg-surface-container/60 rounded-2xl overflow-hidden border border-outline-variant/10"
              >
                <div className="h-52 w-full relative">
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
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-primary-container p-3 rounded-full shadow-lg">
                      <MapPin size={20} className="text-on-primary-container" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-headline font-bold text-on-surface">Punto de encuentro</h4>
                  <p className="text-sm text-on-surface-variant mt-1">{activity.meeting_point}</p>
                  <span className="text-[10px] font-label text-primary mt-2 block uppercase tracking-wider">
                    {departureTime} Salida
                  </span>
                </div>
              </motion.div>

              {/* Transport Card */}
              <motion.div
                variants={fadeUp}
                className="bg-surface-container/60 rounded-2xl p-6 border border-outline-variant/10"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-secondary-container/20 p-2.5 rounded-xl">
                    <Car size={20} className="text-secondary" />
                  </div>
                  <h4 className="font-headline font-bold text-on-surface">Transporte</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{activity.location_name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{formattedDate}</p>
                    </div>
                    {activity.spots_remaining > 0 && (
                      <span className="bg-surface-container-highest text-secondary-fixed-dim text-[10px] px-2.5 py-1 rounded-md font-label font-bold uppercase">
                        {activity.spots_remaining} cupos
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                    <span className="text-xs text-on-surface-variant">
                      Salida: {activity.meeting_point} ({departureTime})
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Meta Info Card */}
              <motion.div
                variants={fadeUp}
                className="bg-surface-container/40 rounded-2xl p-6 space-y-4 border border-outline-variant/10"
              >
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Calendar size={18} className="shrink-0 text-primary" />
                  <span className="font-label text-sm capitalize">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Clock size={18} className="shrink-0 text-primary" />
                  <span className="font-label text-sm">{formattedTime}</span>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <MapPin size={18} className="shrink-0 text-primary" />
                  <span className="font-label text-sm">{activity.location_name}</span>
                </div>
                {activity.distance_km !== null && (
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <Route size={18} className="shrink-0 text-primary" />
                    <span className="font-label text-sm">{activity.distance_km} km</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Users size={18} className="shrink-0 text-primary" />
                  <span className="font-label text-sm">
                    {activity.confirmed_count}/{activity.capacity} participantes
                  </span>
                </div>
              </motion.div>
            </aside>
          </div>
        </motion.div>
      </main>

      {/* ---- Fixed Bottom CTA ---- */}
      <div className="fixed bottom-0 left-0 w-full z-[60] border-t border-outline-variant/10" style={{ background: 'rgba(12,15,10,0.92)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 px-6 md:px-8 py-4 md:py-5">
          <div className="flex flex-col">
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
              Precio total
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-headline text-on-surface">
                {priceLabel}
              </span>
              {!activity.is_free && (
                <span className="text-xs text-on-surface-variant">/persona</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleJoin}
            disabled={joinMutation.isPending}
            className="flex-1 max-w-md bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-extrabold py-4 px-5 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed tracking-[0.02em] text-sm md:text-base"
          >
            {joinMutation.isPending
              ? 'Uniendo...'
              : isFull
                ? 'Lista de espera'
                : 'Unirme a la actividad'}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
