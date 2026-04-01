import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Mountain } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { endpoints } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const isValid = normalizedEmail.length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!isValid) {
      toast.error('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const tokenRes = await api.post(endpoints.login, { email: normalizedEmail, password });
      sessionStorage.setItem('aktivar_access_token', tokenRes.data.access);
      if (tokenRes.data.refresh) sessionStorage.setItem('aktivar_refresh_token', tokenRes.data.refresh);
      const userRes = await api.get(endpoints.me);
      storeLogin(userRes.data);

      toast.success('Bienvenido de vuelta!');
      navigate('/');
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 401) {
        toast.error('Email o contraseña incorrectos');
      } else if (error.response?.status === 429) {
        toast.error('Demasiados intentos. Espera unos minutos y vuelve a intentar.');
      } else {
        toast.error('Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between px-12 py-12">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-surface-container-high text-primary"><Mountain size={20} /></div>
          <div>
            <p className="font-headline text-3xl font-black uppercase tracking-tight text-primary-container">Aktivar</p>
            <p className="font-label text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">Digital expedition</p>
          </div>
        </div>
        <div className="space-y-8">
          <p className="section-kicker">Begin your journey</p>
          <h1 className="hero-title text-7xl text-on-surface">Join the adventure</h1>
          <p className="max-w-xl text-lg text-on-surface-variant">Un acceso más editorial para volver a tus rutas, grupos y próximas salidas sin fricción.</p>
          <div className="grid grid-cols-3 gap-4 max-w-xl">
            {[['2.4k', 'Actividades'], ['15k', 'Exploradores'], ['8', 'Países']].map(([value, label]) => (
              <div key={label} className="rounded-[1.6rem] bg-surface-container px-5 py-5">
                <p className="font-headline text-4xl font-black text-primary">{value}</p>
                <p className="mt-2 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Campfire atmosphere · warm contrast · editorial spacing</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 md:px-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-surface-container-high text-primary"><Mountain size={20} /></div>
            <p className="font-headline text-3xl font-black uppercase tracking-tight text-primary-container">Aktivar</p>
          </div>

          <div>
            <p className="section-kicker">Login / signup</p>
            <h1 className="hero-title text-5xl text-on-surface md:text-6xl">Bienvenido de vuelta</h1>
            <p className="mt-3 text-on-surface-variant">Inicia sesión y sigue tu próxima expedición.</p>
          </div>

          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); void handleLogin(); }}>
            <label className="block space-y-3"><span className="section-kicker">Email address</span><input type="email" className="editorial-input" placeholder="explorer@aktivar.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="block space-y-3"><span className="section-kicker">Password</span><div className="relative"><input type={showPassword ? 'text' : 'password'} className="editorial-input pr-14" placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            <button type="submit" disabled={loading || !isValid} className="flex w-full items-center justify-center gap-3 rounded-[1.35rem] px-6 py-4 font-label text-xs font-bold uppercase tracking-[0.18em] text-[#442c00] cursor-pointer disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #ffc56c 0%, #f0a500 100%)' }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? 'Ingresando' : 'Continue'}
            </button>
          </form>

          <div className="flex items-center justify-between text-sm text-on-surface-variant">
            <button type="button" onClick={() => toast('Escríbenos a soporte@aktivar.app', { icon: '📩' })} className="font-label text-[10px] uppercase tracking-[0.16em] text-primary cursor-pointer">Olvidé mi contraseña</button>
            <Link to="/onboarding" className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface hover:text-primary">Crear cuenta</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
