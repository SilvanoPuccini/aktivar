import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SearchX, MapPin, SlidersHorizontal, Plus, Minus, LocateFixed } from 'lucide-react';
import ActivityCard from '@/components/ActivityCard';
import ActivityCardSkeleton from '@/components/ActivityCardSkeleton';
import EmptyState from '@/components/EmptyState';
import ActivityMap from '@/components/ActivityMap';
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

  // Fetch from API with fallback to mock data
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
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-surface">
      {/* ---- Left Side: Activity Cards Feed ---- */}
      <section className="w-full md:w-1/2 lg:w-5/12 overflow-y-auto hide-scrollbar bg-surface relative z-10">
        {/* Sticky Search & Filter Bar */}
        <div className="sticky top-0 z-20 bg-[#11140f]/90 backdrop-blur-xl px-6 pt-6 pb-4 space-y-4 border-b border-outline-variant/10">
          {/* Search input */}
          <div className="flex items-center gap-3 bg-surface-container-highest px-4 py-3 rounded-xl border border-[#2A3826]">
            <MapPin size={20} className="text-primary shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Antioquia, Colombia"
              className="bg-transparent border-none outline-none text-on-surface font-label w-full placeholder:text-on-surface/40"
            />
            <SlidersHorizontal size={20} className="text-on-surface/60 shrink-0 cursor-pointer" />
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-2 rounded-full font-label text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === null
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container-highest text-on-surface/70'
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
                className={`px-5 py-2 rounded-full font-label text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container-highest text-on-surface/70'
                }`}
              >
                {cat.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Cards list */}
        <div className="px-6 space-y-8 pt-6 pb-32">
          {isLoading && !apiActivities ? (
            <div className="space-y-10">
              {Array.from({ length: 3 }).map((_, i) => (
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
              className="space-y-10"
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
        </div>
      </section>

      {/* ---- Right Side: Interactive Map ---- */}
      <section className="hidden md:block md:w-1/2 lg:w-7/12 h-full bg-surface-container-low relative">
        <ActivityMap
          activities={filtered}
          onActivityClick={(id) => navigate(`/activity/${id}`)}
        />

        {/* Map Controls */}
        <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-[1000]">
          <button
            type="button"
            className="w-12 h-12 rounded-full bg-surface-container-highest/80 backdrop-blur-md flex items-center justify-center text-[#EDE9DF] border border-outline-variant/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={20} />
          </button>
          <button
            type="button"
            className="w-12 h-12 rounded-full bg-surface-container-highest/80 backdrop-blur-md flex items-center justify-center text-[#EDE9DF] border border-outline-variant/20 active:scale-95 transition-all cursor-pointer"
          >
            <Minus size={20} />
          </button>
          <button
            type="button"
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            <LocateFixed size={20} />
          </button>
        </div>
      </section>

      {/* ---- FAB ---- */}
      <button
        type="button"
        onClick={() => navigate('/create')}
        className="fixed right-6 bottom-24 md:bottom-8 z-40 bg-gradient-to-br from-primary to-primary-container text-on-primary-container w-14 h-14 rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(240,165,0,0.4)] active:scale-95 transition-transform duration-200 cursor-pointer"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
