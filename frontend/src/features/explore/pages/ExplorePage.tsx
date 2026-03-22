import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, X } from 'lucide-react';
import ActivityMap from '@/components/ActivityMap';
import SearchBar from '@/components/SearchBar';
import CategoryChip from '@/components/CategoryChip';
import ActivityCard from '@/components/ActivityCard';
import { mockActivities } from '@/data/activities';
import { categories as fallbackCategories } from '@/data/categories';
import { useActivities, useCategories } from '@/services/hooks';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);

  // Fetch from API with fallback to mock data
  const { data: apiActivities } = useActivities({
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
  });
  const { data: apiCategories } = useCategories();

  const categories = apiCategories ?? fallbackCategories;
  const activities = apiActivities ?? mockActivities;

  const filtered = useMemo(() => {
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
  }, [activities, selectedCategory, searchQuery]);

  const selectedActivity = useMemo(
    () => filtered.find((a) => a.id === selectedActivityId) ?? null,
    [filtered, selectedActivityId],
  );

  const handleMarkerClick = useCallback((id: number) => {
    setSelectedActivityId(id);
  }, []);

  const handleRecenter = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // Fallback to Santiago
          setMapCenter([-33.4489, -70.6693]);
        },
      );
    }
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-surface">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <ActivityMap
          activities={filtered}
          onActivityClick={handleMarkerClick}
          center={mapCenter}
          zoom={12}
        />
      </div>

      {/* Floating search bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="mx-auto max-w-xl">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Explorar actividades…"
          />
        </div>

        {/* Category filter chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
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

      {/* Floating re-center button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleRecenter}
        className="absolute bottom-6 right-4 z-[1000] flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant text-on-surface shadow-lg cursor-pointer"
        style={{
          background: 'rgba(17,20,15,0.70)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <Crosshair size={20} />
      </motion.button>

      {/* Bottom sheet card */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            key={selectedActivity.id}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 z-[1000] px-4 pb-6"
          >
            <div className="relative mx-auto max-w-lg">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setSelectedActivityId(null)}
                className="absolute -top-3 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-muted hover:text-on-surface transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div
                className="rounded-2xl border border-outline-variant overflow-hidden"
                style={{
                  background: 'rgba(17,20,15,0.85)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                }}
              >
                <ActivityCard
                  activity={selectedActivity}
                  onClick={() => navigate(`/activity/${selectedActivity.id}`)}
                  variant="compact"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
