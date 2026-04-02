import { useMemo, useState } from 'react';
import { MapPin, Users2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import CTAButton from '@/components/CTAButton';
import EmptyState from '@/components/EmptyState';
import EcosystemNav from '@/components/EcosystemNav';
import SearchBar from '@/components/SearchBar';
import { buildReturnPath, savePostAuthPath } from '@/lib/authRedirect';
import { useCommunities, useFeaturedCommunity, useJoinCommunity } from '@/services/hooks';
import { useAuthStore } from '@/stores/authStore';

const categories = [
  { key: 'all', label: 'All' },
  { key: 'mountain', label: 'Mountain' },
  { key: 'water', label: 'Water' },
  { key: 'air', label: 'Air' },
  { key: 'survival', label: 'Survival' },
  { key: 'road', label: 'Road' },
] as const;

export default function CommunitiesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const { data: featured } = useFeaturedCommunity();
  const { data: communities = [] } = useCommunities({ search: query || undefined });
  const joinMutation = useJoinCommunity();

  const filtered = useMemo(
    () => communities.filter((community) => activeCategory === 'all' || community.category === activeCategory),
    [communities, activeCategory],
  );

  const handleJoin = (communityId: number) => {
    if (!isAuthenticated) {
      const returnPath = buildReturnPath(location.pathname, location.search, location.hash);
      savePostAuthPath(returnPath);
      navigate('/login', { state: { from: returnPath } });
      return;
    }

    joinMutation.mutate(communityId, {
      onSuccess: () => toast.success('Te sumaste a la comunidad'),
      onError: () => toast.error('No se pudo unir la comunidad'),
    });
  };

  const resetFilters = () => {
    setActiveCategory('all');
    setQuery('');
  };

  return (
    <div className="premium-page">
      <EcosystemNav />

      {featured && (
        <section className="premium-hero overflow-hidden">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="min-h-[22rem] overflow-hidden">
              <img src={featured.cover_image} alt={featured.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col justify-center gap-6 px-6 py-8 md:px-10">
              <span className="premium-chip w-fit">Community of the week</span>
              <h1 className="hero-title text-4xl text-on-surface md:text-6xl">{featured.name}</h1>
              <p className="max-w-md text-on-surface-variant">{featured.description}</p>
              <div className="grid grid-cols-2 gap-6">
                <div className="editorial-metric rounded-[1.4rem] px-4 py-5">
                  <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Members</p>
                  <p className="mt-2 font-headline text-3xl font-black text-on-surface">{featured.member_count.toLocaleString()}</p>
                </div>
                <div className="editorial-metric rounded-[1.4rem] px-4 py-5">
                  <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Frequency</p>
                  <p className="mt-2 font-headline text-3xl font-black text-on-surface">{featured.cadence_label}</p>
                </div>
              </div>
              <CTAButton label={featured.is_joined ? 'Joined' : 'Join community'} onClick={() => handleJoin(featured.id)} disabled={featured.is_joined || joinMutation.isPending} />
            </div>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">Directory</p>
            <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-on-surface">Find your tribe</h2>
          </div>
          <div className="w-full md:w-96">
            <SearchBar value={query} onChange={setQuery} placeholder="Find your tribe..." />
          </div>
        </div>

        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => setActiveCategory(category.key)}
              className={`rounded-full px-4 py-3 font-label text-[10px] uppercase tracking-[0.18em] ${activeCategory === category.key ? 'bg-primary text-[#442c00] shadow-[var(--shadow-soft)]' : 'bg-surface-container-high/80 text-on-surface-variant hover:text-on-surface'}`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No encontramos comunidades"
            description="Limpia la búsqueda o cambia la categoría para volver a una ruta con resultados visibles."
            action={{ label: 'Reset filters', onClick: resetFilters }}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((community) => (
              <article key={community.id} className="group editorial-card-tonal overflow-hidden rounded-[1rem] p-3 transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
                <div className="relative overflow-hidden rounded-[0.75rem]">
                  <img src={community.cover_image} alt={community.name} className="h-60 w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                  <span className="absolute right-3 top-3 premium-chip">{community.category}</span>
                </div>
                <div className="space-y-5 px-4 pb-4 pt-5">
                  <div>
                    <h3 className="font-headline text-3xl font-black tracking-tight text-on-surface">{community.name}</h3>
                    <p className="mt-3 line-clamp-2 text-sm text-on-surface-variant">{community.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="section-kicker">Activity</p>
                      <p className="mt-2 text-secondary">{community.activity_label}</p>
                    </div>
                    <div className="text-right">
                      <p className="section-kicker">Crew</p>
                      <p className="mt-2 text-on-surface">{community.member_count.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="premium-divider" />
                  <div className="flex items-center justify-between gap-4 text-sm text-on-surface-variant">
                    <div>
                      <div className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {community.location_name}</div>
                      <div className="mt-2 flex items-center gap-2"><Users2 size={14} className="text-secondary" /> {community.cadence_label}</div>
                    </div>
                    <CTAButton label={community.is_joined ? 'Joined' : 'Join'} onClick={() => handleJoin(community.id)} disabled={community.is_joined || joinMutation.isPending} size="sm" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
