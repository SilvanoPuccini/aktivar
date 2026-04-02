import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Calendar, Clock3, MapPin, Route, Share2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import ActivityMap from '@/components/ActivityMap';
import AvatarGroup from '@/components/AvatarGroup';
import CTAButton from '@/components/CTAButton';
import EmptyState from '@/components/EmptyState';
import WeatherBadge from '@/components/WeatherBadge';
import { preparePostAuthRedirect } from '@/lib/authRedirect';
import { useActivity, useJoinActivity } from '@/services/hooks';
import { useAuthStore } from '@/stores/authStore';

const difficultyStyles: Record<string, string> = {
  easy: 'bg-secondary text-surface',
  moderate: 'bg-primary text-[#442c00]',
  hard: 'bg-error text-[#442c00]',
  expert: 'bg-error text-[#442c00]',
};

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { data: activity, isLoading } = useActivity(id);
  const joinMutation = useJoinActivity();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6" aria-label="Cargando actividad">
        <div className="space-y-3 text-center">
          <p className="section-kicker">Cargando actividad</p>
          <p className="text-on-surface-variant">Estamos preparando los detalles de la salida.</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <EmptyState
          title="Actividad no encontrada"
          description="La expedición que buscas no está disponible o ya cambió de estado."
          action={{ label: 'Volver', onClick: () => navigate('/') }}
        />
      </div>
    );
  }

  const start = new Date(activity.start_datetime);
  const end = new Date(activity.end_datetime);
  const formattedDate = format(start, "EEEE d 'de' MMMM", { locale: es });
  const timeRange = `${format(start, 'HH:mm', { locale: es })} — ${format(end, 'HH:mm', { locale: es })}`;
  const priceLabel = activity.is_free ? 'Gratis' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(activity.price);
  const whatToBring = activity.what_to_bring ? activity.what_to_bring.split(',').map((item) => item.trim()).filter(Boolean) : [];
  const heroMeta = `${format(start, 'MMM d, hh:mm a', { locale: es }).toUpperCase()} · ${activity.location_name.toUpperCase()}`;
  const squadLabel = `${activity.confirmed_count} / ${activity.capacity} spots filled`;
  const participantEntries = activity.participants?.filter((participant) => participant.status === 'confirmed').map((participant) => participant.user) ?? activity.participants_preview;
  const viewerParticipant = activity.participants?.find((participant) => participant.user.id === user?.id && participant.status !== 'cancelled');
  const isPublished = activity.status === 'published';
  const isWaitlistOnly = activity.spots_remaining <= 0;
  const isConfirmedParticipant = viewerParticipant?.status === 'confirmed';
  const isWaitlistedParticipant = viewerParticipant?.status === 'waitlisted';
  const canOpenGroupChat = isAuthenticated && !!viewerParticipant && isPublished;
  const joinLabel = !isPublished
    ? activity.status === 'completed'
      ? 'Activity ended'
      : activity.status === 'cancelled'
        ? 'Activity cancelled'
        : 'Unavailable'
    : isConfirmedParticipant
      ? 'You are in'
      : isWaitlistedParticipant
        ? 'On waitlist'
        : isWaitlistOnly
          ? `Join waitlist · ${priceLabel}`
          : `Join activity · ${priceLabel}`;
  const joinHelperText = !isPublished
    ? 'Esta salida ya no acepta nuevas reservas.'
    : isConfirmedParticipant
      ? 'Tu lugar está confirmado. Ya puedes coordinarte con el grupo.'
      : isWaitlistedParticipant
        ? 'Estás en lista de espera. Te avisaremos si se libera un cupo.'
        : isWaitlistOnly
          ? 'No quedan cupos confirmados. Si te sumas, entrarás a la lista de espera.'
          : 'Reserva tu lugar para desbloquear la coordinación del grupo.';

  const openGroupChat = () => {
    if (canOpenGroupChat) {
      navigate(`/chat/${activity.id}`);
      return;
    }

    if (!isAuthenticated) {
      const returnPath = preparePostAuthRedirect(location.pathname, location.search, location.hash);
      navigate('/login', { state: { from: returnPath } });
    }
  };

  const handleJoin = () => {
    if (!isPublished || viewerParticipant) {
      return;
    }

    if (!isAuthenticated) {
      toast.error('Inicia sesión para reservar tu lugar');
      const returnPath = preparePostAuthRedirect(location.pathname, location.search, location.hash);
      navigate('/login', { state: { from: returnPath } });
      return;
    }

    joinMutation.mutate(activity.id, {
      onSuccess: () => toast.success('Te uniste a la actividad'),
      onError: (err) => {
        const error = err as AxiosError<{ detail?: string }>;
        toast.error(error.response?.data?.detail ?? 'No se pudo completar la reserva');
      },
    });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: activity.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Enlace copiado');
      }
    } catch {
      // noop
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <section className="relative h-[36rem] overflow-hidden md:h-[44rem]">
        <img src={activity.cover_image} alt={activity.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />

        <header className="glass absolute inset-x-0 top-0 z-20 hidden border-b border-outline-variant/10 md:block">
          <div className="premium-shell flex h-20 items-center justify-between">
            <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface cursor-pointer">
              <ArrowLeft size={18} />
              <span className="font-label text-[10px] uppercase tracking-[0.18em]">Volver</span>
            </button>
            <div className="font-headline text-2xl font-black uppercase tracking-tight text-primary">Aktivar</div>
            <button type="button" onClick={handleShare} className="flex items-center gap-2 text-on-surface-variant cursor-pointer hover:text-on-surface">
              <Share2 size={16} />
              <span className="font-label text-[10px] uppercase tracking-[0.18em]">Compartir</span>
            </button>
          </div>
        </header>

        <button type="button" onClick={() => navigate(-1)} className="glass absolute left-6 top-6 z-20 flex h-12 w-12 items-center justify-center rounded-[1rem] md:hidden">
          <ArrowLeft size={18} />
        </button>

        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="premium-shell pb-10 md:pb-14">
            <div className="max-w-4xl space-y-5">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-4 py-2 font-label text-[10px] uppercase tracking-[0.18em] ${difficultyStyles[activity.difficulty] || difficultyStyles.easy}`}>
                  {activity.difficulty}
                </span>
                <span className="rounded-full bg-surface-container-high/80 px-4 py-2 font-label text-[10px] uppercase tracking-[0.18em] text-primary backdrop-blur-sm">
                  {activity.category.name}
                </span>
                {activity.distance_km !== null && (
                  <span className="rounded-full bg-surface-container-high/80 px-4 py-2 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant backdrop-blur-sm">
                    {activity.distance_km} km
                  </span>
                )}
              </div>
              <h1 className="hero-title text-5xl text-on-surface md:text-7xl">{activity.title}</h1>
              <div className="flex flex-wrap items-center gap-4 font-label text-[11px] uppercase tracking-[0.16em] text-primary-fixed">
                <span>{heroMeta}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="premium-shell -mt-8 grid gap-8 md:-mt-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <section className="editorial-card rounded-[1rem] px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <img src={activity.organizer.avatar} alt={activity.organizer.full_name} className="h-20 w-20 rounded-[1.25rem] object-cover grayscale transition duration-300 hover:grayscale-0" />
                <div>
                  <p className="section-kicker">Organizer</p>
                  <h2 className="font-headline text-3xl font-black tracking-tight text-on-surface">{activity.organizer.full_name}</h2>
                  <div className="mt-1 flex items-center gap-3 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1"><Star size={14} className="text-primary" /> {activity.organizer.rating ?? 4.9}</span>
                    <span>•</span>
                    <span>{activity.organizer.total_activities ?? 0} activities hosted</span>
                  </div>
                </div>
              </div>
              <CTAButton
                label={canOpenGroupChat ? 'Open group chat' : isAuthenticated ? 'Join to unlock chat' : 'Log in to unlock chat'}
                variant="secondary"
                onClick={openGroupChat}
                disabled={isAuthenticated && !canOpenGroupChat}
              />
            </div>
          </section>

          <section className="editorial-card rounded-[1rem] px-6 py-6 md:px-8 md:py-8">
            <h2 className="border-l-4 border-primary pl-5 font-headline text-3xl font-black uppercase italic tracking-tight text-on-surface md:text-4xl">The journey</h2>
            <div className="mt-4 space-y-5">
              <p className="text-on-surface-variant">{activity.description}</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[0.75rem] bg-surface px-4 py-4">
                  <p className="section-kicker">Fecha</p>
                  <div className="mt-3 flex items-start gap-3"><Calendar size={18} className="text-primary" /><div><p className="font-headline text-xl font-black uppercase tracking-tight">{formattedDate}</p></div></div>
                </div>
                <div className="rounded-[0.75rem] bg-surface px-4 py-4">
                  <p className="section-kicker">Horario</p>
                  <div className="mt-3 flex items-start gap-3"><Clock3 size={18} className="text-primary" /><p className="text-on-surface">{timeRange}</p></div>
                </div>
                <div className="rounded-[0.75rem] bg-surface px-4 py-4">
                  <p className="section-kicker">Encuentro</p>
                  <div className="mt-3 flex items-start gap-3"><MapPin size={18} className="text-primary" /><p className="text-on-surface">{activity.meeting_point || activity.location_name}</p></div>
                </div>
              </div>
              {whatToBring.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-on-surface">Qué llevar</h2>
                  <div className="flex flex-wrap gap-2">
                    {whatToBring.map((item) => (
                      <span key={item} className="rounded-full bg-surface-container-high px-4 py-2 font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="editorial-card rounded-[1rem] px-6 py-6 md:px-8 md:py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">Current squad</p>
                <h2 className="font-headline text-3xl font-black uppercase italic tracking-tight text-on-surface">Current squad</h2>
              </div>
              <div className="text-right">
                <p className="font-headline text-4xl font-black text-primary">{activity.confirmed_count}</p>
                <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">de {activity.capacity}</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {participantEntries.length > 0 ? (
                <AvatarGroup users={participantEntries.map((participant) => ({ id: participant.id, full_name: participant.full_name, avatar: participant.avatar }))} size="lg" />
              ) : (
                <p className="text-sm text-on-surface-variant">Todavía no hay participantes confirmados. Sé la primera persona en activar esta salida.</p>
              )}
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-on-surface-variant">Únete al grupo, coordina transporte y conversa con personas que ya confirmaron esta salida.</p>
                <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant whitespace-nowrap">{squadLabel}</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[1rem] editorial-card">
            <div className="px-6 pb-2 pt-6 md:px-8">
              <p className="section-kicker">Territorio</p>
              <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-on-surface">Mapa y punto de reunión</h2>
            </div>
            <div className="h-[22rem] overflow-hidden rounded-[0.875rem] m-4 mt-2">
              <ActivityMap
                activities={[activity]}
                singleMarker={{ lat: activity.latitude, lng: activity.longitude, label: activity.location_name }}
                center={[activity.latitude, activity.longitude]}
                zoom={13}
                interactive={false}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <section className="editorial-card rounded-[1rem] px-6 py-6 md:px-8 md:py-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Total price</p>
                <p className="mt-2 font-headline text-5xl font-black leading-none text-primary">{priceLabel}</p>
              </div>
              <button type="button" onClick={handleShare} className="rounded-full bg-surface px-3 py-3 text-on-surface-variant hover:text-on-surface cursor-pointer"><Share2 size={16} /></button>
            </div>
            <div className="mt-6">
              <CTAButton label={joinLabel} loading={joinMutation.isPending} onClick={handleJoin} disabled={!isPublished || !!viewerParticipant} fullWidth />
              <p className="mt-3 text-sm text-on-surface-variant">{joinHelperText}</p>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-[0.75rem] bg-surface px-4 py-4">
                <p className="section-kicker">Meeting point</p>
                <div className="mt-3 flex items-center gap-2 text-on-surface"><MapPin size={16} className="text-primary" /> {activity.meeting_point || activity.location_name}</div>
              </div>
              <div className="rounded-[0.75rem] bg-surface px-4 py-4">
                <p className="section-kicker">Route</p>
                <div className="mt-3 flex items-center gap-2 text-on-surface"><Route size={16} className="text-primary" /> {activity.location_name}</div>
              </div>
              <div className="rounded-[0.75rem] bg-surface px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-headline text-xl font-black text-on-surface">Rideshare available</p>
                    <p className="text-sm text-on-surface-variant">Coordina con el grupo en el chat de la salida.</p>
                  </div>
                  <span className="rounded-full bg-secondary/20 px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-secondary">{activity.spots_remaining} seats left</span>
                </div>
                <div className="mt-4">
                  <CTAButton
                    label={canOpenGroupChat ? 'Open group chat' : isAuthenticated ? 'Join to unlock chat' : 'Log in to unlock chat'}
                    variant="secondary"
                    onClick={openGroupChat}
                    disabled={isAuthenticated && !canOpenGroupChat}
                    fullWidth
                  />
                </div>
              </div>
              {activity.weather && <div><WeatherBadge temp={activity.weather.temp} description={activity.weather.description} icon={activity.weather.icon} /></div>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
