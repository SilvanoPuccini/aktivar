import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Mountain,
  Users,
  Route,
  Trophy,
  Star,
  Shield,
  Calendar,
  Instagram,
  Globe,
  ArrowLeft,
  Settings,
  Compass,
  Flag,
  Car,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import VerifiedBadge from '@/components/VerifiedBadge';
import StatCard from '@/components/StatCard';
import CTAButton from '@/components/CTAButton';
import { currentUser, mockUsers } from '@/data/users';
import { mockActivities } from '@/data/activities';
import { useCurrentUser } from '@/services/hooks';
import { useAuthStore } from '@/stores/authStore';

const badgeIconMap: Record<string, React.ReactNode> = {
  'mountain-snow': <Mountain size={20} />,
  star: <Star size={20} />,
  route: <Route size={20} />,
  compass: <Compass size={20} />,
  flag: <Flag size={20} />,
  car: <Car size={20} />,
  trophy: <Trophy size={20} />,
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

// Simulated past activities for the adventure passport grid
const pastActivityPhotos = mockActivities.slice(0, 9).map((a) => ({
  id: a.id,
  title: a.title,
  cover_image: a.cover_image,
  category: a.category.name,
  date: a.start_datetime,
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

  const memberSince = new Date(user.created_at).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* ---- Header ---- */}
      <div className="relative bg-surface-lowest px-4 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container"
            aria-label="Volver"
          >
            <ArrowLeft size={20} className="text-on-surface" />
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container"
            aria-label="Configuración"
          >
            <Settings size={20} className="text-on-surface" />
          </button>
        </div>

        {/* Avatar + Name */}
        <motion.div
          className="mt-6 flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.full_name}
              className="h-24 w-24 rounded-full border-[3px] border-primary bg-surface-container object-cover"
            />
            {user.role === 'organizer' && (
              <div className="absolute -bottom-1 -right-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
                  <Shield size={14} className="text-surface" />
                </div>
              </div>
            )}
          </div>

          <h1 className="mt-4 font-display text-2xl font-bold text-on-surface">
            {user.full_name}
          </h1>

          <div className="mt-1 flex items-center gap-2">
            <MapPin size={14} className="text-muted" />
            <span className="font-label text-sm text-muted">{profile.location_name}</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            {user.is_verified_email && <VerifiedBadge type="email" />}
            {user.is_verified_phone && <VerifiedBadge type="phone" />}
            {user.role === 'organizer' && <VerifiedBadge type="organizer" />}
            {user.role === 'driver' && <VerifiedBadge type="driver" />}
          </div>

          <p className="mt-3 max-w-md text-center text-sm text-on-surface-variant">
            {user.bio}
          </p>

          {/* Social links */}
          <div className="mt-3 flex items-center gap-4">
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
              >
                <Instagram size={14} />
                <span className="font-label text-xs">{profile.instagram}</span>
              </a>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
              >
                <Globe size={14} />
                <span className="font-label text-xs">Web</span>
              </a>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <Calendar size={12} />
            <span className="font-label">Miembro desde {memberSince}</span>
          </div>
        </motion.div>
      </div>

      {/* ---- Stats ---- */}
      <motion.div
        className="mx-4 -mt-1 grid grid-cols-3 gap-3 lg:mx-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <StatCard
          icon={<Mountain size={22} />}
          value={profile.total_activities}
          label="Actividades"
        />
        <StatCard
          icon={<Route size={22} />}
          value={`${profile.total_km.toLocaleString()} km`}
          label="Recorridos"
        />
        <StatCard
          icon={<Users size={22} />}
          value={profile.total_people_met}
          label="Personas"
        />
      </motion.div>

      {/* ---- Bio Extended ---- */}
      {profile.bio_extended && (
        <motion.div
          className="mx-4 mt-6 rounded-xl bg-surface-container p-5 lg:mx-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-label text-xs uppercase tracking-wider text-muted">Sobre mí</h2>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            {profile.bio_extended}
          </p>
        </motion.div>
      )}

      {/* ---- Badges ---- */}
      {profile.badges.length > 0 && (
        <motion.div
          className="mx-4 mt-6 lg:mx-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-on-surface">
            <Trophy size={18} className="text-primary" />
            Badges
          </h2>

          <motion.div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {profile.badges.map((badge) => (
              <motion.div
                key={badge.id}
                variants={itemVariants}
                className="flex items-start gap-3 rounded-xl bg-surface-container p-4 transition-colors hover:bg-surface-container-high"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {badgeIconMap[badge.icon] ?? <Trophy size={20} />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-on-surface truncate">{badge.name}</h3>
                  <p className="mt-0.5 text-xs text-muted line-clamp-2">{badge.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ---- Adventure Passport (Photo Grid) ---- */}
      <motion.div
        className="mx-4 mt-8 lg:mx-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-on-surface">
          <Compass size={18} className="text-primary" />
          Pasaporte de Aventuras
        </h2>

        <motion.div
          className="grid grid-cols-3 gap-1.5 sm:gap-2"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {pastActivityPhotos.map((photo) => (
            <motion.div
              key={photo.id}
              variants={itemVariants}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg"
              onClick={() => navigate(`/activity/${photo.id}`)}
            >
              <img
                src={photo.cover_image}
                alt={photo.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <p className="text-xs font-semibold text-on-surface truncate">{photo.title}</p>
                <span className="font-label text-[10px] text-primary">{photo.category}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ---- Other Adventurers ---- */}
      <motion.div
        className="mx-4 mt-8 lg:mx-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        <h2 className="mb-4 font-display text-lg font-bold text-on-surface">
          Aventureros similares
        </h2>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
          {mockUsers.slice(1, 7).map((u) => (
            <div
              key={u.id}
              className="flex w-28 flex-shrink-0 flex-col items-center gap-2 rounded-xl bg-surface-container p-4 transition-colors hover:bg-surface-container-high"
            >
              <img
                src={u.avatar}
                alt={u.full_name}
                className="h-14 w-14 rounded-full border-2 border-outline-variant bg-surface-container-high object-cover"
              />
              <span className="w-full truncate text-center text-xs font-medium text-on-surface">
                {u.full_name.split(' ')[0]}
              </span>
              <span className="font-label text-[10px] text-muted">
                {u.profile.total_activities} act.
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ---- Edit Profile / Auth CTAs ---- */}
      <div className="mx-4 mt-8 lg:mx-8 space-y-3">
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
            <CTAButton label="Iniciar sesión" variant="primary" fullWidth onClick={() => navigate('/login')} />
            <CTAButton label="Crear cuenta" variant="secondary" fullWidth onClick={() => navigate('/onboarding')} />
          </>
        )}
      </div>
    </div>
  );
}

