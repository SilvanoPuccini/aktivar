import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, ArrowRight, Mountain, Compass, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import api, { endpoints } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const inputClasses =
  'w-full bg-surface-container-highest/60 border border-outline-variant/20 rounded-2xl px-5 py-4 text-on-surface placeholder:text-muted/60 focus:border-primary/60 focus:bg-surface-container-highest/80 focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 font-body text-[15px]';

const labelClasses =
  'block font-label text-[10px] uppercase tracking-[0.2em] text-muted mb-3';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const tokenRes = await api.post(endpoints.login, { email, password });
      sessionStorage.setItem('aktivar_access_token', tokenRes.data.access);

      const userRes = await api.get(endpoints.me);
      storeLogin(userRes.data);

      toast.success('Bienvenido de vuelta!');
      navigate('/');
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 401) {
        toast.error('Email o contraseña incorrectos');
      } else {
        toast.error('Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex" style={{ backgroundColor: '#0c0f0a' }}>
      {/* Background ambient gradients */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 70% 60% at 80% 10%, rgba(255, 197, 108, 0.08) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 70% at 10% 90%, rgba(123, 218, 150, 0.05) 0%, transparent 70%)',
            'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(255, 197, 108, 0.03) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      {/* Left side — Hero visual (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        {/* Large background gradient orb */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(255,197,108,0.4) 0%, rgba(240,165,0,0.1) 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        <motion.div
          className="relative z-10 text-center space-y-8 px-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo mark */}
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center backdrop-blur-sm border border-primary/10">
            <Mountain size={36} className="text-primary" />
          </div>

          <h2 className="font-headline text-5xl font-black tracking-tight text-on-surface leading-[1.1]">
            Encuentra tu<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">
              próxima aventura
            </span>
          </h2>

          <p className="text-on-surface-variant text-lg leading-relaxed max-w-md mx-auto font-body">
            Conecta con personas que comparten tu pasión por explorar.
            Actividades, transporte y comunidad en un solo lugar.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {['Running', 'Trekking', 'Ciclismo', 'Surf', 'Camping'].map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 rounded-full bg-surface-container-high/50 border border-outline-variant/10 text-on-surface-variant font-label text-xs tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 pt-6">
            <div className="text-center">
              <span className="font-headline text-3xl font-black text-primary">2.4k+</span>
              <p className="font-label text-[10px] uppercase tracking-[0.2em] text-muted mt-1">Actividades</p>
            </div>
            <div className="text-center">
              <span className="font-headline text-3xl font-black text-secondary">15k+</span>
              <p className="font-label text-[10px] uppercase tracking-[0.2em] text-muted mt-1">Exploradores</p>
            </div>
            <div className="text-center">
              <span className="font-headline text-3xl font-black text-primary">8</span>
              <p className="font-label text-[10px] uppercase tracking-[0.2em] text-muted mt-1">Países</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side — Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <motion.div
          className="w-full max-w-[420px] space-y-10"
          initial="hidden"
          animate="visible"
        >
          {/* Mobile logo */}
          <motion.div className="lg:hidden text-center space-y-3" custom={0} variants={fadeUp}>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center border border-primary/10">
              <Mountain size={28} className="text-primary" />
            </div>
          </motion.div>

          {/* Header */}
          <motion.div className="space-y-3" custom={1} variants={fadeUp}>
            <h1 className="font-headline text-4xl lg:text-5xl font-black text-on-surface tracking-tight">
              Bienvenido<br />
              <span className="text-primary">de vuelta</span>
            </h1>
            <p className="font-body text-on-surface-variant text-base">
              Inicia sesión para continuar tu aventura
            </p>
          </motion.div>

          {/* Form */}
          <motion.div className="space-y-7" custom={2} variants={fadeUp}>
            {/* Email */}
            <div>
              <label className={labelClasses}>Email</label>
              <input
                type="email"
                className={inputClasses}
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={labelClasses + ' mb-0'}>Contraseña</label>
                <button
                  type="button"
                  className="font-label text-[10px] uppercase tracking-[0.15em] text-primary hover:text-primary-container transition-colors"
                >
                  Olvidé mi contraseña
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClasses} pr-14`}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  autoComplete="current-password"
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
            </div>

            {/* Login button */}
            <motion.button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              whileHover={loading ? undefined : { scale: 1.01 }}
              whileTap={loading ? undefined : { scale: 0.99 }}
              className="w-full py-4 rounded-2xl font-headline font-extrabold text-base uppercase tracking-wider text-on-primary flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #ffc56c, #f0a500)',
                boxShadow: '0 8px 32px rgba(240, 165, 0, 0.25)',
              }}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </motion.button>
          </motion.div>

          {/* Divider */}
          <motion.div className="flex items-center gap-4" custom={3} variants={fadeUp}>
            <div className="flex-1 h-px bg-outline-variant/20" />
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-muted">o continúa con</span>
            <div className="flex-1 h-px bg-outline-variant/20" />
          </motion.div>

          {/* Social login buttons */}
          <motion.div className="grid grid-cols-2 gap-3" custom={4} variants={fadeUp}>
            <button
              type="button"
              onClick={() => toast('Google Login próximamente', { icon: 'soon' })}
              className="flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-surface-container-high/40 border border-outline-variant/15 text-on-surface/50 font-body text-sm font-medium transition-all cursor-pointer relative overflow-hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-50">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
              <span className="absolute top-1.5 right-1.5 font-label text-[8px] uppercase tracking-wider text-muted bg-surface-container-highest/80 px-1.5 py-0.5 rounded-full">Pronto</span>
            </button>
            <button
              type="button"
              onClick={() => toast('Apple Login próximamente', { icon: 'soon' })}
              className="flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-surface-container-high/40 border border-outline-variant/15 text-on-surface/50 font-body text-sm font-medium transition-all cursor-pointer relative overflow-hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="opacity-50">
                <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.18 0-.36-.02-.53-.06-.01-.18-.04-.56-.04-.95 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.22.05.45.05.69zm4.565 17.05c-.413.967-1.09 1.85-1.796 2.6-.65.69-1.46 1.54-2.68 1.54-1.03 0-1.72-.66-2.75-.68-1.08-.02-1.73.66-2.78.7-1.19.04-2.09-.84-2.74-1.53-1.88-2-3.33-5.66-1.39-8.13.96-1.22 2.5-1.98 4.02-2 1.07-.02 2.08.72 2.73.72.64 0 1.85-.89 3.12-.76.53.02 2.02.21 2.98 1.61-.08.05-1.78 1.04-1.76 3.1.02 2.46 2.16 3.28 2.19 3.29-.02.06-.34 1.18-1.12 2.34z"/>
              </svg>
              Apple
              <span className="absolute top-1.5 right-1.5 font-label text-[8px] uppercase tracking-wider text-muted bg-surface-container-highest/80 px-1.5 py-0.5 rounded-full">Pronto</span>
            </button>
          </motion.div>

          {/* Register link */}
          <motion.p
            className="text-center font-body text-sm text-muted pt-2"
            custom={5}
            variants={fadeUp}
          >
            ¿No tienes cuenta?{' '}
            <Link
              to="/onboarding"
              className="text-primary hover:text-primary-container font-semibold transition-colors inline-flex items-center gap-1"
            >
              Regístrate
              <ArrowRight size={14} />
            </Link>
          </motion.p>

          {/* Footer badge */}
          <motion.div className="flex justify-center pt-4" custom={6} variants={fadeUp}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container/30 border border-outline-variant/10">
              <Compass size={14} className="text-secondary" />
              <span className="font-label text-[10px] uppercase tracking-[0.15em] text-muted">
                Aktivar · LATAM Outdoors
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
