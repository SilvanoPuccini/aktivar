import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SearchX, MapPin, SlidersHorizontal } from 'lucide-react';
import ActivityCard from '@/components/ActivityCard';
import ActivityCardSkeleton from '@/components/ActivityCardSkeleton';
import EmptyState from '@/components/EmptyState';
import ActivityMap from '@/components/ActivityMap';
import { useActivities, useCategories } from '@/services/hooks';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
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
    <div className="bg-surface">
      {/* ── Search & Filter Bar ── */}
      <section className="border-b border-outline-variant/10 bg-surface-lowest/60">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8 py-6 md:py-8 space-y-5">
          {/* Title — desktop only */}
          <div className="hidden md:block">
            <h1 className="font-headline text-3xl font-black tracking-tight text-on-surface">
              Actividades
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Encuentra tu próxima aventura outdoor en Patagonia y toda Latinoamérica.
            </p>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 bg-surface-container px-5 py-3 rounded-xl border border-outline-variant/10 max-w-xl">
            <MapPin size={18} className="text-primary shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por lugar o actividad..."
              className="flex-1 bg-transparent outline-none text-on-surface text-sm placeholder:text-muted"
            />
            <SlidersHorizontal size={18} className="text-muted shrink-0 cursor-pointer hover:text-on-surface transition-colors" />
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 px-4 py-2 rounded-lg font-label text-xs font-bold tracking-wider cursor-pointer transition-colors ${
                selectedCategory === null
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              TODAS
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
                className={`shrink-0 px-4 py-2 rounded-lg font-label text-xs font-bold tracking-wider cursor-pointer transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {cat.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Content: Cards + Map ── */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-8 py-8 md:py-10">
        <div className="flex gap-8">
          {/* Cards */}
          <div className="flex-1 min-w-0">
            {isLoading && !apiActivities ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={stagger}
                initial="hidden"
                animate="show"
              >
                {filtered.map((activity) => (
                  <motion.div key={activity.id} variants={fadeIn}>
                    <ActivityCard
                      activity={activity}
                      onClick={() => navigate(`/activity/${activity.id}`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Map sidebar — large desktop only */}
          <aside className="hidden xl:block w-[380px] shrink-0">
            <div className="sticky top-24 rounded-xl overflow-hidden border border-outline-variant/10 h-[600px]">
              <ActivityMap
                activities={filtered}
                onActivityClick={(id) => navigate(`/activity/${id}`)}
              />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
