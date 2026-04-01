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
import { Mountain as MountainIcon, Music, Bike, Waves, Film, Plane, Users, Trophy, Tent, Zap } from 'lucide-react';
import api, { endpoints } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { categories } from '@/data/categories';

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
  mountain: MountainIcon,
  music: Music,
  bike: Bike,
  waves: Waves,
  film: Film,
  plane: Plane,
  users: Users,
  trophy: Trophy,
  tent: Tent,
  zap: Zap,
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [gpsAcquiring, setGpsAcquiring] = useState(false);
  const [customInterests, setCustomInterests] = useState<string[]>([]);

  /* helpers */
  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleCategory = (id: number) => setForm((prev) => ({ ...prev, selectedCategories: prev.selectedCategories.includes(id) ? prev.selectedCategories.filter((item) => item !== id) : [...prev.selectedCategories, id] }));

  const next = () => {
    if (step === 0) {
      if (!form.name.trim() || !form.email.includes('@') || form.password.length < 8) {
        toast.error('Completa nombre, email válido y contraseña de 8+ caracteres');
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
    setStep((current) => Math.min(current + 1, 2));
  };

  const complete = async () => {
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

      if (formData.location) {
        await api.patch(endpoints.myProfile, {
          location_name: formData.location.trim(),
        });
      }

      const userRes = await api.get(endpoints.me);
      storeLogin(userRes.data);
      toast.success('Cuenta creada');
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
        fallbackToBariloche,
      );
    } else {
      fallbackToBariloche();
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
      </header>

      <main className="mx-auto mt-10 max-w-6xl">
        {step === 0 && (
          <section className="grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <p className="section-kicker">Begin your journey</p>
              <h1 className="hero-title text-5xl text-on-surface md:text-7xl">Join the adventure</h1>
              <p className="max-w-xl text-on-surface-variant">Un onboarding más premium, con foco editorial y menos sensación de formulario genérico.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Rutas', '120+'],
                  ['Hosts', '48'],
                  ['Comunidades', '18'],
                ].map(([label, value]) => (
                  <div key={label} className="editorial-metric rounded-[1.35rem] px-4 py-4">
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
                    <p className="mt-2 font-headline text-3xl font-black tracking-tight text-primary">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="editorial-card-soft editorial-border relative overflow-hidden rounded-[2rem] p-6 md:p-8">
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 to-transparent" />
                <div className="relative flex h-full min-h-[20rem] flex-col justify-between rounded-[1.6rem] bg-[radial-gradient(circle_at_top,_rgba(255,197,108,0.14),_transparent_36%),linear-gradient(180deg,_rgba(17,20,15,0.1),_rgba(17,20,15,0.55)),linear-gradient(135deg,_#17202d_0%,_#415768_55%,_#19211c_100%)] p-6">
                  <div className="editorial-badge w-fit">Editorial reference</div>
                  <div className="max-w-xs">
                    <p className="font-headline text-4xl font-black uppercase leading-[0.92] tracking-tight text-on-surface">Go where the map gets interesting.</p>
                  </div>
                  <div className="rounded-[1.4rem] bg-surface-container/85 px-5 py-5 text-on-surface-variant backdrop-blur-sm">
                    <p className="text-lg italic text-on-surface">“The best views come after the hardest climbs.”</p>
                  </div>
                </div>
              </div>
              <div className="editorial-card rounded-[2rem] px-6 py-6 md:px-8 md:py-8 space-y-5">
                <label className="block space-y-3"><span className="section-kicker">Name</span><input className="editorial-input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Tu nombre" /></label>
                <label className="block space-y-3"><span className="section-kicker">Email address</span><input className="editorial-input" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="explorer@aktivar.com" /></label>
                <label className="block space-y-3"><span className="section-kicker">Password</span><input type="password" className="editorial-input" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Mínimo 8 caracteres" /></label>
                <p className="text-sm text-on-surface-variant">Al continuar, aceptas los términos de la expedición y activas recomendaciones más precisas desde el día uno.</p>
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
          </section>
        )}

        {step === 1 && (
            <section className="space-y-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                <p className="section-kicker">Step 02 / 03</p>
                <h1 className="hero-title text-4xl text-on-surface md:text-6xl">What fuels your soul?</h1>
                <p className="mt-3 text-on-surface-variant">Selecciona al menos 3 categorías para personalizar tus recomendaciones.</p>
                </div>
                <div className="editorial-badge w-fit">{form.selectedCategories.length} intereses elegidos</div>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => {
                const Icon = iconMap[category.icon.toLowerCase()] ?? MountainIcon;
                const selected = form.selectedCategories.includes(category.id);
                  return (
                    <button key={category.id} type="button" onClick={() => toggleCategory(category.id)} className={`relative overflow-hidden rounded-[1.75rem] border p-6 text-left cursor-pointer transition-transform hover:-translate-y-1 ${selected ? 'border-primary/20 bg-primary-container text-[#442c00]' : 'border-outline-variant/10 bg-surface-container text-on-surface'}`}>
                      <div className={`absolute inset-0 opacity-60 ${selected ? 'bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_35%)]' : 'bg-[radial-gradient(circle_at_top_right,_rgba(255,197,108,0.1),_transparent_32%)]'}`} />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`font-label text-[10px] uppercase tracking-[0.18em] ${selected ? 'text-[#5f3f00]' : 'text-on-surface-variant'}`}>Interés</p>
                          <h3 className="mt-3 font-headline text-3xl font-black uppercase tracking-tight">{category.name}</h3>
                        </div>
                        <div className={`rounded-full p-3 ${selected ? 'bg-white/35' : 'bg-surface-container-high'}`}><Icon size={22} /></div>
                      </div>
                      <p className={`relative mt-10 text-sm ${selected ? 'text-[#5f3f00]' : 'text-on-surface-variant'}`}>Construye un feed más afinado entre salidas, relatos y comunidad.</p>
                    </button>
                  );
                })}
            </div>
          </section>
        )}

        {step === 2 && (
            <section className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <p className="section-kicker">Final setup</p>
                <h1 className="hero-title text-4xl text-on-surface md:text-6xl">Set your basecamp</h1>
                <p className="text-on-surface-variant">Guarda una ubicación inicial para mejorar descubrimiento de actividades y transporte compartido.</p>
                <div className="editorial-card-soft editorial-border max-w-lg rounded-[1.7rem] px-6 py-6">
                  <p className="section-kicker">What unlocks next</p>
                  <p className="mt-3 text-on-surface-variant">Ajustaremos el mapa, comunidades sugeridas y relatos destacados según tu basecamp e intereses.</p>
                </div>
              </div>
              <div className="editorial-card rounded-[2rem] px-6 py-6 md:px-8 md:py-8 space-y-5">
                <label className="block space-y-3"><span className="section-kicker flex items-center gap-2"><MapPin size={14} /> Ubicación</span><input className="editorial-input" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Ciudad o basecamp" /></label>
                <div className="rounded-[1.5rem] bg-surface px-5 py-5">
                  <p className="section-kicker">Resumen</p>
                  <div className="mt-4 space-y-2 text-sm text-on-surface-variant">
                    <p><strong className="text-on-surface">Explorer:</strong> {form.name || '—'}</p>
                  <p><strong className="text-on-surface">Intereses:</strong> {form.selectedCategories.length}</p>
                  <p><strong className="text-on-surface">Basecamp:</strong> {form.location}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <div className="mx-auto mt-10 flex max-w-6xl items-center justify-between gap-3">
        <button type="button" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0} className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 px-5 py-3 font-label text-[10px] uppercase tracking-[0.16em] text-on-surface disabled:opacity-40 cursor-pointer"><ArrowLeft size={14} /> Atrás</button>
        <div className="flex items-center gap-3">
          <Link to="/login" className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant hover:text-on-surface">Ya tengo cuenta</Link>
          {step < 2 ? (
            <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-label text-[10px] font-bold uppercase tracking-[0.16em] text-[#442c00] cursor-pointer" style={{ background: 'linear-gradient(135deg, #ffc56c 0%, #f0a500 100%)' }}>
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button type="button" onClick={() => void complete()} disabled={loading} className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-label text-[10px] font-bold uppercase tracking-[0.16em] text-[#442c00] cursor-pointer disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #ffc56c 0%, #f0a500 100%)' }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Mountain size={14} />} Crear cuenta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
