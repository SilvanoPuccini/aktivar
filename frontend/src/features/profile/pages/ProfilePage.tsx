import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Mountain,
  Trophy,
  Zap,
  Camera,
  CheckCircle,
  LogOut,
  Edit3,
  MapPin,
  Instagram,
  Globe,
  X,
  Save,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrentUser } from '@/services/hooks';
import { useAuthStore } from '@/stores/authStore';
import api, { endpoints } from '@/services/api';

const badgeIconMap: Record<string, React.ReactNode> = {
  'mountain-snow': <Mountain size={18} />,
  star: <Star size={18} />,
  trophy: <Trophy size={18} />,
  compass: <Mountain size={18} />,
  flag: <Trophy size={18} />,
  car: <Zap size={18} />,
  route: <Zap size={18} />,
};

const badgeColorMap: Record<string, string> = {
  'mountain-snow': 'bg-secondary/15 text-secondary',
  star: 'bg-primary/15 text-primary',
  trophy: 'bg-primary/15 text-primary',
  compass: 'bg-secondary/15 text-secondary',
  flag: 'bg-primary/15 text-primary',
  car: 'bg-primary/15 text-primary',
  route: 'bg-secondary/15 text-secondary',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const { data: user, isLoading } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="animate-pulse text-muted">Cargando perfil...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 gap-4">
        <h2 className="font-headline text-xl font-bold text-on-surface">Inicia sesión</h2>
        <p className="text-sm text-muted text-center">Necesitas una cuenta para ver tu perfil.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 rounded-full font-headline font-bold text-sm text-on-primary cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #ffc56c, #f0a500)' }}
        >
          Iniciar sesión
        </button>
      </div>
    );
  }
  const { profile } = user;

  // Edit form state
  const [editBio, setEditBio] = useState(user.bio);
  const [editLocation, setEditLocation] = useState(profile.location_name);
  const [editInstagram, setEditInstagram] = useState(profile.instagram);
  const [editWebsite, setEditWebsite] = useState(profile.website);

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch(endpoints.myProfile, {
        bio: editBio,
        location_name: editLocation,
        instagram: editInstagram,
        website: editWebsite,
      });
      toast.success('Perfil actualizado');
      setIsEditing(false);
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const rating = profile?.avg_rating ?? 0;
  const reviewCount = profile?.total_activities ?? 0;
  const filledStars = Math.floor(rating);

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
  };

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#0c0f0a]/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl hover:bg-surface-container-high/50 transition-colors cursor-pointer"
              aria-label="Volver"
            >
              <ArrowLeft size={20} className="text-on-surface" />
            </button>
            <span className="font-headline text-lg font-black tracking-tight text-on-surface">
              Perfil
            </span>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                } else {
                  setEditBio(user.bio);
                  setEditLocation(profile.location_name);
                  setEditInstagram(profile.instagram);
                  setEditWebsite(profile.website);
                  setIsEditing(true);
                }
              }}
              className="p-2 rounded-xl hover:bg-surface-container-high/50 transition-colors cursor-pointer"
            >
              {isEditing ? <X size={20} className="text-muted" /> : <Edit3 size={20} className="text-primary" />}
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6">
        {/* Profile Header */}
        <motion.section
          className="pt-8 pb-10 flex flex-col items-center text-center"
          initial="hidden"
          animate="show"
        >
          {/* Avatar */}
          <motion.div
            className="relative mb-6"
            custom={0}
            variants={fadeUp}
          >
            <div className="h-28 w-28 rounded-full p-[3px] bg-gradient-to-tr from-primary via-primary-container to-secondary">
              <img
                src={user.avatar}
                alt={user.full_name}
                className="h-full w-full rounded-full border-[3px] border-surface object-cover"
              />
            </div>
            {(user.is_verified_email || user.role === 'organizer') && (
              <div className="absolute bottom-0 right-0 rounded-full border-[3px] border-surface bg-primary p-1.5 text-on-primary">
                <CheckCircle size={14} />
              </div>
            )}
            {isAuthenticated && (
              <button className="absolute bottom-0 left-0 rounded-full border-[3px] border-surface bg-surface-container-high p-1.5 text-muted hover:text-on-surface transition-colors cursor-pointer">
                <Camera size={14} />
              </button>
            )}
          </motion.div>

          {/* Name */}
          <motion.h1
            className="mb-2 font-headline text-3xl font-extrabold tracking-tight text-on-surface"
            custom={1}
            variants={fadeUp}
          >
            {user.full_name}
          </motion.h1>

          {/* Role badge */}
          <motion.div custom={2} variants={fadeUp} className="mb-3">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label text-[10px] uppercase tracking-[0.15em] font-bold">
              {user.role === 'organizer' ? 'Organizador' : user.role === 'driver' ? 'Conductor' : 'Explorador'}
            </span>
          </motion.div>

          {/* Star rating */}
          <motion.div
            className="mb-5 flex items-center justify-center gap-2"
            custom={3}
            variants={fadeUp}
          >
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={`${i < filledStars ? 'text-primary fill-primary' : 'text-surface-container-highest'}`}
                />
              ))}
            </div>
            <span className="font-label text-xs text-muted">
              {rating} ({reviewCount})
            </span>
          </motion.div>

          {/* Bio */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit-bio"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full max-w-md space-y-4 mb-8"
              >
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-container-highest/60 border border-outline-variant/20 rounded-2xl px-4 py-3 text-on-surface text-sm placeholder:text-muted/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none resize-none font-body"
                  placeholder="Tu bio..."
                />
                <div className="grid grid-cols-1 gap-3">
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-3.5 text-muted" />
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full bg-surface-container-highest/60 border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-on-surface text-sm placeholder:text-muted/60 focus:border-primary/60 outline-none font-body"
                      placeholder="Ubicación"
                    />
                  </div>
                  <div className="relative">
                    <Instagram size={16} className="absolute left-4 top-3.5 text-muted" />
                    <input
                      type="text"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      className="w-full bg-surface-container-highest/60 border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-on-surface text-sm placeholder:text-muted/60 focus:border-primary/60 outline-none font-body"
                      placeholder="@instagram"
                    />
                  </div>
                  <div className="relative">
                    <Globe size={16} className="absolute left-4 top-3.5 text-muted" />
                    <input
                      type="text"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      className="w-full bg-surface-container-highest/60 border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-on-surface text-sm placeholder:text-muted/60 focus:border-primary/60 outline-none font-body"
                      placeholder="https://tusitio.com"
                    />
                  </div>
                </div>
                <motion.button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-wider text-on-primary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #ffc56c, #f0a500)',
                    boxShadow: '0 4px 16px rgba(240, 165, 0, 0.2)',
                  }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="view-bio" className="mb-8 space-y-3 max-w-md">
                <p className="font-body text-on-surface-variant leading-relaxed text-sm">
                  {user.bio}
                </p>
                {/* Location & social */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted">
                  {profile.location_name && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {profile.location_name}
                    </span>
                  )}
                  {profile.instagram && (
                    <span className="flex items-center gap-1">
                      <Instagram size={12} />
                      {profile.instagram}
                    </span>
                  )}
                  {profile.website && (
                    <span className="flex items-center gap-1">
                      <Globe size={12} />
                      {profile.website.replace('https://', '')}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <motion.div
            className="w-full max-w-md grid grid-cols-3 gap-3"
            custom={5}
            variants={fadeUp}
          >
            <div className="flex flex-col items-center py-5 rounded-2xl bg-surface-container/60 border border-outline-variant/10">
              <span className="font-headline text-2xl font-black text-primary">
                {profile.total_activities}
              </span>
              <span className="font-label text-[9px] uppercase tracking-[0.15em] text-muted mt-1">
                Actividades
              </span>
            </div>
            <div className="flex flex-col items-center py-5 rounded-2xl bg-surface-container/60 border border-outline-variant/10">
              <span className="font-headline text-2xl font-black text-primary">
                {profile.total_km >= 1000
                  ? `${(profile.total_km / 1000).toFixed(1)}k`
                  : profile.total_km.toLocaleString()}
              </span>
              <span className="font-label text-[9px] uppercase tracking-[0.15em] text-muted mt-1">
                KM
              </span>
            </div>
            <div className="flex flex-col items-center py-5 rounded-2xl bg-surface-container/60 border border-outline-variant/10">
              <span className="font-headline text-2xl font-black text-primary">
                {profile.total_people_met}
              </span>
              <span className="font-label text-[9px] uppercase tracking-[0.15em] text-muted mt-1">
                Personas
              </span>
            </div>
          </motion.div>
        </motion.section>

        {/* Divider */}
        <div className="h-px bg-outline-variant/10 my-2" />

        {/* Achievements */}
        {profile.badges.length > 0 && (
          <motion.section
            className="py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="mb-5 font-label text-[10px] uppercase tracking-[0.2em] text-muted">
              Logros
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar -mx-2 px-2">
              {profile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-shrink-0 items-center gap-2.5 rounded-2xl bg-surface-container/60 border border-outline-variant/10 py-2.5 pl-2.5 pr-5"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      badgeColorMap[badge.icon] ?? 'bg-primary/15 text-primary'
                    }`}
                  >
                    {badgeIconMap[badge.icon] ?? <Trophy size={18} />}
                  </div>
                  <div>
                    <span className="font-label text-xs font-bold text-on-surface block leading-tight">
                      {badge.name}
                    </span>
                    <span className="font-label text-[9px] text-muted">{badge.description.slice(0, 30)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Divider */}
        <div className="h-px bg-outline-variant/10 my-2" />

        {/* Photo Grid */}
        <motion.section
          className="py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <div className="mb-5 flex items-end justify-between">
            <h3 className="font-label text-[10px] uppercase tracking-[0.2em] text-muted">
              Recuerdos del trail
            </h3>
            <span className="cursor-pointer font-label text-[10px] uppercase tracking-[0.15em] text-primary hover:text-primary-container transition-colors">
              Ver todo
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-surface-container/40 border border-outline-variant/10 border-dashed cursor-pointer hover:bg-surface-container/60 transition-colors col-span-3">
              <div className="text-center py-8">
                <Camera size={22} className="mx-auto mb-2 text-primary/60" />
                <p className="font-label text-xs text-muted">
                  Las fotos de tus actividades aparecerán aquí
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Auth CTAs */}
        <div className="py-8 space-y-3">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-error/10 border border-error/20 text-error font-label text-sm font-bold uppercase tracking-wider cursor-pointer hover:bg-error/15 transition-all"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          ) : (
            <div className="space-y-3">
              <motion.button
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 rounded-2xl font-headline font-extrabold text-sm uppercase tracking-wider text-on-primary flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #ffc56c, #f0a500)',
                  boxShadow: '0 6px 24px rgba(240, 165, 0, 0.2)',
                }}
              >
                Iniciar sesión
              </motion.button>
              <button
                onClick={() => navigate('/onboarding')}
                className="w-full py-3.5 rounded-2xl bg-transparent border border-outline-variant/20 text-on-surface font-label text-sm font-bold uppercase tracking-wider cursor-pointer hover:bg-surface-container/50 transition-all"
              >
                Crear cuenta
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
