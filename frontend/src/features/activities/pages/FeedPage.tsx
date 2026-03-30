import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SearchX, MapPin, SlidersHorizontal, LocateFixed } from 'lucide-react';
import ActivityCard from '@/components/ActivityCard';
import ActivityCardSkeleton from '@/components/ActivityCardSkeleton';
import EmptyState from '@/components/EmptyState';
import ActivityMap from '@/components/ActivityMap';
import Footer from '@/components/Footer';
import { useActivities, useCategories } from '@/services/hooks';

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

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

  function setSearchQuery(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set('q', value);
      else next.delete('q');
      return next;
    });
  }

  function setSelectedCategory(slug: string | null) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (slug) next.set('cat', slug);
      else next.delete('cat');
      return next;
    });
  }

  const filtered = useMemo(() => {
    const activities = apiActivities ?? [];
    return activities.filter((a) => {
      if (selectedCategory && a.category.slug !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.location_name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, searchQuery, apiActivities]);

  return (
    <div className="min-h-screen bg-surface">
      {/* ---- Hero / Search Header ---- */}
      <div className="bg-surface-lowest/50 border-b border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-6 space-y-5">
          {/* Title row - desktop only */}
          <div className="hidden md:flex items-end justify-between">
            <div>
              <h1 className="font-headline text-3xl lg:text-4xl font-black tracking-tight text-on-surface">
                Descubre <span className="text-primary">actividades</span>
              </h1>
              <p className="text-on-surface-variant text-sm mt-1 font-body">
                Encuentra tu próxima aventura outdoor en Patagonia y toda Latinoamérica.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted font-label">
              <MapPin size={14} className="text-primary" />
              {filtered.length} {filtered.length === 1 ? 'actividad' : 'actividades'} disponibles
            </div>
          </div>

          {/* Search input */}
          <div className="flex items-center gap-3 bg-surface-container-highest/80 px-5 py-3.5 rounded-2xl border border-outline-variant/10 max-w-2xl">
            <MapPin size={20} className="text-primary shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por lugar, actividad o nombre..."
              className="bg-transparent border-none outline-none text-on-surface font-body w-full placeholder:text-on-surface/30 text-[15px]"
            />
            <SlidersHorizontal size={20} className="text-on-surface/40 shrink-0 cursor-pointer hover:text-on-surface/60 transition-colors" />
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-2.5 rounded-full font-label text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === null
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container-highest text-on-surface/70 hover:bg-surface-bright'
              }`}
            >
              ALL
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)
                }
                className={`px-5 py-2.5 rounded-full font-label text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container-highest text-on-surface/70 hover:bg-surface-bright'
                }`}
              >
                {cat.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Main Content: Cards + Map ---- */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Activity Cards */}
          <section className="flex-1 min-w-0">
            {isLoading && !apiActivities ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ActivityCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<SearchX size={48} />}
                title="No hay actividades"
                description="Intenta con otra búsqueda o categoría."
                action={{
                  label: 'Limpiar filtros',
                  onClick: () => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  },
                }}
              />
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {filtered.map((activity) => (
                  <motion.div key={activity.id} variants={cardVariants}>
                    <ActivityCard
                      activity={activity}
                      onClick={() => navigate(`/activity/${activity.id}`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>

          {/* Right: Map sidebar (desktop only) */}
          <aside className="hidden lg:block w-[420px] xl:w-[480px] shrink-0">
            <div className="sticky top-24">
              <div className="rounded-2xl overflow-hidden border border-outline-variant/15 bg-surface-container-low h-[calc(100vh-8rem)]">
                <ActivityMap
                  activities={filtered}
                  onActivityClick={(id) => navigate(`/activity/${id}`)}
                />
              </div>
              {/* Map controls */}
              <div className="absolute bottom-6 right-6 z-[1000]">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-xl active:scale-95 transition-all cursor-pointer"
                >
                  <LocateFixed size={18} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
