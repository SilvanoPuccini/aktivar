import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Car,
  Star,
  Shield,
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  Navigation,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import CTAButton from '@/components/CTAButton';
import VerifiedBadge from '@/components/VerifiedBadge';
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
  const formattedDate = format(departureDate, "EEEE d 'de' MMMM, yyyy", { locale: es });
  const formattedTime = format(departureDate, 'HH:mm', { locale: es });
  const totalCost = trip.price_per_passenger;
  const costPerPerson = trip.seats_taken > 0
    ? Math.round(totalCost)
    : totalCost;
  const spotsLeft = trip.seats_remaining;
  const confirmedPassengers = trip.passengers.filter((p) => p.status === 'confirmed');

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* ---- Header ---- */}
      <div className="relative bg-surface-lowest px-4 pb-6 pt-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container"
            aria-label="Volver"
          >
            <ArrowLeft size={20} className="text-on-surface" />
          </button>
          <span className="font-label text-xs uppercase tracking-wider text-muted">
            Detalle del viaje
          </span>
          <div className="w-10" />
        </div>

        {/* Route summary */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 flex flex-col items-center">
              <div className="h-3 w-3 rounded-full border-2 border-secondary bg-transparent" />
              <div className="h-12 w-0.5 bg-gradient-to-b from-secondary to-primary" />
              <div className="h-3 w-3 rounded-full bg-primary" />
            </div>
            <div className="flex-1">
              <div>
                <span className="font-label text-[10px] uppercase tracking-wider text-secondary">
                  Origen
                </span>
                <p className="text-sm font-semibold text-on-surface">{trip.origin_name}</p>
              </div>
              <div className="mt-4">
                <span className="font-label text-[10px] uppercase tracking-wider text-primary">
                  Destino
                </span>
                <p className="text-sm font-semibold text-on-surface">{trip.destination_name}</p>
              </div>
            </div>
          </div>

          {/* Date & time pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5">
              <Calendar size={13} className="text-primary" />
              <span className="font-label text-xs capitalize text-on-surface-variant">
                {formattedDate}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5">
              <Clock size={13} className="text-primary" />
              <span className="font-label text-xs text-on-surface-variant">
                Sale a las {formattedTime}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ---- Linked Activity ---- */}
      {trip.activity && (
        <motion.div
          className="mx-4 mt-4 lg:mx-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <button
            onClick={() => navigate(`/activity/${trip.activity!.id}`)}
            className="flex w-full items-center gap-3 rounded-xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container"
          >
            <Navigation size={18} className="text-secondary flex-shrink-0" />
            <div>
              <span className="font-label text-[10px] uppercase tracking-wider text-muted">
                Actividad vinculada
              </span>
              <p className="text-sm font-semibold text-on-surface">{trip.activity.title}</p>
            </div>
          </button>
        </motion.div>
      )}

      {/* ---- Route Stops ---- */}
      <motion.div
        className="mx-4 mt-6 lg:mx-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-on-surface">
          <MapPin size={18} className="text-primary" />
          Ruta y paradas
        </h2>

        <div className="space-y-0">
          {trip.stops.map((stop, index) => {
            const isFirst = index === 0;
            const isLast = index === trip.stops.length - 1;
            const passengersAtStop = trip.passengers.filter(
              (p) => p.pickup_stop?.id === stop.id && p.status === 'confirmed'
            );

            return (
              <div key={stop.id} className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isFirst
                        ? 'bg-secondary text-surface'
                        : isLast
                        ? 'bg-primary text-surface'
                        : 'bg-surface-container-highest text-on-surface'
                    }`}
                  >
                    {stop.order}
                  </div>
                  {!isLast && (
                    <div className="h-14 w-0.5 bg-surface-container-highest" />
                  )}
                </div>

                {/* Stop info */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{stop.name}</p>
                      {stop.estimated_time && (
                        <span className="font-label text-xs text-muted">
                          {stop.estimated_time} hrs
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Passengers boarding here */}
                  {passengersAtStop.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <Users size={12} className="text-muted" />
                      <span className="font-label text-[10px] text-muted">
                        {passengersAtStop.length} persona{passengersAtStop.length !== 1 ? 's' : ''} sube{passengersAtStop.length !== 1 ? 'n' : ''} aquí
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ---- Driver Card ---- */}
      <motion.div
        className="mx-4 mt-6 lg:mx-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-on-surface">
          <Shield size={18} className="text-secondary" />
          Conductor
        </h2>

        <div className="rounded-xl bg-surface-container p-5">
          <div className="flex items-center gap-4">
            <img
              src={trip.driver.avatar}
              alt={trip.driver.full_name}
              className="h-16 w-16 rounded-full border-2 border-secondary bg-surface-container-high object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-on-surface">{trip.driver.full_name}</h3>
                {trip.driver.is_verified_driver && <VerifiedBadge type="driver" />}
              </div>

              <div className="mt-1 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-primary text-primary" />
                  <span className="font-label text-sm font-medium text-on-surface">
                    {trip.driver.driver_rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-outline-variant">·</span>
                <span className="font-label text-xs text-muted">
                  {trip.driver.total_trips} viajes
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---- Vehicle Info ---- */}
      <motion.div
        className="mx-4 mt-6 lg:mx-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-on-surface">
          <Car size={18} className="text-primary" />
          Vehículo
        </h2>

        <div className="overflow-hidden rounded-xl bg-surface-container">
          {trip.vehicle.photo && (
            <img
              src={trip.vehicle.photo}
              alt={`${trip.vehicle.brand} ${trip.vehicle.model_name}`}
              className="h-44 w-full object-cover"
              loading="lazy"
            />
          )}
          <div className="p-5">
            <h3 className="text-base font-semibold text-on-surface">
              {trip.vehicle.brand} {trip.vehicle.model_name}
              {trip.vehicle.year && (
                <span className="ml-2 font-label text-xs text-muted">{trip.vehicle.year}</span>
              )}
            </h3>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-surface-container-high px-3 py-2 text-center">
                <span className="font-label text-[10px] uppercase tracking-wider text-muted">Color</span>
                <p className="mt-0.5 text-sm font-medium text-on-surface">{trip.vehicle.color}</p>
              </div>
              <div className="rounded-lg bg-surface-container-high px-3 py-2 text-center">
                <span className="font-label text-[10px] uppercase tracking-wider text-muted">Patente</span>
                <p className="mt-0.5 text-sm font-medium text-on-surface">{trip.vehicle.plate}</p>
              </div>
              <div className="rounded-lg bg-surface-container-high px-3 py-2 text-center">
                <span className="font-label text-[10px] uppercase tracking-wider text-muted">Capacidad</span>
                <p className="mt-0.5 text-sm font-medium text-on-surface">{trip.vehicle.capacity} personas</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---- Passengers ---- */}
      <motion.div
        className="mx-4 mt-6 lg:mx-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-on-surface">
          <Users size={18} className="text-primary" />
          Pasajeros
          <span className="ml-auto font-label text-xs text-muted">
            {trip.seats_taken}/{trip.available_seats} asientos
          </span>
        </h2>

        {/* Seat visualization */}
        <div className="mb-4 flex gap-2">
          {Array.from({ length: trip.available_seats }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < trip.seats_taken ? 'bg-secondary' : 'bg-surface-container-highest'
              }`}
            />
          ))}
        </div>

        <div className="space-y-2">
          {trip.passengers.map((passenger) => (
            <div
              key={passenger.id}
              className="flex items-center gap-3 rounded-xl bg-surface-container p-3"
            >
              <img
                src={passenger.user.avatar}
                alt={passenger.user.full_name}
                className="h-10 w-10 rounded-full bg-surface-container-high object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-on-surface">{passenger.user.full_name}</p>
                {passenger.pickup_stop && (
                  <span className="font-label text-[10px] text-muted">
                    Sube en: {passenger.pickup_stop.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {passenger.status === 'confirmed' ? (
                  <CheckCircle2 size={16} className="text-secondary" />
                ) : (
                  <Circle size={16} className="text-muted" />
                )}
                <span
                  className={`font-label text-[10px] uppercase ${
                    passenger.status === 'confirmed' ? 'text-secondary' : 'text-muted'
                  }`}
                >
                  {passenger.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ---- Cost Split Calculator ---- */}
      <motion.div
        className="mx-4 mt-6 lg:mx-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-on-surface">
          <DollarSign size={18} className="text-primary" />
          Costo del viaje
        </h2>

        <div className="rounded-xl bg-surface-container p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-on-surface-variant">Precio por persona</span>
            <span className="font-display text-2xl font-bold text-primary">
              ${costPerPerson.toLocaleString('es-CL')}
            </span>
          </div>

          <div className="mt-4 space-y-2 border-t border-outline-variant/30 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Pasajeros confirmados</span>
              <span className="font-label text-on-surface">{confirmedPassengers.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Total recaudado</span>
              <span className="font-label text-secondary">
                ${(costPerPerson * confirmedPassengers.length).toLocaleString('es-CL')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Asientos disponibles</span>
              <span className={`font-label ${spotsLeft > 0 ? 'text-on-surface' : 'text-error'}`}>
                {spotsLeft > 0 ? spotsLeft : 'Completo'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---- Notes ---- */}
      {trip.notes && (
        <motion.div
          className="mx-4 mt-6 lg:mx-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <div className="rounded-xl bg-surface-container-low p-5">
            <h3 className="mb-2 font-label text-xs uppercase tracking-wider text-muted">
              Notas del conductor
            </h3>
            <p className="text-sm text-on-surface-variant">{trip.notes}</p>
          </div>
        </motion.div>
      )}

      {/* ---- Emergency Button ---- */}
      <motion.div
        className="mx-4 mt-6 lg:mx-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-error/20 bg-error/5 p-3 text-sm text-error transition-colors hover:bg-error/10"
          onClick={() => toast.error('Función de emergencia no disponible en demo')}
        >
          <AlertTriangle size={16} />
          <span className="font-label text-xs uppercase tracking-wider">Contacto de emergencia</span>
        </button>
      </motion.div>

      {/* ---- Fixed Bottom CTA ---- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/20 p-4 glass">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div>
            <span className="font-label text-xs text-muted">Precio por asiento</span>
            <p className="font-display text-xl font-bold text-primary">
              ${costPerPerson.toLocaleString('es-CL')}
            </p>
          </div>

          <CTAButton
            label={spotsLeft > 0 ? 'Reservar asiento' : 'Sin cupos'}
            variant="primary"
            disabled={spotsLeft === 0}
            onClick={() => toast.success('Asiento reservado exitosamente')}
          />
        </div>
      </div>
    </div>
  );
}
