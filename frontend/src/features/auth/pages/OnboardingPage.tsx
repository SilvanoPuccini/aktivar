import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { LucideIcon } from 'lucide-react';

import CTAButton from '@/components/CTAButton';
import ProgressDots from '@/components/ProgressDots';
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
/*  Shared classes                                                     */
/* ------------------------------------------------------------------ */
const inputClasses =
  'w-full bg-surface-container border border-[#514533] rounded-xl px-4 py-3 text-on-surface placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-200 font-body';

const labelClasses =
  'block font-label text-xs uppercase tracking-wider text-muted mb-2';

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

  const selectedCount = formData.selectedCategories.length;

  /* ---------------------------------------------------------------- */
  /*  Step 1 — Bienvenido a AKTIVAR                                    */
  /* ---------------------------------------------------------------- */
  const step1 = (
    <div className="space-y-8">
      {/* Logo / brand */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="font-display text-5xl font-black text-on-surface tracking-tight">
          AKTIVAR
        </h1>
        <p className="font-body text-on-surface-variant text-lg">
          Tu red social de aventuras
        </p>
      </div>

      {/* Form fields */}
      <div className="space-y-5">
        <div>
          <label className={labelClasses}>Nombre</label>
          <input
            type="text"
            className={inputClasses}
            placeholder="Tu nombre completo"
            value={formData.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClasses}>Email</label>
          <input
            type="email"
            className={inputClasses}
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>

        <div>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-on-surface transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      <CTAButton
        label="Continuar"
        onClick={next}
        fullWidth
        icon={<ArrowRight size={16} />}
      />

      <p className="text-center text-sm text-muted font-body">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-primary hover:underline font-semibold">
          Inicia sesión
        </Link>
      </p>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Step 2 — ¿Qué te interesa?                                      */
  /* ---------------------------------------------------------------- */
  const step2 = (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-display text-2xl font-bold text-on-surface">
          Elige tus intereses
        </h2>
        <p className="font-body text-sm text-on-surface-variant">
          Selecciona al menos 3 categorías
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => {
          const isSelected = formData.selectedCategories.includes(cat.id);
          const Icon = iconMap[cat.icon.toLowerCase()] ?? Mountain;

          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl p-5 transition-all duration-200 cursor-pointer select-none ${
                isSelected
                  ? 'bg-surface-container border-2 border-secondary'
                  : 'bg-surface-container border-2 border-transparent'
              }`}
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${cat.color}10, ${cat.color}05)`
                  : undefined,
              }}
            >
              {/* Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-secondary flex items-center justify-center"
                >
                  <Check size={12} className="text-surface" />
                </motion.div>
              )}

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <Icon size={22} style={{ color: cat.color }} />
              </div>

              <span
                className={`font-label text-sm tracking-wide ${
                  isSelected ? 'text-on-surface font-semibold' : 'text-on-surface-variant'
                }`}
              >
                {cat.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Selection count */}
      <p
        className={`text-center font-label text-sm tracking-wide ${
          selectedCount >= 3 ? 'text-secondary' : 'text-muted'
        }`}
      >
        {selectedCount}/3 seleccionadas
      </p>

      <CTAButton
        label="Continuar"
        onClick={next}
        fullWidth
        disabled={selectedCount < 3}
        icon={<ArrowRight size={16} />}
      />
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Step 3 — ¿Dónde estás?                                          */
  /* ---------------------------------------------------------------- */
  const step3 = (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-display text-2xl font-bold text-on-surface">
          Tu ubicación
        </h2>
        <p className="font-body text-sm text-on-surface-variant">
          Para mostrarte actividades cerca de ti
        </p>
      </div>

      {/* Location input */}
      <div>
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

      {/* Map */}
      <div className="rounded-2xl border border-[#514533] overflow-hidden h-48">
        <ActivityMap
          activities={[]}
          singleMarker={
            userCoords
              ? { lat: userCoords[0], lng: userCoords[1], label: formData.location || 'Tu ubicación' }
              : undefined
          }
          center={userCoords ?? [-33.4489, -70.6693]}
          zoom={userCoords ? 13 : 4}
        />
      </div>

      {/* Activate location button */}
      <CTAButton
        label="Usar mi ubicación"
        variant="secondary"
        onClick={() => {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setUserCoords([pos.coords.latitude, pos.coords.longitude]);
                update('location', `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
              },
              () => {
                update('location', 'Santiago, Chile');
                setUserCoords([-33.4489, -70.6693]);
              },
            );
          } else {
            update('location', 'Santiago, Chile');
            setUserCoords([-33.4489, -70.6693]);
          }
        }}
        fullWidth
        icon={<MapPin size={16} />}
      />

      {/* Final CTA */}
      <CTAButton
        label="Empezar a explorar"
        onClick={handleComplete}
        loading={loading}
        fullWidth
        icon={<ArrowRight size={16} />}
      />
    </div>
  );

  const steps = [step1, step2, step3];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: '#0c0f0a' }}
    >
      {/* Subtle background gradients */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 60% 50% at 85% 15%, rgba(255, 197, 108, 0.10) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 60% at 15% 85%, rgba(123, 218, 150, 0.07) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-lg mx-auto px-4 py-6">
        {/* Progress dots + back button */}
        <div className="flex flex-col items-center gap-4 mb-8">
          {currentStep > 0 && (
            <button
              onClick={prev}
              className="self-start text-muted hover:text-on-surface transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <ProgressDots
            steps={3}
            currentStep={currentStep}
            labels={['Cuenta', 'Intereses', 'Ubicación']}
          />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
