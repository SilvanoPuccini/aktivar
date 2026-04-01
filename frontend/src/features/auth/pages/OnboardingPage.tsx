import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, MapPin, Mountain } from 'lucide-react';
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
  const [form, setForm] = useState<OnboardingData>({
    name: '',
    email: '',
    password: '',
    selectedCategories: [],
    location: 'Bariloche, Argentina',
  });

  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleCategory = (id: number) => setForm((prev) => ({ ...prev, selectedCategories: prev.selectedCategories.includes(id) ? prev.selectedCategories.filter((item) => item !== id) : [...prev.selectedCategories, id] }));

  const next = () => {
    if (step === 0) {
      if (!form.name.trim() || !form.email.includes('@') || form.password.length < 8) {
        toast.error('Completa nombre, email válido y contraseña de 8+ caracteres');
        return;
      }
    }
    if (step === 1 && form.selectedCategories.length < 3) {
      toast.error('Selecciona al menos 3 intereses');
      return;
    }
    setStep((current) => Math.min(current + 1, 2));
  };

  const complete = async () => {
    setLoading(true);
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      await api.post(endpoints.register, { email: normalizedEmail, password: form.password, full_name: form.name.trim() });
      const tokenRes = await api.post(endpoints.login, { email: normalizedEmail, password: form.password });
      sessionStorage.setItem('aktivar_access_token', tokenRes.data.access);
      if (tokenRes.data.refresh) sessionStorage.setItem('aktivar_refresh_token', tokenRes.data.refresh);
      if (form.location.trim()) await api.patch(endpoints.myProfile, { location_name: form.location.trim() });
      const userRes = await api.get(endpoints.me);
      storeLogin(userRes.data);
      toast.success('Cuenta creada');
      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: Record<string, string[] | string> } };
      if (err.response?.status === 429) toast.error('Demasiados intentos. Intenta más tarde.');
      else if (err.response?.data?.email) toast.error('Ese email ya está registrado');
      else toast.error('No pudimos crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8 md:px-8 md:py-10">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div className="font-headline text-2xl font-black uppercase tracking-tight text-primary-container">Aktivar</div>
        <div className="flex gap-3">
          {[0, 1, 2].map((index) => <div key={index} className={`h-1.5 w-12 rounded-full ${index <= step ? 'bg-primary-container' : 'bg-surface-container-highest'}`} />)}
        </div>
      </header>

      <main className="mx-auto mt-10 max-w-6xl">
        {step === 0 && (
          <section className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-6">
              <p className="section-kicker">Begin your journey</p>
              <h1 className="hero-title text-5xl text-on-surface md:text-7xl">Join the adventure</h1>
              <p className="max-w-xl text-on-surface-variant">Un onboarding más premium, con foco editorial y menos sensación de formulario genérico.</p>
            </div>
            <div className="editorial-card rounded-[2rem] px-6 py-6 md:px-8 md:py-8 space-y-5">
              <label className="block space-y-3"><span className="section-kicker">Name</span><input className="editorial-input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Tu nombre" /></label>
              <label className="block space-y-3"><span className="section-kicker">Email address</span><input className="editorial-input" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="explorer@aktivar.com" /></label>
              <label className="block space-y-3"><span className="section-kicker">Password</span><input type="password" className="editorial-input" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Mínimo 8 caracteres" /></label>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-8">
            <div>
              <p className="section-kicker">Step 02 / 03</p>
              <h1 className="hero-title text-4xl text-on-surface md:text-6xl">What fuels your soul?</h1>
              <p className="mt-3 text-on-surface-variant">Selecciona al menos 3 categorías para personalizar tus recomendaciones.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => {
                const Icon = iconMap[category.icon.toLowerCase()] ?? MountainIcon;
                const selected = form.selectedCategories.includes(category.id);
                return (
                  <button key={category.id} type="button" onClick={() => toggleCategory(category.id)} className={`relative overflow-hidden rounded-[1.75rem] p-6 text-left cursor-pointer ${selected ? 'bg-primary-container text-[#442c00]' : 'bg-surface-container text-on-surface'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`font-label text-[10px] uppercase tracking-[0.18em] ${selected ? 'text-[#5f3f00]' : 'text-on-surface-variant'}`}>Interés</p>
                        <h3 className="mt-3 font-headline text-3xl font-black uppercase tracking-tight">{category.name}</h3>
                      </div>
                      <Icon size={22} />
                    </div>
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
