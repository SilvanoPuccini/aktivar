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
} from 'lucide-react';
import toast from 'react-hot-toast';

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
      {/* ---- Glassmorphism Header ---- */}
      <header className="sticky top-0 w-full z-50 bg-[#0c0f0a]/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-6 py-4 w-full">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="active:scale-95 duration-200 text-on-surface flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-2xl font-black text-on-surface tracking-tighter font-headline">
            Aktivar
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleShare}
              className="text-on-surface hover:text-primary-container transition-colors cursor-pointer"
            >
              <Share2 size={24} />
            </button>
            <button
              type="button"
              className="text-on-surface hover:text-primary-container transition-colors cursor-pointer"
            >
              <Heart size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-4">
        {/* ---- Hero Section ---- */}
        <section className="relative h-72 sm:h-96 lg:h-[486px] w-full overflow-hidden">
          <img
            src={activity.cover_image}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />

          {/* Badges + Title overlay at bottom */}
          <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full max-w-4xl">
            <div className="flex gap-2 mb-4">
              <span
                className={`${diff.classes} px-4 py-1 rounded-full font-label text-xs uppercase tracking-widest font-bold`}
              >
                {diff.label}
              </span>
              {activity.distance_km !== null && (
                <span className="bg-surface-container-highest/80 backdrop-blur text-primary px-4 py-1 rounded-full font-label text-xs uppercase tracking-widest font-bold">
                  {activity.distance_km} KM
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-black text-on-surface leading-tight tracking-tighter">
              {activity.title}
              {activity.category?.name && (
                <>
                  <br />
                  <span className="text-primary-container">{activity.category.name}</span>
                </>
              )}
            </h1>
          </div>
        </section>

        {/* ---- Content Area ---- */}
        <motion.div
          className="px-6 -mt-4 relative z-10 space-y-10 max-w-5xl mx-auto"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ---- Main Content (2/3) ---- */}
            <div className="md:col-span-2 space-y-8">
              {/* Organizer Card */}
              <motion.div
                variants={fadeUp}
                className="bg-surface-container/60 rounded-2xl p-6 border border-outline-variant/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={activity.organizer.avatar}
                        alt={activity.organizer.full_name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      {activity.organizer.is_verified_email && (
                        <div className="absolute -bottom-1 -right-1 bg-primary p-1 rounded-lg">
                          <Check size={14} className="text-on-primary" strokeWidth={3} />
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
                    className="bg-surface-container-highest text-primary px-6 py-2 rounded-full font-bold text-sm hover:bg-surface-bright transition-colors cursor-pointer"
                  >
                    Seguir
                  </button>
                </div>
                {activity.description && (
                  <p className="text-on-surface-variant leading-relaxed text-sm">
                    {activity.description.slice(0, 180)}
                    {activity.description.length > 180 ? '...' : ''}
                  </p>
                )}
              </motion.div>

              {/* The Experience / Description */}
              <motion.div variants={fadeUp} className="space-y-4">
                <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface">
                  La Experiencia
                </h2>
                <div className="bg-surface-container-low rounded-xl p-6 space-y-6">
                  <p className="text-on-surface-variant leading-relaxed">
                    {activity.description}
                  </p>

                  {/* Participant Row */}
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
                  <div className="bg-surface-container-low rounded-xl p-6">
                    <ul className="flex flex-col gap-3">
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
                <div className="h-48 w-full relative">
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
                <div className="p-4">
                  <h4 className="font-headline font-bold text-on-surface">Punto de encuentro</h4>
                  <p className="text-sm text-on-surface-variant">{activity.meeting_point}</p>
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-secondary-container/20 p-2 rounded-lg">
                    <Car size={20} className="text-secondary" />
                  </div>
                  <h4 className="font-headline font-bold text-on-surface">Transporte</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{activity.location_name}</p>
                      <p className="text-xs text-on-surface-variant">{formattedDate}</p>
                    </div>
                    {activity.spots_remaining > 0 && (
                      <span className="bg-surface-container-highest text-secondary-fixed-dim text-[10px] px-2 py-1 rounded-md font-label font-bold uppercase">
                        {activity.spots_remaining} cupos
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                      <span className="text-xs text-on-surface-variant">
                        Salida: {activity.meeting_point} ({departureTime})
                      </span>
                    </div>
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
          </section>
        </motion.div>
      </main>

      {/* ---- Fixed Bottom CTA ---- */}
      <div className="fixed bottom-0 left-0 w-full z-[60] px-6 py-4 md:py-5" style={{ background: 'rgba(12,15,10,0.90)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(81,69,51,0.1)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-6">
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
            className="flex-1 max-w-md bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-extrabold py-4 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            {joinMutation.isPending
              ? 'Uniendo...'
              : isFull
                ? 'LISTA DE ESPERA'
                : 'UNIRME A LA ACTIVIDAD'}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
