import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Eye,
  EyeOff,
  MapPin,
  Check,
  Mountain,
  Music,
  Bike,
  Waves,
  Film,
  Plane,
  Users,
  Trophy,
  Tent,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { LucideIcon } from 'lucide-react';

import ActivityMap from '@/components/ActivityMap';
import { categories } from '@/data/categories';
import api, { endpoints } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface OnboardingData {
  name: string;
  email: string;
  password: string;
  selectedCategories: number[];
  location: string;
}

const initialData: OnboardingData = {
  name: '',
  email: '',
  password: '',
  selectedCategories: [],
  location: '',
};

/* ------------------------------------------------------------------ */
/*  Shared classes (Stitch design)                                     */
/* ------------------------------------------------------------------ */
const inputClasses =
  'w-full bg-surface-container-highest border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/40 text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-colors duration-200 font-body';

const labelClasses =
  'block font-label uppercase tracking-widest text-xs text-primary-fixed-dim px-1 mb-2';

/* ------------------------------------------------------------------ */
/*  Slide animation variants                                           */
/* ------------------------------------------------------------------ */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

/* ------------------------------------------------------------------ */
/*  Icon map for category cards                                        */
/* ------------------------------------------------------------------ */
const iconMap: Record<string, LucideIcon> = {
  mountain: Mountain,
  music: Music,
  bike: Bike,
  waves: Waves,
  film: Film,
  plane: Plane,
  users: Users,
  trophy: Trophy,
  tent: Tent,
};

/* ------------------------------------------------------------------ */
/*  Gradient backgrounds per category for interest cards                */
/* ------------------------------------------------------------------ */
const categoryGradients: Record<string, string> = {
  trekking: 'linear-gradient(160deg, #2d5a27 0%, #1a3518 40%, #0c1a0a 100%)',
  festival: 'linear-gradient(160deg, #5a4a27 0%, #352c15 40%, #1a150a 100%)',
  ciclismo: 'linear-gradient(160deg, #273a5a 0%, #152235 40%, #0a111a 100%)',
  kayak: 'linear-gradient(160deg, #1a4a4a 0%, #0f2d2d 40%, #071717 100%)',
  cine: 'linear-gradient(160deg, #4a2727 0%, #2d1515 40%, #170a0a 100%)',
  viaje: 'linear-gradient(160deg, #4a4027 0%, #2d2615 40%, #17130a 100%)',
  social: 'linear-gradient(160deg, #3a3a3a 0%, #222222 40%, #111111 100%)',
  deporte: 'linear-gradient(160deg, #5a3a00 0%, #352200 40%, #1a1100 100%)',
  camping: 'linear-gradient(160deg, #1a4a27 0%, #0f2d18 40%, #07170c 100%)',
  surf: 'linear-gradient(160deg, #1a3a5a 0%, #0f2235 40%, #07111a 100%)',
};

/* ================================================================== */
/*  OnboardingPage                                                     */
/* ================================================================== */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>(initialData);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [gpsAcquiring, setGpsAcquiring] = useState(false);

  /* helpers */
  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const toggleCategory = (id: number) => {
    setFormData((prev) => {
      const selected = prev.selectedCategories.includes(id)
        ? prev.selectedCategories.filter((c) => c !== id)
        : [...prev.selectedCategories, id];
      return { ...prev, selectedCategories: selected };
    });
  };

  const next = () => {
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 2));
  };
  const prev = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleComplete = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Completa todos los campos');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      // Register user
      await api.post(endpoints.register, {
        email: formData.email,
        password: formData.password,
        full_name: formData.name,
      });

      // Login to get token
      const tokenRes = await api.post(endpoints.login, {
        email: formData.email,
        password: formData.password,
      });
      sessionStorage.setItem('aktivar_access_token', tokenRes.data.access);

      // Update profile with location if provided
      if (formData.location) {
        await api.patch(endpoints.myProfile, {
          location_name: formData.location,
        });
      }

      // Fetch user data
      const userRes = await api.get(endpoints.me);
      storeLogin(userRes.data);

      toast.success('Cuenta creada con exito!');
      navigate('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const data = error.response?.data;
      if (data?.email) {
        toast.error('Este email ya está registrado');
      } else if (data?.password) {
        toast.error(data.password[0]);
      } else {
        toast.error('Error al crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGPS = () => {
    setGpsAcquiring(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
          update(
            'location',
            `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
          setGpsAcquiring(false);
        },
        () => {
          update('location', 'Santiago, Chile');
          setUserCoords([-33.4489, -70.6693]);
          setGpsAcquiring(false);
        },
      );
    } else {
      update('location', 'Santiago, Chile');
      setUserCoords([-33.4489, -70.6693]);
      setGpsAcquiring(false);
    }
  };

  const selectedCount = formData.selectedCategories.length;

  /* ---------------------------------------------------------------- */
  /*  Step 1 — BECOME THE PATHFINDER                                   */
  /* ---------------------------------------------------------------- */
  const step1 = (
    <section className="w-full space-y-12">
      {/* Hero headline */}
      <div className="space-y-4">
        <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tight leading-[0.9] text-on-surface">
          BECOME THE <br />
          <span className="text-primary italic">PATHFINDER.</span>
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl max-w-md font-body leading-relaxed">
          Join Latin America's elite outdoor community. Let's start with the basics.
        </p>
      </div>

      {/* Form fields — 2-col grid on md */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="space-y-2">
          <label className={labelClasses}>Nombre</label>
          <input
            type="text"
            className={inputClasses}
            placeholder="Tu nombre completo"
            value={formData.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Email</label>
          <input
            type="email"
            className={inputClasses}
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className={labelClasses}>Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`${inputClasses} pr-12`}
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={(e) => update('password', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={next}
        className="w-full md:w-max px-12 py-5 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-extrabold text-lg rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
      >
        CONTINUE JOURNEY
        <ArrowRight size={20} strokeWidth={3} />
      </button>

      <p className="text-sm text-on-surface-variant/60 font-body">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-primary hover:underline font-semibold">
          Inicia sesión
        </Link>
      </p>
    </section>
  );

  /* ---------------------------------------------------------------- */
  /*  Step 2 — SELECT YOUR TERRAIN                                     */
  /* ---------------------------------------------------------------- */
  const step2 = (
    <section className="w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-4xl font-headline font-bold text-on-surface">
            SELECT YOUR TERRAIN
          </h2>
          <p className="text-on-surface-variant font-label text-sm uppercase tracking-widest">
            Selecciona al menos 3 — {selectedCount}/3
          </p>
        </div>
      </div>

      {/* Category grid — tall image cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const isSelected = formData.selectedCategories.includes(cat.id);
          const Icon = iconMap[cat.icon.toLowerCase()] ?? Mountain;

          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-primary'
                  : 'hover:ring-2 hover:ring-primary/50'
              }`}
            >
              {/* Background — gradient with icon overlay */}
              <div
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                style={{
                  background:
                    categoryGradients[cat.slug] ??
                    `linear-gradient(160deg, ${cat.color}30 0%, ${cat.color}10 40%, #0c0f0a 100%)`,
                }}
              />

              {/* Large faded icon in the center */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Icon size={64} style={{ color: cat.color }} />
              </div>

              {/* Bottom gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent" />

              {/* Checkmark badge (selected) */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-4 right-4 bg-primary text-on-primary rounded-full p-1 shadow-xl"
                >
                  <Check size={16} strokeWidth={3} />
                </motion.div>
              )}

              {/* Category name at bottom-left */}
              <div className="absolute bottom-4 left-4">
                <span className="font-headline text-xl text-[#EDE9DF]">{cat.name}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );

  /* ---------------------------------------------------------------- */
  /*  Step 3 — LOCATE YOUR SQUAD                                       */
  /* ---------------------------------------------------------------- */
  const step3 = (
    <section className="w-full flex flex-col md:flex-row gap-12 items-center">
      {/* Left — text + GPS button */}
      <div className="flex-1 space-y-6">
        <h2 className="text-4xl font-headline font-bold text-on-surface">
          LOCATE YOUR SQUAD
        </h2>
        <p className="text-on-surface-variant leading-relaxed font-body">
          Aktivar works best when we know where the trails are. Enable location to see
          nearby groups and active routes.
        </p>

        {/* Location text input */}
        <div className="space-y-2">
          <label className={labelClasses}>
            <MapPin size={14} className="inline mr-1 -mt-0.5" />
            Ciudad o región
          </label>
          <input
            type="text"
            className={inputClasses}
            placeholder="Ej: Santiago, Chile"
            value={formData.location}
            onChange={(e) => update('location', e.target.value)}
          />
        </div>

        {/* GPS Button */}
        <button
          onClick={handleGPS}
          className="bg-surface-container-highest text-primary font-headline font-bold px-8 py-4 rounded-full flex items-center gap-3 cursor-pointer hover:bg-surface-container-high transition-colors"
        >
          <MapPin size={20} />
          ENABLE GPS
        </button>
      </div>

      {/* Right — map with pulsing dot */}
      <div className="flex-1 w-full aspect-square md:aspect-video rounded-3xl overflow-hidden bg-surface-container-high relative border border-outline-variant/15">
        <div className="w-full h-full">
          <ActivityMap
            activities={[]}
            singleMarker={
              userCoords
                ? {
                    lat: userCoords[0],
                    lng: userCoords[1],
                    label: formData.location || 'Tu ubicación',
                  }
                : undefined
            }
            center={userCoords ?? [-33.4489, -70.6693]}
            zoom={userCoords ? 13 : 4}
          />
        </div>

        {/* Pulsing dot overlay (when no coords yet) */}
        {!userCoords && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
              <div
                className="w-8 h-8 bg-primary rounded-full"
                style={{ boxShadow: '0 0 20px rgba(240,165,0,0.6)' }}
              />
            </div>
          </div>
        )}

        {/* GPS status label */}
        <div className="absolute bottom-4 right-4 bg-surface/80 backdrop-blur-sm px-4 py-2 rounded-lg font-label text-xs tracking-widest text-[#EDE9DF]">
          {gpsAcquiring
            ? 'GPS_SIGNAL: ACQUIRING...'
            : userCoords
              ? 'GPS_SIGNAL: LOCKED'
              : 'GPS_SIGNAL: WAITING...'}
        </div>
      </div>
    </section>
  );

  const steps = [step1, step2, step3];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0c0f0a]">
      {/* Mesh gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(at 0% 0%, rgba(240, 165, 0, 0.1) 0px, transparent 50%)',
            'radial-gradient(at 100% 100%, rgba(123, 218, 150, 0.05) 0px, transparent 50%)',
          ].join(', '),
        }}
      />

      {/* ---- Header: brand + progress dots ---- */}
      <header className="sticky top-0 w-full z-50 bg-[#11140f]/70 backdrop-blur-md flex justify-between items-center px-6 py-4">
        <div className="text-2xl font-black text-[#EDE9DF] tracking-tighter font-headline">
          Aktivar
        </div>
        <div className="flex items-center gap-2">
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                layout
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-8 bg-primary-container'
                    : 'w-2 bg-surface-container-highest'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* ---- Main content ---- */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto w-full relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full"
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ---- Footer ---- */}
      <footer className="p-6 md:p-12 flex justify-between items-center bg-surface-container-lowest relative z-10">
        <div className="hidden md:block">
          <p className="font-label text-xs text-on-surface-variant/40 tracking-[0.2em]">
            AKTIVAR // LATAM OUTDOORS
          </p>
        </div>
        <div className="flex gap-6 items-center">
          {currentStep > 0 && (
            <button
              onClick={prev}
              className="text-on-surface-variant font-label text-sm uppercase tracking-widest hover:text-on-surface transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          {currentStep === 2 ? (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="text-primary font-label text-sm uppercase tracking-widest font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Empezar a explorar
            </button>
          ) : (
            <button
              onClick={next}
              disabled={currentStep === 1 && selectedCount < 3}
              className="text-primary font-label text-sm uppercase tracking-widest font-bold cursor-pointer disabled:opacity-50"
            >
              {currentStep === 1 && selectedCount < 3 ? `Select ${3 - selectedCount} more` : 'Skip for now'}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
