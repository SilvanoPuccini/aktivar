import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Plus,
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
  Zap,
  Loader2,
  User,
  Mail,
  Lock,
  Compass,
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
  location: 'Bariloche, Argentina',
};

/* ------------------------------------------------------------------ */
/*  Shared classes                                                     */
/* ------------------------------------------------------------------ */
const inputClasses =
  'w-full bg-surface-container-highest/60 border border-outline-variant/20 rounded-2xl px-5 py-4 text-on-surface placeholder:text-muted/60 focus:border-primary/60 focus:bg-surface-container-highest/80 focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 font-body text-[15px]';

const labelClasses =
  'block font-label text-[10px] uppercase tracking-[0.2em] text-muted mb-3';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

/* ------------------------------------------------------------------ */
/*  Icon map for category cards                                        */
/* ------------------------------------------------------------------ */
const iconMap: Record<string, LucideIcon> = {
  zap: Zap,
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
/*  Gradient backgrounds per category                                  */
/* ------------------------------------------------------------------ */
const categoryGradients: Record<string, string> = {
  running: 'linear-gradient(160deg, #5a3a00 0%, #352200 40%, #1a1100 100%)',
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
  const [customInterests, setCustomInterests] = useState<string[]>([]);

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
    if (currentStep === 0) {
      if (!formData.name.trim()) {
        toast.error('Ingresa tu nombre');
        return;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        toast.error('Ingresa un email válido');
        return;
      }
      if (formData.password.length < 8) {
        toast.error('La contraseña debe tener al menos 8 caracteres');
        return;
      }
    }
    if (currentStep === 1) {
      const totalSelected = formData.selectedCategories.length + customInterests.length;
      if (totalSelected < 3) {
        toast.error('Selecciona al menos 3 categorías');
        return;
      }
    }
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 2));
  };

  const prev = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const normalizedName = formData.name.trim();

      await api.post(endpoints.register, {
        email: normalizedEmail,
        password: formData.password,
        full_name: normalizedName,
      });

      const tokenRes = await api.post(endpoints.login, {
        email: normalizedEmail,
        password: formData.password,
      });
      sessionStorage.setItem('aktivar_access_token', tokenRes.data.access);
      if (tokenRes.data.refresh) {
        sessionStorage.setItem('aktivar_refresh_token', tokenRes.data.refresh);
      }

      if (formData.location) {
        await api.patch(endpoints.myProfile, {
          location_name: formData.location.trim(),
        });
      }

      const userRes = await api.get(endpoints.me);
      storeLogin(userRes.data);

      toast.success('Cuenta creada con éxito!');
      navigate('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[] | string>; status?: number } };
      const data = error.response?.data;
      if (data?.email) {
        toast.error('Este email ya está registrado');
      } else if (error.response?.status === 429) {
        toast.error('Demasiados intentos. Espera unos minutos y vuelve a intentar.');
      } else if (data?.phone) {
        toast.error(Array.isArray(data.phone) ? data.phone[0] : String(data.phone));
      } else if (data?.password) {
        toast.error(Array.isArray(data.password) ? data.password[0] : String(data.password));
      } else if (data?.detail) {
        toast.error(Array.isArray(data.detail) ? data.detail[0] : String(data.detail));
      } else if (error.response?.status === 500) {
        toast.error('Error interno del servidor al registrar. Intenta nuevamente en 1 minuto.');
      } else {
        toast.error('Error al crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGPS = async () => {
    setGpsAcquiring(true);
    const fallbackToBariloche = () => {
      update('location', 'Bariloche, Argentina');
      setUserCoords([-41.1335, -71.3103]);
      setGpsAcquiring(false);
    };

    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (result.state === 'denied') {
          toast('Permiso de ubicación bloqueado. Usando Bariloche por defecto.', { icon: '📍' });
          fallbackToBariloche();
          return;
        }
      } catch {
        // Continue with normal flow if permission query is unsupported
      }
    }

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
          update('location', 'Bariloche, Argentina');
          setUserCoords([-41.1335, -71.3103]);
          setGpsAcquiring(false);
        },
      );
    } else {
      update('location', 'Bariloche, Argentina');
      setUserCoords([-41.1335, -71.3103]);
      setGpsAcquiring(false);
    }
  };

  const addCustomInterest = () => {
    const interest = window.prompt('¿Qué otra actividad te apasiona?');
    if (!interest) return;
    const normalized = interest.trim();
    if (!normalized) return;
    if (customInterests.some((i) => i.toLowerCase() === normalized.toLowerCase())) {
      toast('Esa pasión ya está agregada', { icon: 'ℹ️' });
      return;
    }
    setCustomInterests((prev) => [...prev, normalized]);
  };

  const selectedCount = formData.selectedCategories.length + customInterests.length;

  /* ---------------------------------------------------------------- */
  /*  Step 1 — Create your account                                     */
  /* ---------------------------------------------------------------- */
  const step1 = (
    <section className="w-full space-y-10">
      {/* Hero headline */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight leading-[0.95] text-on-surface">
          Crea tu<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">
            cuenta.
          </span>
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg max-w-md font-body leading-relaxed">
          Únete a la comunidad outdoor más grande de Latinoamérica.
          Solo necesitamos lo básico para empezar.
        </p>
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        <div>
          <label className={labelClasses}>
            <User size={12} className="inline mr-1.5 -mt-0.5" />
            Nombre completo
          </label>
          <input
            type="text"
            className={inputClasses}
            placeholder="Ej: Catalina Reyes"
            value={formData.name}
            onChange={(e) => update('name', e.target.value)}
            autoComplete="name"
          />
        </div>

        <div>
          <label className={labelClasses}>
            <Mail size={12} className="inline mr-1.5 -mt-0.5" />
            Email
          </label>
          <input
            type="email"
            className={inputClasses}
            placeholder="tu@email.com"
            value={formData.email}
            onChange={(e) => update('email', e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className={labelClasses}>
            <Lock size={12} className="inline mr-1.5 -mt-0.5" />
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`${inputClasses} pr-14`}
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={(e) => update('password', e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-on-surface transition-colors p-1"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Password strength indicator */}
          <div className="mt-3 flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  formData.password.length >= (i + 1) * 3
                    ? i < 2
                      ? 'bg-error'
                      : i < 3
                        ? 'bg-primary'
                        : 'bg-secondary'
                    : 'bg-surface-container-highest'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 font-label text-[10px] tracking-wider text-muted">
            {formData.password.length === 0
              ? ''
              : formData.password.length < 6
                ? 'Muy corta'
                : formData.password.length < 8
                  ? 'Casi...'
                  : formData.password.length < 12
                    ? 'Buena'
                    : 'Excelente'}
          </p>
        </div>
      </div>

      {/* CTA */}
      <motion.button
        onClick={next}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full py-4 rounded-2xl font-headline font-extrabold text-base uppercase tracking-wider text-on-primary flex items-center justify-center gap-3 cursor-pointer transition-all"
        style={{
          background: 'linear-gradient(135deg, #ffc56c, #f0a500)',
          boxShadow: '0 8px 32px rgba(240, 165, 0, 0.25)',
        }}
      >
        Continuar
        <ArrowRight size={18} strokeWidth={2.5} />
      </motion.button>

      <p className="text-center text-sm text-muted font-body">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-primary hover:text-primary-container font-semibold transition-colors">
          Inicia sesión
        </Link>
      </p>
    </section>
  );

  /* ---------------------------------------------------------------- */
  /*  Step 2 — Select your interests                                   */
  /* ---------------------------------------------------------------- */
  const step2 = (
    <section className="w-full space-y-8">
      <div className="space-y-3">
        <h2 className="text-3xl md:text-4xl font-headline font-black text-on-surface tracking-tight">
          ¿Qué te <span className="text-primary">apasiona</span>?
        </h2>
        <p className="text-on-surface-variant font-body text-base">
          Selecciona al menos 3 categorías para personalizar tu experiencia.
        </p>
        {/* Counter */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-8 h-1.5 rounded-full transition-colors duration-300 ${
                  i < selectedCount ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              />
            ))}
          </div>
          <span className="font-label text-xs text-muted">
            {selectedCount}/3 mínimo
          </span>
        </div>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              className={`group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
                  : 'hover:ring-1 hover:ring-primary/30'
              }`}
            >
              {/* Background gradient */}
              <div
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                style={{
                  background:
                    categoryGradients[cat.slug] ??
                    `linear-gradient(160deg, ${cat.color}30 0%, ${cat.color}10 40%, #0c0f0a 100%)`,
                }}
              />

              {/* Large icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-15 group-hover:opacity-25 transition-opacity">
                <Icon size={56} style={{ color: cat.color }} />
              </div>

              {/* Bottom gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f0a] via-transparent to-transparent" />

              {/* Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-3 right-3 bg-primary text-on-primary rounded-full p-1.5 shadow-xl"
                >
                  <Check size={14} strokeWidth={3} />
                </motion.div>
              )}

              {/* Category name */}
              <div className="absolute bottom-3 left-3 right-3">
                <span className="font-headline text-base font-bold text-on-surface">{cat.name}</span>
              </div>
            </motion.button>
          );
        })}
        <motion.button
          type="button"
          onClick={addCustomInterest}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:ring-1 hover:ring-primary/40 bg-surface-container-highest/70 border border-outline-variant/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-secondary/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 rounded-2xl bg-surface/80 flex items-center justify-center border border-outline-variant/25">
              <Plus size={24} className="text-primary" />
            </div>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <span className="font-headline text-base font-bold text-on-surface">Agregar otra</span>
          </div>
        </motion.button>
      </div>

      {customInterests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customInterests.map((interest) => (
            <span
              key={interest}
              className="px-3 py-1.5 rounded-full bg-secondary/20 text-secondary font-label text-xs tracking-wider uppercase"
            >
              {interest}
            </span>
          ))}
        </div>
      )}
    </section>
  );

  /* ---------------------------------------------------------------- */
  /*  Step 3 — Location                                                */
  /* ---------------------------------------------------------------- */
  const step3 = (
    <section className="w-full space-y-8">
      <div className="space-y-3">
        <h2 className="text-3xl md:text-4xl font-headline font-black text-on-surface tracking-tight">
          ¿Desde <span className="text-secondary">dónde</span> exploras?
        </h2>
        <p className="text-on-surface-variant font-body text-base leading-relaxed">
          Aktivar funciona mejor cuando sabemos tu ubicación.
          Así te mostramos actividades y grupos cercanos.
        </p>
      </div>

      {/* Location input */}
      <div>
        <label className={labelClasses}>
          <MapPin size={12} className="inline mr-1.5 -mt-0.5" />
          Ciudad o región
        </label>
        <input
          type="text"
          className={inputClasses}
          placeholder="Ej: Bariloche, Argentina"
          value={formData.location}
          onChange={(e) => update('location', e.target.value)}
        />
      </div>

      {/* GPS Button */}
      <motion.button
        onClick={handleGPS}
        disabled={gpsAcquiring}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 text-on-surface font-headline font-bold text-sm uppercase tracking-wider cursor-pointer hover:bg-surface-container-high transition-all disabled:opacity-60"
      >
        {gpsAcquiring ? (
          <Loader2 size={18} className="animate-spin text-primary" />
        ) : (
          <MapPin size={18} className="text-primary" />
        )}
        {gpsAcquiring ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
      </motion.button>

      {/* Map */}
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-surface-container-high relative border border-outline-variant/15">
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
            center={userCoords ?? [-41.1335, -71.3103]}
            zoom={userCoords ? 13 : 4}
          />
        </div>

        {/* Pulsing dot overlay */}
        {!userCoords && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 bg-primary/15 rounded-full flex items-center justify-center animate-pulse">
              <div
                className="w-6 h-6 bg-primary rounded-full"
                style={{ boxShadow: '0 0 20px rgba(240,165,0,0.5)' }}
              />
            </div>
          </div>
        )}

        {/* GPS status */}
        <div className="absolute bottom-3 right-3 bg-surface/80 backdrop-blur-sm px-3 py-1.5 rounded-lg font-label text-[10px] tracking-[0.15em] text-on-surface-variant">
          {gpsAcquiring
            ? 'ADQUIRIENDO...'
            : userCoords
              ? 'UBICACIÓN FIJADA'
              : 'ESPERANDO...'}
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
      {/* Background mesh */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(at 0% 0%, rgba(240, 165, 0, 0.06) 0px, transparent 50%)',
            'radial-gradient(at 100% 100%, rgba(123, 218, 150, 0.04) 0px, transparent 50%)',
          ].join(', '),
        }}
      />

      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-[#0c0f0a]/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-6 py-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            {currentStep > 0 && (
              <button
                onClick={prev}
                className="p-2 -ml-2 rounded-xl hover:bg-surface-container-high/50 transition-colors cursor-pointer"
                aria-label="Volver"
              >
                <ArrowLeft size={20} className="text-on-surface" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Mountain size={20} className="text-primary" />
              <span className="font-headline text-lg font-black tracking-tight text-on-surface">
                Aktivar
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  layout
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-8 bg-primary'
                      : i < currentStep
                        ? 'w-4 bg-secondary'
                        : 'w-4 bg-surface-container-highest'
                  }`}
                />
              ))}
            </div>
            <span className="font-label text-[10px] text-muted tracking-wider">
              {currentStep + 1}/3
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 md:px-10 py-10 max-w-lg mx-auto w-full relative z-10">
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

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-outline-variant/10 bg-[#0c0f0a]/80 backdrop-blur-xl relative z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Compass size={14} className="text-secondary/60" />
            <span className="font-label text-[10px] text-muted/40 tracking-[0.15em] hidden md:block">
              AKTIVAR // LATAM OUTDOORS
            </span>
          </div>

          <div className="flex gap-4 items-center">
            {currentStep === 2 ? (
              <motion.button
                onClick={handleComplete}
                disabled={loading}
                whileHover={loading ? undefined : { scale: 1.02 }}
                whileTap={loading ? undefined : { scale: 0.98 }}
                className="px-8 py-3 rounded-2xl font-headline font-extrabold text-sm uppercase tracking-wider text-on-primary flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #ffc56c, #f0a500)',
                  boxShadow: '0 6px 24px rgba(240, 165, 0, 0.2)',
                }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Creando...' : 'Empezar a explorar'}
                {!loading && <ArrowRight size={16} />}
              </motion.button>
            ) : currentStep === 1 ? (
              <motion.button
                onClick={next}
                disabled={selectedCount < 3}
                whileHover={selectedCount < 3 ? undefined : { scale: 1.02 }}
                whileTap={selectedCount < 3 ? undefined : { scale: 0.98 }}
                className="px-8 py-3 rounded-2xl font-headline font-extrabold text-sm uppercase tracking-wider text-on-primary flex items-center gap-2 cursor-pointer disabled:opacity-40 transition-all"
                style={{
                  background: selectedCount >= 3
                    ? 'linear-gradient(135deg, #ffc56c, #f0a500)'
                    : 'rgba(255, 197, 108, 0.2)',
                  boxShadow: selectedCount >= 3 ? '0 6px 24px rgba(240, 165, 0, 0.2)' : 'none',
                  color: selectedCount >= 3 ? '#442c00' : 'rgba(255, 197, 108, 0.5)',
                }}
              >
                Continuar
                <ArrowRight size={16} />
              </motion.button>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
