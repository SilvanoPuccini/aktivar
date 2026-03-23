import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, X, Navigation, MapPin, Users, ChevronRight } from 'lucide-react';
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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

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
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
          setIsLocating(false);
        },
        () => {
          setMapCenter([-33.4489, -70.6693]);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  // Try to get user location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => { /* silently fail */ },
        { enableHighAccuracy: false, timeout: 5000 },
      );
    }
  }, []);

  const handleMapMove = useCallback((_bounds: L.LatLngBounds) => {
    // Count visible activities within bounds
    const count = filtered.filter((a) =>
      a.latitude && a.longitude && _bounds.contains([a.latitude, a.longitude])
    ).length;
    setVisibleCount(count);
  }, [filtered]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-surface">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <ActivityMap
          activities={filtered}
          onActivityClick={handleMarkerClick}
          center={mapCenter}
          zoom={12}
          selectedActivityId={selectedActivityId}
          userLocation={userLocation}
          onMapMove={handleMapMove}
        />
      </div>

      {/* Floating search bar + filters */}
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

      {/* Activity count badge */}
      {visibleCount !== null && !selectedActivity && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-[120px] left-1/2 -translate-x-1/2 z-[1000]"
        >
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-label font-semibold"
            style={{
              background: 'rgba(17,20,15,0.8)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(81,69,51,0.2)',
            }}
          >
            <MapPin size={12} className="text-primary" />
            <span className="text-on-surface">
              {visibleCount} {visibleCount === 1 ? 'actividad' : 'actividades'} en esta zona
            </span>
          </div>
        </motion.div>
      )}

      {/* Floating controls */}
      <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-3">
        {/* Re-center / locate button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRecenter}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant text-on-surface shadow-lg cursor-pointer"
          style={{
            background: 'rgba(17,20,15,0.70)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
          title="Centrar en mi ubicación"
        >
          {isLocating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Navigation size={20} />
            </motion.div>
          ) : (
            <Crosshair size={20} />
          )}
        </motion.button>
      </div>

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

                {/* Quick action bar */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/30">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Users size={14} />
                    <span>{selectedActivity.confirmed_count} confirmados</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/activity/${selectedActivity.id}`)}
                    className="flex items-center gap-1 text-xs font-label font-semibold text-primary hover:text-primary-container transition-colors cursor-pointer"
                  >
                    Ver detalles
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
