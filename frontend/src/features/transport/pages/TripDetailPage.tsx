import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Car, Clock3, MapPin, Shield, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import CTAButton from '@/components/CTAButton';
import EmptyState from '@/components/EmptyState';
import { useBookSeat, useTrip } from '@/services/hooks';
import type { TripPassenger } from '@/types/transport';

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trip, isLoading } = useTrip(id);
  const bookSeat = useBookSeat();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="animate-pulse text-muted">Cargando viaje...</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <EmptyState
          icon={<Car size={48} />}
          title="Viaje no encontrado"
          description="Este viaje no existe o fue cancelado."
          action={{ label: 'Volver al inicio', onClick: () => navigate('/') }}
        />
      </div>
    );
  }

  const departureDate = new Date(trip.departure_time);
  const formattedTime = format(departureDate, 'HH:mm', { locale: es });
  const arrivalDate = trip.estimated_arrival ? new Date(trip.estimated_arrival) : null;
  const formattedArrival = arrivalDate ? format(arrivalDate, 'HH:mm', { locale: es }) : null;
  const totalCost = trip.price_per_passenger;
  const costPerPerson = trip.seats_taken > 0
    ? Math.round(totalCost)
    : totalCost;
  const spotsLeft = trip.seats_remaining ?? (trip.available_seats - (trip.seats_taken ?? 0));
  const confirmedPassengers = (trip.passengers ?? []).filter((p: { status: string }) => p.status === 'confirmed');
  const totalSeats = trip.available_seats;
  const seatsTaken = trip.seats_taken ?? 0;
  const pendingPassengersCount = (trip.passengers ?? []).filter((p: { status: string }) => p.status === 'pending').length;
  const bookingDisabled = spotsLeft === 0 || bookSeat.isPending;
  const bookingLabel = bookSeat.isPending
    ? 'RESERVANDO...'
    : spotsLeft > 0
      ? 'RESERVAR ASIENTO'
      : 'SIN CUPOS';

  const getApiErrorMessage = (error: unknown) => {
    const axiosError = error as AxiosError<{ detail?: string; [key: string]: unknown }>;
    return axiosError.response?.data?.detail || 'No se pudo reservar el asiento';
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="glass sticky top-0 z-20 border-b border-outline-variant/10">
        <div className="premium-shell flex h-20 items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 cursor-pointer"><ArrowLeft size={18} /><span className="font-label text-[10px] uppercase tracking-[0.16em]">Volver</span></button>
          <div className="font-headline text-2xl font-black uppercase tracking-tight text-primary-container">Ride details</div>
          <div className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">#{trip.id}</div>
        </div>
      </header>

      <main className="premium-shell space-y-8 py-8">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-full bg-secondary text-surface px-4 py-2 font-label text-[10px] uppercase tracking-[0.16em]">Confirmed route</span>
              <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{trip.status}</span>
            </div>
            <h1 className="hero-title text-5xl text-on-surface md:text-7xl">{tripTitle}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-on-surface-variant">
              <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-primary" /> {format(departure, 'HH:mm', { locale: es })}</span>
              <span className="inline-flex items-center gap-2"><MapPin size={15} className="text-primary" /> {trip.origin_name}</span>
              {arrival && <span className="inline-flex items-center gap-2"><Car size={15} className="text-primary" /> llegada {format(arrival, 'HH:mm', { locale: es })}</span>}
            </div>
          </div>
          <section className="editorial-card rounded-[1.8rem] border-l-4 border-primary px-6 py-6 text-center">
            <p className="section-kicker">Seats left</p>
            <p className="mt-1 font-headline text-6xl font-black leading-none text-primary">{String(trip.seats_remaining).padStart(2, '0')}</p>
            <div className="mt-4 flex justify-center gap-1.5">
              {seatDots.map((filled, index) => <span key={index} className={`h-2.5 w-2.5 rounded-full ${filled ? 'bg-primary' : 'bg-on-surface-variant/20'}`} />)}
            </div>
          </section>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="editorial-card rounded-[2rem] overflow-hidden">
              <div className="relative h-72 bg-surface-container-highest md:h-[31rem]">
                {trip.vehicle.photo ? <img src={trip.vehicle.photo} alt={trip.vehicle.model_name} className="h-full w-full object-cover opacity-75" /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface/10 to-surface-container-lowest/30" />
                <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                  <div className="rounded-[1rem] bg-surface/80 px-4 py-3 backdrop-blur-sm">
                    <p className="section-kicker">Departure</p>
                    <p className="mt-1 font-semibold text-on-surface">{trip.origin_name}</p>
                  </div>
                  {trip.stops[0] && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-label text-[10px] font-bold text-[#442c00]">
                      1
                    </div>
                  )}
                </div>
                <div className="absolute bottom-5 left-5">
                  <div className="rounded-[1rem] bg-surface/80 px-5 py-4 backdrop-blur-sm">
                    <div className="flex items-end gap-8">
                      <div>
                        <p className="section-kicker">Distance</p>
                        <p className="font-headline text-2xl font-black text-on-surface">{trip.stops.length * 47 + 48}<span className="ml-1 text-xs text-on-surface-variant">km</span></p>
                      </div>
                      <div>
                        <p className="section-kicker">Est. time</p>
                        <p className="font-headline text-2xl font-black text-on-surface">{arrival ? format(arrival, 'H', { locale: es }) : '2'}<span className="ml-1 text-xs text-on-surface-variant">h</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="editorial-card rounded-[2rem] px-6 py-6 md:px-8 md:py-8">
              <p className="section-kicker">Driver</p>
              <div className="mt-4 flex items-center gap-4">
                <img src={trip.driver.avatar} alt={trip.driver.full_name} className="h-16 w-16 rounded-[1.25rem] object-cover" />
                <div>
                  <h3 className="font-headline text-2xl font-black uppercase tracking-tight text-on-surface">{trip.driver.full_name}</h3>
                  <div className="mt-1 flex items-center gap-4 text-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1"><Star size={14} className="text-primary" /> {trip.driver.driver_rating.toFixed(1)}</span>
                    <span className="inline-flex items-center gap-1"><Shield size={14} className="text-secondary" /> {trip.driver.total_trips} viajes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Primary Action Area ---- */}
            <div className="flex flex-col gap-4 pt-4">
              {/* JOIN RIDE Button */}
              <button
                onClick={() => {
                  if (spotsLeft > 0) {
                    bookSeat.mutate(trip.id, {
                      onSuccess: () => toast.success('Asiento reservado exitosamente'),
                      onError: (error) => toast.error(getApiErrorMessage(error)),
                    });
                  } else {
                    toast.error('No hay cupos disponibles');
                  }
                }}
                disabled={bookingDisabled}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary-container py-5 font-headline text-lg font-bold tracking-tight text-on-primary shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                <Zap size={22} className="fill-current" />
                {bookingLabel}
              </button>

              {/* Emergency + Passenger Avatars Row */}
              <div className="flex items-center justify-between pt-2">
                {/* Emergency Button */}
                <button
                  className="flex items-center gap-2 font-label text-sm font-bold uppercase tracking-widest text-error opacity-60 transition-opacity hover:opacity-100"
                  onClick={() => toast('Mantén presionado 3 segundos para activar emergencia')}
                >
                  <AlertTriangle size={16} />
                  Emergencia
                </button>

                {/* Passenger Avatars */}
                <div className="flex -space-x-3">
                  {confirmedPassengers.slice(0, 3).map((passenger: { id: number; user: { avatar: string; full_name: string } }) => (
                    <img
                      key={passenger.id}
                      src={passenger.user.avatar}
                      alt={passenger.user.full_name}
                      className="h-8 w-8 rounded-full border-2 border-surface-container-low object-cover"
                    />
                  ))}
                  {confirmedPassengers.length > 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-low bg-surface-container-highest text-[10px] font-bold text-on-surface">
                      +{confirmedPassengers.length - 3}
                    </div>
                  )}
                  {pendingPassengersCount > 0 && confirmedPassengers.length <= 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-low bg-surface-container-highest text-[10px] font-bold text-on-surface">
                      +{pendingPassengersCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <section className="editorial-card rounded-[2rem] px-6 py-6 md:px-8 md:py-8">
              <p className="section-kicker">Vehicle</p>
              <h3 className="mt-3 font-headline text-4xl font-black uppercase leading-[0.95] tracking-tight text-on-surface">{trip.vehicle.brand} {trip.vehicle.model_name}</h3>
              <div className="mt-5 space-y-3 text-sm text-on-surface-variant">
                <p>Color: <span className="text-on-surface">{trip.vehicle.color}</span></p>
                <p>Capacidad: <span className="text-on-surface">{trip.vehicle.capacity}</span></p>
                {trip.notes && <p>Notas: <span className="text-on-surface">{trip.notes}</span></p>}
              </div>
            </section>

            <section className="editorial-card rounded-[2rem] px-6 py-6 md:px-8 md:py-8">
              <p className="section-kicker">Cost split breakdown</p>
              <div className="mt-4 space-y-4">
                <div className="rounded-[1.35rem] bg-surface px-4 py-4">
                  <div className="flex items-end justify-between gap-4">
                    <p className="mt-2 font-headline text-4xl font-black text-primary">{cost}</p>
                    <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">per person</p>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                    <div className="h-full w-3/4 rounded-full bg-primary" />
                  </div>
                  <p className="mt-4 font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Includes: fuel, tolls, gear rack</p>
                </div>
                <CTAButton label={bookSeat.isPending ? 'Reservando' : 'Reservar asiento'} loading={bookSeat.isPending} onClick={handleBook} fullWidth />
                <CTAButton label="Emergency SOS" variant="danger" onClick={() => navigate('/safety')} fullWidth />
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
