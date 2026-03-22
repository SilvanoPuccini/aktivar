import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, SearchX } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import CategoryChip from '@/components/CategoryChip';
import ActivityCard from '@/components/ActivityCard';
import EmptyState from '@/components/EmptyState';
import { mockActivities } from '@/data/activities';
import { categories } from '@/data/categories';

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

  function setSearchQuery(value: string) {
    setSearchParams((prev) => {
      if (value) prev.set('q', value);
      else prev.delete('q');
      return prev;
    });
  }

  function setSelectedCategory(slug: string | null) {
    setSearchParams((prev) => {
      if (slug) prev.set('cat', slug);
      else prev.delete('cat');
      return prev;
    });
  }

  const filtered = useMemo(() => {
    return mockActivities.filter((a) => {
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
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* ---- Top Section ---- */}
      <div className="px-4 pt-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-on-surface sm:text-3xl lg:text-4xl">
          Descubre tu próxima aventura
        </h1>

        <div className="mt-4 max-w-xl">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Category chips */}
        <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4">
          <CategoryChip
            category={{ name: 'Todas', icon: 'users' }}
            selected={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
            size="sm"
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              selected={selectedCategory === cat.slug}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)
              }
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* ---- Main content ---- */}
      <div className="mt-6 flex gap-6 px-4 lg:px-8">
        {/* Cards column */}
        <div className="flex-1 lg:w-[60%] lg:flex-none">
          {filtered.length === 0 ? (
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
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
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

        {/* Map placeholder — desktop only */}
        <div className="hidden lg:block lg:w-[40%] lg:flex-none">
          <div className="sticky top-6 flex h-[calc(100vh-10rem)] flex-col items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-low">
            <MapPin size={48} className="text-muted" />
            <p className="mt-3 font-label text-sm text-muted">Mapa próximamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
