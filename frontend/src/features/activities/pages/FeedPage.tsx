import { useMemo } from 'react';
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
    return activities.filter((activity) => {
      if (selectedCategory && activity.category.slug !== selectedCategory) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return [activity.title, activity.location_name, activity.description].some((field) => field.toLowerCase().includes(q));
    });
  }, [apiActivities, searchQuery, selectedCategory]);

  const setSearchQuery = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set('q', value);
      else next.delete('q');
      return next;
    });
  };

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
      <section className="relative overflow-hidden rounded-[2.25rem] bg-surface-container px-6 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
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
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              ['Hoy', `${filtered.length}`],
              ['Abiertas', `${filtered.filter((a) => a.spots_remaining > 0).length}`],
              ['Rutas', `${categories.length}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.5rem] bg-surface px-4 py-5">
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
          <div className="hidden items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 md:flex">
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
              <div className="relative overflow-hidden rounded-[2.25rem] bg-surface-container p-4 md:p-5">
                <div className="absolute right-6 top-6 z-10 rounded-full bg-surface/80 px-4 py-2 font-label text-[10px] uppercase tracking-[0.18em] text-primary backdrop-blur-sm">
                  Selección editorial
                </div>
                <ActivityCard activity={featured} onClick={() => navigate(`/activity/${featured.id}`)} />
              </div>

              <div className="editorial-card flex flex-col justify-between rounded-[2.25rem] px-6 py-6 md:px-8 md:py-8">
                <div className="space-y-4">
                  <p className="section-kicker">Pulso del día</p>
                  <h3 className="font-headline text-4xl font-black uppercase leading-[0.95] tracking-tight text-on-surface">
                    Actividades que están moviendo la comunidad.
                  </h3>
                  <p className="text-sm text-on-surface-variant md:text-base">
                    Usa la vista de mapa, los chips y los bloques asimétricos para encontrar la salida justa según distancia, energía y cupos.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-surface px-4 py-5">
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Con lugar</p>
                    <p className="mt-2 font-headline text-4xl font-black tracking-tight text-secondary">
                      {filtered.filter((activity) => activity.spots_remaining > 0).length}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-surface px-4 py-5">
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
