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
