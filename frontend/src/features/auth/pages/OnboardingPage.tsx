import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
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
  Compass,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { LucideIcon } from 'lucide-react';
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
  zap: Zap,
  compass: Compass,
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleCategory = (id: number) =>
    setForm((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(id)
        ? prev.selectedCategories.filter((item) => item !== id)
        : [...prev.selectedCategories, id],
    }));

  const next = () => {
    if (step === 0) {
      if (!form.name.trim() || !form.email.includes('@') || form.password.length < 8) {
        toast.error('Completa nombre, email válido y contraseña de 8+ caracteres');
        return;
      }
    }
    if (step === 1) {
      if (form.selectedCategories.length < 3) {
        toast.error('Selecciona al menos 3 categorías');
        return;
      }
    }
    setStep((current) => Math.min(current + 1, 2));
  };

  const complete = async () => {
    setLoading(true);
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const normalizedName = form.name.trim();

      await api.post(endpoints.register, {
        email: normalizedEmail,
        password: form.password,
        full_name: normalizedName,
      });

      const tokenRes = await api.post(endpoints.login, {
        email: normalizedEmail,
        password: form.password,
      });
      sessionStorage.setItem('aktivar_access_token', tokenRes.data.access);

      if (form.location) {
        await api.patch(endpoints.myProfile, {
          location_name: form.location.trim(),
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
      } else if (data?.password) {
        toast.error(Array.isArray(data.password) ? data.password[0] : String(data.password));
      } else if (data?.detail) {
        toast.error(Array.isArray(data.detail) ? data.detail[0] : String(data.detail));
      } else if (error.response?.status === 500) {
        toast.error('Error interno del servidor. Intenta nuevamente en 1 minuto.');
      } else {
        toast.error('Error al crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <header className="glass fixed inset-x-0 top-0 z-20 border-b border-outline-variant/10">
        <div className="premium-shell flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[0.75rem] bg-surface-container-high text-primary">
              <Mountain size={18} />
            </div>
            <div className="font-headline text-2xl font-black uppercase tracking-tight text-primary">Aktivar</div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
            Step {step + 1} / 3
          </div>
        </div>
      </header>

      <main className="mx-auto mt-28 w-full max-w-6xl px-6 md:px-8">
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
                  <div key={label} className="editorial-metric rounded-[0.75rem] px-4 py-4">
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
                    <p className="mt-2 font-headline text-3xl font-black tracking-tight text-primary">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="editorial-card rounded-[1rem] px-6 py-6 md:px-8 md:py-8 space-y-5">
              <label className="block space-y-3">
                <span className="section-kicker">Name</span>
                <input className="editorial-input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Tu nombre" />
              </label>
              <label className="block space-y-3">
                <span className="section-kicker">Email address</span>
                <input className="editorial-input" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="explorer@aktivar.com" />
              </label>
              <label className="block space-y-3">
                <span className="section-kicker">Password</span>
                <input type="password" className="editorial-input" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Mínimo 8 caracteres" />
              </label>
              <p className="text-sm text-on-surface-variant">Al continuar, aceptas los términos de la expedición y activas recomendaciones más precisas desde el día uno.</p>
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
                const Icon = iconMap[category.icon.toLowerCase()] ?? Mountain;
                const selected = form.selectedCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`relative overflow-hidden rounded-[1.75rem] border p-6 text-left cursor-pointer transition-transform hover:-translate-y-1 ${
                      selected
                        ? 'border-primary/20 bg-primary-container text-[#442c00]'
                        : 'border-outline-variant/10 bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`font-label text-[10px] uppercase tracking-[0.18em] ${selected ? 'text-[#5f3f00]' : 'text-on-surface-variant'}`}>
                          Interés
                        </p>
                        <h3 className="mt-3 font-headline text-3xl font-black uppercase tracking-tight">{category.name}</h3>
                      </div>
                      <div className={`rounded-full p-3 ${selected ? 'bg-white/35' : 'bg-surface-container-high'}`}>
                        <Icon size={22} />
                      </div>
                    </div>
                    <p className={`relative mt-10 text-sm ${selected ? 'text-[#5f3f00]' : 'text-on-surface-variant'}`}>
                      Construye un feed más afinado entre salidas, relatos y comunidad.
                    </p>
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
            <div className="editorial-card rounded-[1rem] px-6 py-6 md:px-8 md:py-8 space-y-5">
              <label className="block space-y-3">
                <span className="section-kicker flex items-center gap-2"><MapPin size={14} /> Ubicación</span>
                <input className="editorial-input" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Ciudad o basecamp" />
              </label>
              <div className="rounded-[0.875rem] bg-surface px-5 py-5">
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

      <div className="mx-auto mt-10 flex w-full max-w-6xl items-center justify-between gap-3 px-6 pb-10 md:px-8">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          disabled={step === 0}
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 px-5 py-3 font-label text-[10px] uppercase tracking-[0.16em] text-on-surface disabled:opacity-40 cursor-pointer"
        >
          <ArrowLeft size={14} /> Atrás
        </button>
        <div className="flex items-center gap-3">
          <Link to="/login" className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant hover:text-on-surface">
            Ya tengo cuenta
          </Link>
          {step < 2 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-label text-[10px] font-bold uppercase tracking-[0.16em] text-[#442c00] cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #ffc56c 0%, #f0a500 100%)' }}
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void complete()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-label text-[10px] font-bold uppercase tracking-[0.16em] text-[#442c00] cursor-pointer disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #ffc56c 0%, #f0a500 100%)' }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Mountain size={14} />} Crear cuenta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
