import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Car,
  Star,
  Shield,
  AlertTriangle,
  Search,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import EmptyState from '@/components/EmptyState';
import { mockTrips } from '@/data/trips';

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const trip = mockTrips.find((t) => t.id === Number(id));

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
  const spotsLeft = trip.seats_remaining;
  const confirmedPassengers = trip.passengers.filter((p) => p.status === 'confirmed');
  const totalSeats = trip.available_seats;
  const seatsTaken = trip.seats_taken;

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* ---- Glassmorphism Header ---- */}
      <nav className="sticky top-0 z-50 flex w-full items-center justify-between bg-[#11140f]/70 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="text-[#EDE9DF]"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="font-headline text-2xl font-black tracking-tighter text-[#EDE9DF]">
            Ride Details
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Search size={22} className="text-primary" />
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-surface-container-highest">
            <img
              src={trip.driver.avatar}
              alt="User avatar"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </nav>

      {/* ---- Main Content ---- */}
      <main className="mx-auto max-w-2xl px-6 pt-8">
        {/* ---- Main Card ---- */}
        <motion.section
          className="overflow-hidden rounded-xl bg-surface-container-low"
          style={{
            border: '1px solid rgba(159, 142, 121, 0.15)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* ---- Map Section ---- */}
          <div className="relative h-64 w-full bg-surface-container-highest">
            {trip.vehicle.photo ? (
              <img
                src={trip.vehicle.photo}
                alt="Route map view"
                className="h-full w-full object-cover opacity-60"
              />
            ) : (
              <div className="h-full w-full bg-surface-container-highest" />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />

            {/* Numbered Pin 1 - Origin */}
            <div className="absolute left-20 top-12 flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-primary-container font-label text-sm font-bold text-on-primary-container">
                1
              </div>
              <div className="h-12 w-0.5 bg-primary-container/40" />
            </div>

            {/* Numbered Pin 2 - Destination */}
            <div className="absolute bottom-20 right-32">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-secondary font-label text-sm font-bold text-on-secondary shadow-lg">
                2
              </div>
            </div>

            {/* Route label + title overlay */}
            <div className="absolute bottom-4 left-6">
              <span className="font-label text-xs uppercase tracking-[0.2em] text-primary">
                Live Route
              </span>
              <h2 className="font-headline text-xl font-bold text-on-surface">
                {trip.destination_name}
              </h2>
            </div>
          </div>

          {/* ---- Content Body ---- */}
          <div className="space-y-8 p-6">
            {/* ---- Driver & Vehicle Section ---- */}
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              {/* Driver Info */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={trip.driver.avatar}
                    alt={trip.driver.full_name}
                    className="h-16 w-16 rounded-xl object-cover ring-2 ring-secondary/20"
                  />
                  {trip.driver.is_verified_driver && (
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface-container-low bg-secondary text-on-secondary">
                      <Shield size={14} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline text-lg font-bold text-[#EDE9DF]">
                      {trip.driver.full_name}
                    </h3>
                    <div className="flex items-center text-primary">
                      <Star size={14} className="fill-primary" />
                      <span className="ml-1 font-label text-sm font-bold">
                        {trip.driver.driver_rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-on-surface-variant">
                    <Shield size={16} />
                    <span className="font-body">
                      {trip.driver.total_trips} viajes completados
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info Card */}
              <div className="flex min-w-[200px] items-center gap-4 rounded-xl bg-surface-container p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-highest">
                  <Car size={24} className="text-secondary" />
                </div>
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {trip.vehicle.brand} {trip.vehicle.model_name}
                  </p>
                  <p className="font-headline font-bold text-on-surface">
                    {trip.vehicle.color}
                    {trip.vehicle.year && (
                      <span className="ml-2 font-label text-xs font-normal text-on-surface-variant">
                        {trip.vehicle.year}
                      </span>
                    )}
                  </p>
                  <p className="select-none font-label text-xs text-on-surface-variant opacity-50 blur-[3px]">
                    {trip.vehicle.plate}
                  </p>
                </div>
              </div>
            </div>

            {/* ---- Stats Bento Grid ---- */}
            <div className="grid grid-cols-2 gap-4">
              {/* Seats Counter */}
              <div className="flex h-32 flex-col justify-between rounded-xl bg-surface-container p-5">
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Disponibilidad
                </span>
                <div className="flex items-end justify-between">
                  <div className="flex gap-1.5">
                    {Array.from({ length: totalSeats }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-8 w-3 rounded-full ${
                          i < seatsTaken
                            ? 'bg-secondary'
                            : 'bg-surface-container-highest'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-right">
                    <span className="font-headline text-3xl font-black text-on-surface">
                      {String(spotsLeft).padStart(2, '0')}
                    </span>
                    <span className="block font-label text-sm text-on-surface-variant">
                      Asientos
                    </span>
                  </div>
                </div>
              </div>

              {/* Cost Split Calculator */}
              <div className="flex h-32 flex-col justify-between rounded-xl bg-surface-container p-5">
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Costo dividido
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-label text-xs text-on-surface-variant">
                      Total: ${(costPerPerson * confirmedPassengers.length).toLocaleString('es-CL')}
                    </span>
                    <div className="mt-1 font-headline text-2xl font-bold text-primary">
                      ${costPerPerson.toLocaleString('es-CL')}
                    </div>
                  </div>
                  <div className="rounded-lg bg-surface-container-highest px-3 py-1.5">
                    <span className="font-label text-xs text-[#EDE9DF]">/ persona</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Primary Action Area ---- */}
            <div className="flex flex-col gap-4 pt-4">
              {/* JOIN RIDE Button */}
              <button
                onClick={() =>
                  spotsLeft > 0
                    ? toast.success('Asiento reservado exitosamente')
                    : toast.error('No hay cupos disponibles')
                }
                disabled={spotsLeft === 0}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary-container py-5 font-headline text-lg font-bold tracking-tight text-on-primary shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                <Zap size={22} className="fill-current" />
                {spotsLeft > 0 ? 'RESERVAR ASIENTO' : 'SIN CUPOS'}
              </button>

              {/* Emergency + Passenger Avatars Row */}
              <div className="flex items-center justify-between pt-2">
                {/* Emergency Button */}
                <button
                  className="flex items-center gap-2 font-label text-sm font-bold uppercase tracking-widest text-error opacity-60 transition-opacity hover:opacity-100"
                  onClick={() => toast.error('Funci\u00f3n de emergencia no disponible en demo')}
                >
                  <AlertTriangle size={16} />
                  Emergencia
                </button>

                {/* Passenger Avatars */}
                <div className="flex -space-x-3">
                  {confirmedPassengers.slice(0, 3).map((passenger) => (
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
                  {trip.passengers.filter((p) => p.status === 'pending').length > 0 && confirmedPassengers.length <= 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-low bg-surface-container-highest text-[10px] font-bold text-on-surface">
                      +{trip.passengers.filter((p) => p.status === 'pending').length}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ---- Pickup / Arrival Info Grid ---- */}
        <motion.div
          className="mt-8 grid grid-cols-2 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="space-y-2">
            <span className="font-label text-[10px] uppercase tracking-widest text-primary">
              Punto de recogida
            </span>
            <p className="font-body text-sm text-[#EDE9DF]">
              {trip.origin_name}{' '}
              <span className="text-on-surface-variant">{formattedTime}</span>
            </p>
          </div>
          <div className="space-y-2 text-right">
            <span className="font-label text-[10px] uppercase tracking-widest text-primary">
              Llegada estimada
            </span>
            <p className="font-body text-sm text-[#EDE9DF]">
              {trip.destination_name}{' '}
              {formattedArrival && (
                <span className="text-on-surface-variant">{formattedArrival}</span>
              )}
            </p>
          </div>
        </motion.div>

        {/* ---- Linked Activity ---- */}
        {trip.activity && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <button
              onClick={() => navigate(`/activity/${trip.activity!.id}`)}
              className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors"
              style={{ border: '1px solid rgba(159, 142, 121, 0.15)' }}
            >
              <MapPin size={18} className="flex-shrink-0 text-secondary" />
              <div>
                <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
                  Actividad vinculada
                </span>
                <p className="text-sm font-semibold text-on-surface">{trip.activity.title}</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* ---- Notes ---- */}
        {trip.notes && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div
              className="rounded-xl bg-surface-container-low p-5"
              style={{ border: '1px solid rgba(159, 142, 121, 0.15)' }}
            >
              <h3 className="mb-2 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                Notas del conductor
              </h3>
              <p className="text-sm text-on-surface-variant">{trip.notes}</p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
