import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
import { useCurrentUser, useUploadImage } from '@/services/hooks';
import { useAuthStore } from '@/stores/authStore';
import api, { endpoints } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const { isAuthenticated, logout } = useAuthStore();
  const { data: user, isLoading } = useCurrentUser();
  const uploadMutation = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editWebsite, setEditWebsite] = useState('');

  useEffect(() => {
    if (user) {
      setEditBio(user.profile.bio_extended ?? user.bio ?? '');
      setEditLocation(user.profile.location_name ?? '');
      setEditInstagram(user.profile.instagram ?? '');
      setEditWebsite(user.profile.website ?? '');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-surface">
        <div className="animate-pulse text-muted">Cargando perfil...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-surface px-6 gap-6">
        <h2 className="font-headline text-2xl font-bold text-on-surface">Inicia sesión</h2>
        <p className="text-sm text-muted text-center max-w-sm">Necesitas una cuenta para ver tu perfil.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-3.5 rounded-full font-headline font-bold text-sm text-on-primary cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #ffc56c, #f0a500)' }}
        >
          Iniciar sesión
        </button>
      </div>
    );
  }
  const { profile } = user;

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch(endpoints.myProfile, {
        bio_extended: editBio,
        location_name: editLocation,
        instagram: editInstagram,
        website: editWebsite,
      });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Perfil actualizado');
      setIsEditing(false);
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const onAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUpdatingAvatar(true);
    uploadMutation.mutate(file, {
      onSuccess: async (result) => {
        try {
          await api.patch(endpoints.myAvatar, { avatar: result.url });
          await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          toast.success('Foto de perfil actualizada');
        } catch {
          toast.error('No se pudo guardar la foto de perfil');
        } finally {
          setUpdatingAvatar(false);
        }
      },
      onError: () => {
        setUpdatingAvatar(false);
        toast.error('No se pudo subir la imagen');
      },
    });
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
    <div className="min-h-[60vh] bg-surface pb-28 md:pb-12">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onAvatarSelected}
      />
      {/* Page header - desktop */}
      <div className="max-w-4xl mx-auto px-6 md:px-8 pt-6 md:pt-10 pb-4 flex items-center justify-between">
        <h1 className="font-headline text-2xl md:text-3xl font-black tracking-tight text-on-surface">
          Mi Perfil
        </h1>
        {isAuthenticated && (
          <button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                setEditBio(profile.bio_extended ?? user.bio ?? '');
                setEditLocation(profile.location_name);
                setEditInstagram(profile.instagram);
                setEditWebsite(profile.website);
                setIsEditing(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-surface-container-high/50 transition-colors cursor-pointer border border-outline-variant/15"
          >
            {isEditing ? (
              <>
                <X size={16} className="text-muted" />
                <span className="text-sm text-muted font-medium">Cancelar</span>
              </>
            ) : (
              <>
                <Edit3 size={16} className="text-primary" />
                <span className="text-sm text-primary font-medium">Editar</span>
              </>
            )}
          </button>
        )}
      </div>

      <main className="mx-auto max-w-4xl px-6 md:px-8">
        {/* Profile content - two column on desktop */}
        <div className="flex flex-col md:flex-row gap-10 md:gap-12">
          {/* Left column: Avatar + Info */}
          <motion.div
            className="md:w-80 shrink-0 flex flex-col items-center md:items-start text-center md:text-left"
            initial="hidden"
            animate="show"
          >
            {/* Avatar */}
            <motion.div className="relative mb-6" custom={0} variants={fadeUp}>
              <div className="h-32 w-32 md:h-36 md:w-36 rounded-2xl p-[3px] bg-gradient-to-tr from-primary via-primary-container to-secondary">
                <img
                  src={user.avatar}
                  alt={user.full_name}
                  className="h-full w-full rounded-2xl border-[3px] border-surface object-cover"
                />
              </div>
              {(user.is_verified_email || user.role === 'organizer') && (
                <div className="absolute -bottom-1 -right-1 rounded-full border-[3px] border-surface bg-primary p-1.5 text-on-primary">
                  <CheckCircle size={14} />
                </div>
              )}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleAvatarUpload}
                  disabled={updatingAvatar || uploadMutation.isPending}
                  className="absolute -bottom-1 -left-1 rounded-full border-[3px] border-surface bg-surface-container-high p-1.5 text-muted hover:text-on-surface transition-colors cursor-pointer disabled:opacity-50"
                >
                  {updatingAvatar || uploadMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Camera size={14} />
                  )}
                </button>
              )}
            </motion.div>

            {/* Name */}
            <motion.h2
              className="mb-2 font-headline text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface"
              custom={1}
              variants={fadeUp}
            >
              {user.full_name}
            </motion.h2>

            {/* Role badge */}
            <motion.div custom={2} variants={fadeUp} className="mb-3">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label text-[10px] uppercase tracking-[0.15em] font-bold">
                {user.role === 'organizer' ? 'Organizador' : user.role === 'driver' ? 'Conductor' : 'Explorador'}
              </span>
            </motion.div>

            {/* Star rating */}
            <motion.div
              className="mb-5 flex items-center gap-2"
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
                  className="w-full space-y-4 mb-6"
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
                <motion.div key="view-bio" className="mb-6 space-y-3 w-full">
                  <p className="font-body text-on-surface-variant leading-relaxed text-sm">
                    {user.bio}
                  </p>
                  <div className="flex flex-wrap items-center md:justify-start justify-center gap-4 text-xs text-muted">
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

            {/* Auth actions */}
            <div className="w-full space-y-3 mt-2">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-error/10 border border-error/20 text-error font-label text-sm font-bold uppercase tracking-wider cursor-pointer hover:bg-error/15 transition-all"
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
          </motion.div>

          {/* Right column: Stats + Badges + Photos */}
          <div className="flex-1 space-y-8">
            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-4"
              custom={5}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <div className="flex flex-col items-center py-6 rounded-2xl bg-surface-container/60 border border-outline-variant/10">
                <span className="font-headline text-3xl font-black text-primary">
                  {profile.total_activities}
                </span>
                <span className="font-label text-[10px] uppercase tracking-[0.15em] text-muted mt-1">
                  Actividades
                </span>
              </div>
              <div className="flex flex-col items-center py-6 rounded-2xl bg-surface-container/60 border border-outline-variant/10">
                <span className="font-headline text-3xl font-black text-primary">
                  {profile.total_km >= 1000
                    ? `${(profile.total_km / 1000).toFixed(1)}k`
                    : profile.total_km.toLocaleString()}
                </span>
                <span className="font-label text-[10px] uppercase tracking-[0.15em] text-muted mt-1">
                  KM
                </span>
              </div>
              <div className="flex flex-col items-center py-6 rounded-2xl bg-surface-container/60 border border-outline-variant/10">
                <span className="font-headline text-3xl font-black text-primary">
                  {profile.total_people_met}
                </span>
                <span className="font-label text-[10px] uppercase tracking-[0.15em] text-muted mt-1">
                  Personas
                </span>
              </div>
            </motion.div>

            {/* Divider */}
            <div className="h-px bg-outline-variant/10" />

            {/* Achievements */}
            {profile.badges.length > 0 && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="mb-5 font-label text-[10px] uppercase tracking-[0.2em] text-muted">
                  Logros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profile.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 rounded-2xl bg-surface-container/60 border border-outline-variant/10 py-3 pl-3 pr-5"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          badgeColorMap[badge.icon] ?? 'bg-primary/15 text-primary'
                        }`}
                      >
                        {badgeIconMap[badge.icon] ?? <Trophy size={18} />}
                      </div>
                      <div>
                        <span className="font-label text-sm font-bold text-on-surface block leading-tight">
                          {badge.name}
                        </span>
                        <span className="font-label text-[10px] text-muted">{badge.description.slice(0, 50)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Divider */}
            <div className="h-px bg-outline-variant/10" />

            {/* Photo Grid */}
            <motion.section
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

              <div className="rounded-2xl bg-surface-container/40 border border-outline-variant/10 border-dashed cursor-pointer hover:bg-surface-container/60 transition-colors">
                <div className="text-center py-12">
                  <Camera size={24} className="mx-auto mb-3 text-primary/60" />
                  <p className="font-label text-sm text-muted">
                    Las fotos de tus actividades aparecerán aquí
                  </p>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
}
