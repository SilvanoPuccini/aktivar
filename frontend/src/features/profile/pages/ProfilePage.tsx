import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  MoreVertical,
  Star,
  Mountain,
  Trophy,
  Zap,
  Camera,
  CheckCircle,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import CTAButton from '@/components/CTAButton';
import { currentUser } from '@/data/users';
import { mockActivities } from '@/data/activities';
import { useCurrentUser } from '@/services/hooks';
import { useAuthStore } from '@/stores/authStore';

const badgeIconMap: Record<string, React.ReactNode> = {
  'mountain-snow': <Mountain size={20} />,
  star: <Star size={20} />,
  trophy: <Trophy size={20} />,
  compass: <Mountain size={20} />,
  flag: <Trophy size={20} />,
  car: <Zap size={20} />,
  route: <Zap size={20} />,
};

const badgeColorMap: Record<string, string> = {
  'mountain-snow': 'bg-secondary-container/20 text-secondary',
  star: 'bg-primary-container/20 text-primary-container',
  trophy: 'bg-primary-container/20 text-primary-container',
  compass: 'bg-secondary-container/20 text-secondary',
  flag: 'bg-primary-container/20 text-primary-container',
  car: 'bg-primary-container/20 text-primary-container',
  route: 'bg-secondary-container/20 text-secondary',
};

// Simulated past activities for the photo grid
const pastActivityPhotos = mockActivities.slice(0, 5).map((a) => ({
  id: a.id,
  title: a.title,
  cover_image: a.cover_image,
}));

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const { data: apiUser } = useCurrentUser();

  // Use API user if authenticated, fallback to mock
  const user = apiUser ?? currentUser;
  const { profile } = user;

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const rating = 4.8;
  const reviewCount = 124;
  const filledStars = Math.floor(rating);

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* ---- Header (Glassmorphism) ---- */}
      <header className="sticky top-0 z-50 w-full bg-[#11140f]/70 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} aria-label="Volver">
              <ArrowLeft size={24} className="text-primary" />
            </button>
            <span className="font-headline text-2xl font-black tracking-tighter text-on-surface">
              Aktivar
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Search size={24} className="text-on-surface" />
            <MoreVertical size={24} className="text-on-surface" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-32">
        {/* ---- Profile Header ---- */}
        <section className="mt-8 mb-12 flex flex-col items-center text-center">
          {/* Avatar with gradient ring */}
          <motion.div
            className="relative mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="h-32 w-32 rounded-full bg-gradient-to-tr from-primary to-secondary p-1">
              <img
                src={user.avatar}
                alt={user.full_name}
                className="h-full w-full rounded-full border-4 border-surface object-cover"
              />
            </div>
            {/* Verified badge */}
            {(user.is_verified_email || user.role === 'organizer') && (
              <div className="absolute bottom-1 right-1 rounded-full border-2 border-surface bg-primary p-1 text-on-primary">
                <CheckCircle size={16} />
              </div>
            )}
          </motion.div>

          {/* Name */}
          <motion.h1
            className="mb-2 font-headline text-4xl font-extrabold tracking-tight text-on-surface"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            {user.full_name}
          </motion.h1>

          {/* Star rating row */}
          <motion.div
            className="mb-4 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex text-primary">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < filledStars ? 'fill-primary' : ''}
                />
              ))}
            </div>
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
              ({rating} &bull; {reviewCount} reviews)
            </span>
          </motion.div>

          {/* Bio */}
          <motion.p
            className="mb-8 max-w-md font-body leading-relaxed text-on-surface/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {user.bio}
          </motion.p>

          {/* Stats Row */}
          <motion.div
            className="grid w-full max-w-lg grid-cols-3 gap-4 rounded-xl bg-surface-container py-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex flex-col">
              <span className="font-label text-2xl font-bold text-primary">
                {profile.total_activities}
              </span>
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                Actividades
              </span>
            </div>
            <div className="flex flex-col border-x border-outline-variant/20">
              <span className="font-label text-2xl font-bold text-primary">
                {profile.total_km >= 1000
                  ? `${(profile.total_km / 1000).toFixed(1)}k`
                  : profile.total_km.toLocaleString()}
              </span>
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                KM recorridos
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label text-2xl font-bold text-primary">
                {profile.total_people_met}
              </span>
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                Personas
              </span>
            </div>
          </motion.div>
        </section>

        {/* ---- Achievements / Badges (horizontal scroll pills) ---- */}
        {profile.badges.length > 0 && (
          <motion.section
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="mb-4 font-label text-xs uppercase tracking-widest text-on-surface-variant">
              Top Achievements
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
              {profile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-shrink-0 items-center gap-3 rounded-full bg-surface-container-high py-2 pl-2 pr-5"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      badgeColorMap[badge.icon] ?? 'bg-primary-container/20 text-primary-container'
                    }`}
                  >
                    {badgeIconMap[badge.icon] ?? <Trophy size={20} />}
                  </div>
                  <span className="font-label text-sm font-bold text-on-surface">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ---- Photo Grid (editorial-grid) ---- */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Recuerdos del Trail
            </h2>
            <span className="cursor-pointer font-label text-sm text-primary hover:underline">
              Ver todo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {pastActivityPhotos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square cursor-pointer overflow-hidden rounded-xl bg-surface-container-highest"
                onClick={() => navigate(`/activity/${photo.id}`)}
              >
                <img
                  src={photo.cover_image}
                  alt={photo.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                  loading="lazy"
                />
              </div>
            ))}

            {/* Add more cell */}
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-surface-container-high to-surface">
              <div className="text-center">
                <Camera size={28} className="mx-auto mb-1 text-primary" />
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Agregar más
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ---- Edit Profile / Auth CTAs ---- */}
        <div className="mt-12 space-y-3">
          {isAuthenticated ? (
            <>
              <CTAButton label="Editar perfil" variant="secondary" fullWidth onClick={() => {}} />
              <CTAButton
                label="Cerrar sesión"
                variant="danger"
                fullWidth
                onClick={handleLogout}
                icon={<LogOut size={16} />}
              />
            </>
          ) : (
            <>
              <CTAButton
                label="Iniciar sesión"
                variant="primary"
                fullWidth
                onClick={() => navigate('/login')}
              />
              <CTAButton
                label="Crear cuenta"
                variant="secondary"
                fullWidth
                onClick={() => navigate('/onboarding')}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
