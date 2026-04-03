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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel - branding (desktop only) */}
      <section className="hidden lg:flex flex-col justify-between px-12 py-12">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-surface-container-high text-primary"><Mountain size={20} /></div>
          <div>
            <p className="font-headline text-3xl font-black uppercase tracking-tight text-primary">Aktivar</p>
            <p className="font-label text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">Digital expedition</p>
          </div>
        </div>
        <div className="space-y-8">
          <p className="section-kicker">Begin your journey</p>
          <h1 className="hero-title text-7xl text-on-surface">Join the adventure</h1>
          <p className="max-w-xl text-lg text-on-surface-variant">Crea tu cuenta y empieza a descubrir rutas, comunidades y próximas salidas.</p>
          <div className="grid grid-cols-3 gap-4 max-w-xl">
            {[['120+', 'Rutas'], ['48', 'Hosts'], ['18', 'Comunidades']].map(([value, label]) => (
              <div key={label} className="rounded-[0.75rem] bg-surface-container px-5 py-5">
                <p className="font-headline text-4xl font-black text-primary">{value}</p>
                <p className="mt-2 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Step {step + 1} / 3</p>
      </section>

      {/* Right panel - form */}
      <section className="flex items-center justify-center px-6 py-12 md:px-10">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile header */}
          <div className="space-y-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-surface-container-high text-primary"><Mountain size={20} /></div>
            <p className="font-headline text-3xl font-black uppercase tracking-tight text-primary">Aktivar</p>
          </div>

        {step === 0 && (
          <>
            <div>
              <p className="section-kicker">Step 01 / 03</p>
              <h1 className="hero-title text-4xl text-on-surface md:text-5xl">Crear cuenta</h1>
              <p className="mt-3 text-on-surface-variant">Completa tus datos para comenzar la expedición.</p>
            </div>
            <div className="space-y-5">
              <label className="block space-y-3">
                <span className="section-kicker">Nombre</span>
                <input className="editorial-input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Tu nombre" />
              </label>
              <label className="block space-y-3">
                <span className="section-kicker">Email</span>
                <input className="editorial-input" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="explorer@aktivar.com" />
              </label>
              <label className="block space-y-3">
                <span className="section-kicker">Contraseña</span>
                <input type="password" className="editorial-input" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Mínimo 8 caracteres" />
              </label>
              <p className="text-sm text-on-surface-variant">Al continuar, aceptas los términos y activas recomendaciones personalizadas.</p>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-kicker">Step 02 / 03</p>
                  <h1 className="hero-title text-4xl text-on-surface md:text-5xl">Tus intereses</h1>
                  <p className="mt-3 text-on-surface-variant">Selecciona al menos 3 categorías.</p>
                </div>
                <div className="editorial-badge shrink-0">{form.selectedCategories.length} elegidos</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const Icon = iconMap[category.icon.toLowerCase()] ?? Mountain;
                const selected = form.selectedCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`rounded-[0.75rem] border p-4 text-left cursor-pointer transition-colors ${
                      selected
                        ? 'border-primary/30 bg-primary-container text-[#442c00]'
                        : 'border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${selected ? 'bg-white/35' : 'bg-surface-container-high'}`}>
                        <Icon size={16} />
                      </div>
                      <span className="font-headline text-sm font-bold uppercase tracking-tight">{category.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <p className="section-kicker">Step 03 / 03</p>
              <h1 className="hero-title text-4xl text-on-surface md:text-5xl">Tu ubicación</h1>
              <p className="mt-3 text-on-surface-variant">Guarda tu ubicación para mejorar las recomendaciones.</p>
            </div>
            <div className="space-y-5">
              <label className="block space-y-3">
                <span className="section-kicker flex items-center gap-2"><MapPin size={14} /> Ubicación</span>
                <input className="editorial-input" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Ciudad o basecamp" />
              </label>
              <div className="rounded-[0.75rem] bg-surface-container px-5 py-5">
                <p className="section-kicker">Resumen</p>
                <div className="mt-4 space-y-2 text-sm text-on-surface-variant">
                  <p><strong className="text-on-surface">Nombre:</strong> {form.name || '—'}</p>
                  <p><strong className="text-on-surface">Intereses:</strong> {form.selectedCategories.length}</p>
                  <p><strong className="text-on-surface">Basecamp:</strong> {form.location}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3 pt-4">
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
      </section>
    </div>
  );
}
