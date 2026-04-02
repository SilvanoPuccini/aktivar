import { lazy, Suspense, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, MapPin, SearchX, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import ActivityCard from '@/components/ActivityCard';
import ActivityCardSkeleton from '@/components/ActivityCardSkeleton';
import CategoryChip from '@/components/CategoryChip';
import CTAButton from '@/components/CTAButton';
import EmptyState from '@/components/EmptyState';
import SearchBar from '@/components/SearchBar';
import { useActivities, useCategories } from '@/services/hooks';

const ActivityMap = lazy(() => import('@/components/ActivityMap'));

export default function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get('q') ?? '';
  const selectedCategory = searchParams.get('cat') ?? null;

  const { data: apiActivities, isLoading } = useActivities({
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
  });
  const { data: apiCategories } = useCategories();
  const categories = apiCategories ?? [];

  const filtered = useMemo(() => {
    const activities = apiActivities ?? [];
    return activities.filter((a) => {
      if (selectedCategory && a.category.slug !== selectedCategory) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return [a.title, a.location_name, a.description].some((f) => f.toLowerCase().includes(q));
    });
  }, [apiActivities, searchQuery, selectedCategory]);

  function setSearchQuery(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set('q', value);
      else next.delete('q');
      return next;
    });
  }

  const setSelectedCategory = (slug: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (slug) next.set('cat', slug);
      else next.delete('cat');
      return next;
    });
  };

  const featured = filtered[0] ?? null;
  const editorialGrid = featured ? filtered.slice(1) : filtered;

  return (
    <div className="space-y-10 md:space-y-14">
      <section className="editorial-grid-glow relative overflow-hidden rounded-[1.25rem] bg-surface-container px-6 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-secondary/8 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <p className="section-kicker">Curated expedition feed</p>
            <h1 className="hero-title text-5xl text-on-surface md:text-7xl">Explora la próxima salida</h1>
            <p className="max-w-2xl text-base text-on-surface-variant md:text-lg">
              Nuevo lenguaje editorial, mejores filtros y una vista más inmersiva para descubrir trekking, surf, rutas y experiencias compartidas.
            </p>

            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Busca por destino, host o tipo de aventura" />
              <CTAButton label="Mapa editorial" icon={<Compass size={16} />} onClick={() => navigate('/explore')} />
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-on-surface-variant">
              <div className="editorial-badge">Selección más activa del día</div>
              <div className="editorial-badge">Filtros rápidos por energía</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              ['Hoy', `${filtered.length}`],
              ['Abiertas', `${filtered.filter((a) => a.spots_remaining > 0).length}`],
              ['Rutas', `${categories.length}`],
            ].map(([label, value]) => (
              <div key={label} className="editorial-metric rounded-[0.875rem] px-4 py-5">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
                <p className="mt-2 font-headline text-4xl font-black tracking-tight text-primary">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Filtros</p>
            <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-on-surface">Busca por energía</h2>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-surface-container-high px-5 py-2.5 md:flex">
            <SlidersHorizontal size={16} className="text-primary" />
            <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">sin líneas, solo capas</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <CategoryChip category={{ name: 'Todas', icon: 'users' }} selected={selectedCategory === null} onClick={() => setSelectedCategory(null)} size="sm" />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              selected={selectedCategory === category.slug}
              onClick={() => setSelectedCategory(selectedCategory === category.slug ? null : category.slug)}
              size="sm"
            />
          ))}
        </div>
      </section>

      {isLoading ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <ActivityCardSkeleton key={index} />)}
        </section>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX size={42} />}
          title="No encontramos expediciones"
          description="Prueba otra búsqueda o abre el mapa editorial para explorar una zona distinta."
          action={{ label: 'Ir al mapa', onClick: () => navigate('/explore') }}
        />
      ) : (
        <>
          {featured && (
            <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
              <div className="relative overflow-hidden rounded-[1.25rem] bg-surface-container">
                <div className="absolute right-5 top-5 z-10 rounded-full bg-surface/80 px-4 py-2 font-label text-[10px] uppercase tracking-[0.18em] text-primary backdrop-blur-sm">
                  Selección editorial
                </div>
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={featured.cover_image}
                    alt={featured.title}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/800x600/1d201b/ffc56c?text=${encodeURIComponent(featured.category.name)}`; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent" />
                  <div className="absolute left-5 top-5">
                    <CategoryChip category={featured.category} size="sm" />
                  </div>
                  <div className="absolute bottom-5 right-5">
                    <span className="rounded-full bg-surface/80 px-3 py-1.5 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface backdrop-blur-sm">
                      {featured.is_free ? 'Gratis' : `$${featured.price.toLocaleString('es-CL')}`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/activity/${featured.id}`)}
                  className="w-full cursor-pointer px-6 py-5 text-left"
                >
                  <p className="font-label text-[10px] uppercase tracking-[0.18em] text-primary">Expedición abierta</p>
                  <h2 className="mt-1.5 font-headline text-2xl font-black uppercase leading-tight tracking-tight text-on-surface">
                    {featured.title}
                  </h2>
                  <div className="mt-3 flex items-center gap-4 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> {featured.location_name}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <img src={featured.organizer.avatar} alt={featured.organizer.full_name} className="h-9 w-9 rounded-full object-cover" />
                    <span className="text-sm font-semibold text-on-surface">{featured.organizer.full_name}</span>
                    <span className="ml-auto font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
                      {featured.spots_remaining} cupos
                    </span>
                  </div>
                </button>
              </div>

              <div className="editorial-card-soft editorial-border flex flex-col justify-between gap-5 rounded-[1.25rem] px-6 py-6 md:px-8 md:py-8">
                <div className="space-y-4">
                  <p className="section-kicker">Pulso del día</p>
                  <h3 className="font-headline text-3xl font-black uppercase leading-[0.95] tracking-tight text-on-surface md:text-4xl">
                    Actividades que están moviendo la comunidad.
                  </h3>
                </div>

                <div
                  className="relative h-48 cursor-pointer overflow-hidden rounded-[0.75rem] border border-outline-variant/15 md:h-56"
                  onClick={() => navigate('/explore')}
                >
                  <Suspense fallback={<div className="h-full w-full bg-surface-container" />}>
                    <ActivityMap
                      activities={filtered}
                      onActivityClick={(id) => navigate(`/activity/${id}`)}
                      zoom={10}
                      interactive={false}
                    />
                  </Suspense>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface/80 to-transparent px-4 py-3">
                    <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                      {filtered.length} actividades · Click para explorar
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="editorial-metric rounded-[0.875rem] px-4 py-5">
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Con lugar</p>
                    <p className="mt-2 font-headline text-4xl font-black tracking-tight text-secondary">
                      {filtered.filter((activity) => activity.spots_remaining > 0).length}
                    </p>
                  </div>
                  <div className="editorial-metric rounded-[0.875rem] px-4 py-5">
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Destinos</p>
                    <p className="mt-2 font-headline text-4xl font-black tracking-tight text-primary">
                      {new Set(filtered.map((activity) => activity.location_name)).size}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Lista</p>
                <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-on-surface">Rutas, hosts y experiencias</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <MapPin size={16} className="text-primary" />
                {filtered.length} resultados
              </div>
            </div>

            <motion.div layout className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {editorialGrid.map((activity) => (
                <motion.div key={activity.id} layout>
                  <ActivityCard activity={activity} onClick={() => navigate(`/activity/${activity.id}`)} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        </>
      )}
    </div>
  );
}
