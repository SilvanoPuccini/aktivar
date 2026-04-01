import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Crosshair, MapPin, Navigation, Users, X } from 'lucide-react';
import type L from 'leaflet';
import ActivityCard from '@/components/ActivityCard';
import ActivityMap from '@/components/ActivityMap';
import CategoryChip from '@/components/CategoryChip';
import SearchBar from '@/components/SearchBar';
import { useActivities, useCategories } from '@/services/hooks';

class MapErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  const { data: apiActivities } = useActivities({
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

  const selectedActivity = useMemo(
    () => filtered.find((activity) => activity.id === selectedActivityId) ?? null,
    [filtered, selectedActivityId],
  );

  const handleRecenter = useCallback(() => {
    setIsLocating(true);
    if (!('geolocation' in navigator)) {
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(loc);
        setMapCenter(loc);
        setIsLocating(false);
      },
      () => {
        setMapCenter([-41.1335, -71.3103]);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
      () => undefined,
      { enableHighAccuracy: false, timeout: 5000 },
    );
  }, []);

  const handleMapMove = useCallback((bounds: L.LatLngBounds) => {
    const count = filtered.filter((activity) => activity.latitude && activity.longitude && bounds.contains([activity.latitude, activity.longitude])).length;
    setVisibleCount(count);
  }, [filtered]);

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-surface md:h-[calc(100vh-5rem)]">
      <div className="absolute inset-0">
        <MapErrorBoundary
          fallback={(
            <div className="flex h-full w-full items-center justify-center bg-surface-container">
              <div className="space-y-2 px-6 text-center">
                <h3 className="font-headline text-2xl font-black uppercase tracking-tight text-on-surface">No pudimos cargar el mapa</h3>
                <p className="text-sm text-on-surface-variant">Puedes seguir explorando desde la lista o volver al feed.</p>
              </div>
            </div>
          )}
        >
          <ActivityMap
            activities={filtered}
            onActivityClick={setSelectedActivityId}
            center={mapCenter}
            zoom={12}
            selectedActivityId={selectedActivityId}
            userLocation={userLocation}
            onMapMove={handleMapMove}
          />
        </MapErrorBoundary>
      </div>

      <div className="absolute left-4 right-4 top-4 z-[1000] md:left-8 md:right-8 md:top-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="glass overflow-hidden rounded-[2.1rem] border border-outline-variant/20 px-5 py-5 shadow-[var(--shadow-forest)] md:px-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-3">
                <p className="section-kicker">Map + list</p>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h1 className="font-headline text-4xl font-black uppercase leading-[0.92] tracking-tight text-on-surface md:text-5xl">
                      Explora el territorio.
                    </h1>
                    <p className="mt-2 max-w-xl text-sm text-on-surface-variant md:text-base">
                      Busca, filtra y salta del mapa a la ficha detallada con una navegación más inmersiva.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2">
                    <Compass size={16} className="text-primary" />
                    <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                      {visibleCount ?? filtered.length} activas en pantalla
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-on-surface-variant">
                  <div className="editorial-badge">Mapa inmersivo</div>
                  <div className="editorial-badge">Overlay editorial</div>
                </div>
              </div>
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Montaña, host, ciudad o experiencia" />
            </div>
          </div>

          <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
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
        </div>
      </div>

      {!selectedActivity && visibleCount !== null && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="absolute left-1/2 top-[10.75rem] z-[1000] -translate-x-1/2 md:top-[12.5rem]">
          <div className="glass flex items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2.5 shadow-[var(--shadow-soft)]">
            <MapPin size={14} className="text-primary" />
            <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
              {visibleCount} {visibleCount === 1 ? 'ruta visible' : 'rutas visibles'}
            </span>
          </div>
        </motion.div>
      )}

      <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-3 md:bottom-8 md:right-8">
        <button
          type="button"
          onClick={handleRecenter}
          className="glass flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-outline-variant/20 text-on-surface shadow-[var(--shadow-soft)] cursor-pointer"
          title="Centrar mapa"
        >
          {isLocating ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Navigation size={20} />
            </motion.div>
          ) : (
            <Crosshair size={20} />
          )}
        </button>
      </div>

      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            key={selectedActivity.id}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="absolute bottom-0 left-0 right-0 z-[1000] px-4 pb-6 md:px-8"
          >
            <div className="relative mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-outline-variant/20 glass shadow-[var(--shadow-forest)]">
              <button
                type="button"
                onClick={() => setSelectedActivityId(null)}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant cursor-pointer"
              >
                <X size={16} />
              </button>

              <ActivityCard activity={selectedActivity} variant="compact" onClick={() => navigate(`/activity/${selectedActivity.id}`)} />

              <div className="flex items-center justify-between border-t border-outline-variant/15 px-5 py-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Users size={15} className="text-primary" />
                  <span className="font-label text-[10px] uppercase tracking-[0.16em]">
                    {selectedActivity.confirmed_count}/{selectedActivity.capacity} en equipo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/activity/${selectedActivity.id}`)}
                  className="rounded-full bg-primary/10 px-4 py-2 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-primary cursor-pointer"
                >
                  Abrir ficha
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
