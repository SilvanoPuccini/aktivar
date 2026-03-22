import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

import CTAButton from '@/components/CTAButton';
import api, { endpoints } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const inputClasses =
  'w-full bg-surface-container border border-[#514533] rounded-xl px-4 py-3 text-on-surface placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-200 font-body';

const labelClasses =
  'block font-label text-xs uppercase tracking-wider text-muted mb-2';

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
      // Get JWT token
      const tokenRes = await api.post(endpoints.login, { email, password });
      sessionStorage.setItem('aktivar_access_token', tokenRes.data.access);

      // Fetch user profile
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
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: '#0c0f0a' }}
    >
      {/* Background gradients */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 60% 50% at 85% 15%, rgba(255, 197, 108, 0.10) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 60% at 15% 85%, rgba(123, 218, 150, 0.07) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center space-y-2 mb-10">
          <h1 className="font-display text-5xl font-black text-on-surface tracking-tight">
            AKTIVAR
          </h1>
          <p className="font-body text-on-surface-variant text-lg">
            Inicia sesión en tu cuenta
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label className={labelClasses}>Email</label>
            <input
              type="email"
              className={inputClasses}
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div>
            <label className={labelClasses}>Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${inputClasses} pr-12`}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-on-surface transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <CTAButton
            label="Iniciar sesión"
            onClick={handleLogin}
            loading={loading}
            fullWidth
            icon={<LogIn size={16} />}
          />

          <p className="text-center text-sm text-muted font-body">
            ¿No tienes cuenta?{' '}
            <Link to="/onboarding" className="text-primary hover:underline font-semibold">
              Regístrate
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
