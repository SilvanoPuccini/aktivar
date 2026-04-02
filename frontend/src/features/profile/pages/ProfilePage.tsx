import { useEffect, useRef, useState } from 'react';
import { AtSign, Camera, CheckCircle, Globe, Loader2, LogOut, MapPin, Mountain, Save, Star } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import CTAButton from '@/components/CTAButton';
import EmptyState from '@/components/EmptyState';
import { preparePostAuthRedirect } from '@/lib/authRedirect';
import api, { endpoints } from '@/services/api';
import { useCurrentUser, useUploadImage } from '@/services/hooks';
import { useAuthStore } from '@/stores/authStore';

export default function ProfilePage() {
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const { data: user, isLoading, isError, refetch } = useCurrentUser();
  const uploadMutation = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState('');
  const [locationName, setLocationName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const galleryGradients = [
    'linear-gradient(135deg, #7dd3fc 0%, #14532d 100%)',
    'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
    'linear-gradient(135deg, #67e8f9 0%, #155e75 100%)',
    'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    'linear-gradient(135deg, #0f172a 0%, #374151 100%)',
    'linear-gradient(135deg, #0f172a 0%, #f59e0b 140%)',
  ];

  useEffect(() => {
    if (!user) return;
    setBio(user.profile?.bio_extended ?? user.bio ?? '');
    setLocationName(user.profile?.location_name ?? '');
    setInstagram(user.profile?.instagram ?? '');
    setWebsite(user.profile?.website ?? '');
  }, [user]);

  if (isLoading) return <div aria-label="Cargando perfil" className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (isError) return <EmptyState title="No pudimos cargar tu perfil" description="Reintentá para ver tu información o volvé al inicio." action={{ label: 'Reintentar', onClick: () => void refetch() }} />;
  if (!user) return <EmptyState title="Necesitas iniciar sesión" description="Accede para ver y editar tu perfil." action={{ label: 'Ir a login', onClick: () => {
    const returnPath = preparePostAuthRedirect(routeLocation.pathname, routeLocation.search, routeLocation.hash);
    navigate('/login', { state: { from: returnPath } });
  } }} />;

  const profile = user.profile ?? {
    bio_extended: '',
    location_name: '',
    instagram: '',
    website: '',
    total_activities: 0,
    total_km: 0,
    total_people_met: 0,
    avg_rating: 5,
    badges: [],
  };
  const avatarSrc = user.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80';

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(endpoints.myProfile, { bio_extended: bio, location_name: locationName, instagram, website });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Perfil actualizado');
      setEditing(false);
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file, {
      onSuccess: async (result) => {
        await api.patch(endpoints.myAvatar, { avatar: result.url });
        await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        toast.success('Avatar actualizado');
      },
      onError: () => toast.error('No se pudo subir la imagen'),
    });
  };

  return (
    <div className="space-y-10 pb-12">
      <section className="grid gap-8 xl:grid-cols-[1.2fr_0.45fr] xl:items-start">
        <div className="space-y-8">
          <div className="editorial-card rounded-[1.25rem] px-6 py-8 md:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end">
              <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-primary-container p-1 md:h-40 md:w-40">
                  <img src={avatarSrc} alt={user.full_name} className="h-full w-full rounded-full object-cover" />
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-[#442c00] cursor-pointer"><Camera size={16} /></button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelected} />
              </div>
              <div className="space-y-3">
                <h1 className="hero-title text-4xl text-on-surface md:text-6xl">{user.full_name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                  {locationName && <span className="inline-flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.16em]"><MapPin size={14} className="text-primary" /> {locationName}</span>}
                </div>
                <p className="max-w-2xl text-on-surface-variant">{bio || 'Outdoor enthusiast ready for the next summit.'}</p>
              </div>
            </div>
          </div>

          <section className="grid gap-px overflow-hidden rounded-[1.6rem] border border-outline-variant/10 bg-outline-variant/10 md:grid-cols-3">
            <div className="bg-surface-container px-6 py-7 text-center">
              <p className="font-headline text-4xl font-black text-primary">{profile.total_activities}</p>
              <p className="mt-2 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Activities</p>
            </div>
            <div className="bg-surface-container px-6 py-7 text-center">
              <p className="font-headline text-4xl font-black text-primary">{profile.total_km} km</p>
              <p className="mt-2 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Travelled</p>
            </div>
            <div className="bg-surface-container px-6 py-7 text-center">
              <p className="font-headline text-4xl font-black text-primary">{profile.total_people_met}</p>
              <p className="mt-2 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">People met</p>
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">Achievements</p>
                <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-on-surface">Explorer profile</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {profile.badges.length > 0 ? profile.badges.map((badge) => (
                <span key={badge.id} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface-container-low px-4 py-3 font-label text-[10px] uppercase tracking-[0.16em] text-on-surface">
                  <Mountain size={14} className="text-primary" />
                  {badge.name}
                </span>
              )) : (
                <p className="text-sm text-on-surface-variant">Aún no hay insignias desbloqueadas.</p>
              )}
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Recent expeditions</p>
                <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-on-surface">Archivo visual</h2>
              </div>
              <span className="font-label text-[10px] uppercase tracking-[0.16em] text-primary">View archive</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {galleryGradients.map((gradient, index) => (
                <div key={gradient} className="group relative aspect-square overflow-hidden rounded-[1.4rem] bg-surface-container">
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: gradient }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="font-headline text-lg font-black uppercase tracking-tight text-on-surface">
                      {['Northbound Trail', 'Night Camp', 'Road Ritual', 'Runner Loop', 'Lakeview', 'Summit Line'][index]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="editorial-card rounded-[1rem] border-l-4 border-primary px-6 py-6 md:px-8">
            <p className="section-kicker">Member rating</p>
            <div className="mt-3 flex items-center gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={16} fill="currentColor" />)}
            </div>
            <p className="mt-3 font-headline text-4xl font-black text-on-surface">{profile.avg_rating ?? 5}</p>
          </section>

          <section className="editorial-card rounded-[1rem] px-6 py-6 md:px-8 md:py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">Bio</p>
                <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-on-surface">Tu historia</h2>
              </div>
              <button type="button" onClick={() => setEditing((prev) => !prev)} className="font-label text-[10px] uppercase tracking-[0.16em] text-primary cursor-pointer">{editing ? 'Cancelar' : 'Editar'}</button>
            </div>

            {editing ? (
              <div className="space-y-4">
                <textarea className="editorial-input min-h-36 resize-none" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Describe tu estilo de aventura" />
                <input className="editorial-input" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Ubicación" />
                <input className="editorial-input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram" />
                <input className="editorial-input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Sitio web" />
                <CTAButton label="Guardar perfil" icon={<Save size={14} />} loading={saving} onClick={() => void handleSave()} />
              </div>
            ) : (
              <p className="text-on-surface-variant">{bio || 'Todavía no agregaste una biografía extendida.'}</p>
            )}
          </section>

          <section className="editorial-card rounded-[1rem] px-6 py-6 md:px-8 md:py-8">
            <p className="section-kicker">Presence</p>
            <div className="mt-4 space-y-4 text-sm text-on-surface-variant">
               <div className="flex items-center gap-3"><MapPin size={16} className="text-primary" /> {locationName || 'Sin ubicación definida'}</div>
              <div className="flex items-center gap-3"><AtSign size={16} className="text-primary" /> {instagram || 'Sin Instagram'}</div>
              <div className="flex items-center gap-3"><Globe size={16} className="text-primary" /> {website || 'Sin sitio web'}</div>
              <div className="flex items-center gap-3"><CheckCircle size={16} className="text-primary" /> {user.is_verified_email ? 'Email verificado' : 'Email pendiente'}</div>
            </div>
          </section>

          <CTAButton label="Cerrar sesión" variant="secondary" icon={<LogOut size={14} />} onClick={() => { logout(); navigate('/login'); }} />
        </div>
      </section>
    </div>
  );
}
