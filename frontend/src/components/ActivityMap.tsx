import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Activity } from '@/types/activity';

// SVG icon paths per category slug
const categoryIcons: Record<string, string> = {
  trekking: '<path d="M13 3L4 14h3l-2 7 9-11h-3l2-7z" fill="currentColor"/>',
  festival: '<path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" fill="none" stroke="currentColor" stroke-width="2"/>',
  ciclismo: '<circle cx="5.5" cy="17.5" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18.5" cy="17.5" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  kayak: '<path d="M2 12c2-3 5-5 10-5s8 2 10 5c-2 3-5 5-10 5s-8-2-10-5z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="4" y1="8" x2="20" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  cine: '<rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/>',
  viaje: '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.7 7.3c.2.4.7.5 1.1.3l.5-.3c.4-.2.5-.7.4-1.1z" fill="currentColor"/>',
  social: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  deporte: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C6 4 6 6 6 6zM18 9h1.5a2.5 2.5 0 0 0 0-5C18 4 18 6 18 6zM4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 1 0 12 0V2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  camping: '<path d="M3 21h18L12 3 3 21zm9-4v-4m-3 4h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  surf: '<path d="M2 12c2-2.5 4-4 6-4s4 1.5 6 4c2 2.5 4 4 6 4s4-1.5 6-4M2 6c2-2.5 4-4 6-4s4 1.5 6 4c2 2.5 4 4 6 4s4-1.5 6-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};

// Category color map
const categoryColors: Record<string, string> = {
  trekking: '#7BDA96',
  festival: '#FFC56C',
  ciclismo: '#5B9CF6',
  kayak: '#4ECDC4',
  cine: '#FFB4AB',
  viaje: '#D6C4AC',
  social: '#E1E3DA',
  deporte: '#F0A500',
  camping: '#7BDA96',
  surf: '#5B9CF6',
};

// Create custom marker with category icon inside
function createActivityIcon(slug: string, color: string, isSelected: boolean = false): L.DivIcon {
  const size = isSelected ? 44 : 36;
  const iconSvg = categoryIcons[slug] || categoryIcons.social;
  const svgSize = isSelected ? 18 : 14;
  const borderWidth = isSelected ? 3 : 2;
  const shadow = isSelected
    ? `0 0 0 4px ${color}33, 0 6px 20px rgba(0,0,0,0.5)`
    : '0 4px 12px rgba(0,0,0,0.4)';

  return L.divIcon({
    className: 'aktivar-marker',
    html: `
      <div class="aktivar-marker-pin${isSelected ? ' aktivar-marker-selected' : ''}" style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: ${borderWidth}px solid #11140f;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: ${shadow};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        position: relative;
      ">
        <svg viewBox="0 0 24 24" width="${svgSize}" height="${svgSize}" style="
          transform: rotate(45deg);
          color: #11140f;
          flex-shrink: 0;
        ">${iconSvg}</svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Pulsing user location marker
const userLocationIcon = L.divIcon({
  className: 'aktivar-marker',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div class="aktivar-pulse" style="
        position: absolute;
        inset: -8px;
        background: rgba(91, 156, 246, 0.2);
        border-radius: 50%;
        animation: aktivar-pulse-ring 2s ease-out infinite;
      "></div>
      <div style="
        width: 24px;
        height: 24px;
        background: #5B9CF6;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(91,156,246,0.5);
        position: relative;
        z-index: 1;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const singleMarkerIcon = L.divIcon({
  className: 'aktivar-marker',
  html: `
    <div style="position: relative; width: 20px; height: 20px;">
      <div style="
        position: absolute;
        inset: -6px;
        background: rgba(255,197,108,0.25);
        border-radius: 50%;
        animation: aktivar-pulse-ring 2s ease-out infinite;
      "></div>
      <div style="
        width: 20px;
        height: 20px;
        background: #ffc56c;
        border: 3px solid #11140f;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        position: relative;
        z-index: 1;
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -14],
});

// Icon cache for performance
const iconCache: Record<string, L.DivIcon> = {};
function getActivityIcon(slug: string, isSelected: boolean = false): L.DivIcon {
  const key = `${slug}-${isSelected}`;
  if (!iconCache[key]) {
    iconCache[key] = createActivityIcon(slug, categoryColors[slug] || '#ffc56c', isSelected);
  }
  return iconCache[key];
}

// Format date for popup
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Difficulty label and color
const difficultyInfo: Record<string, { label: string; color: string }> = {
  easy: { label: 'Fácil', color: '#7BDA96' },
  moderate: { label: 'Moderado', color: '#FFC56C' },
  hard: { label: 'Difícil', color: '#FFB4AB' },
  expert: { label: 'Experto', color: '#FF6B6B' },
};

interface ActivityMapProps {
  activities: Activity[];
  onActivityClick?: (id: number) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
  singleMarker?: { lat: number; lng: number; label?: string };
  selectedActivityId?: number | null;
  userLocation?: [number, number] | null;
  onMapMove?: (bounds: L.LatLngBounds, center: L.LatLng, zoom: number) => void;
  interactive?: boolean;
}

function FitBounds({ activities }: { activities: Activity[] }) {
  const map = useMap();

  useEffect(() => {
    if (activities.length === 0) return;
    const coords = activities
      .filter((a) => a.latitude && a.longitude)
      .map((a) => [a.latitude, a.longitude] as [number, number]);
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [activities, map]);

  return null;
}

function MapCenter({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom ?? 14, { duration: 1.2 });
    }
  }, [center, zoom, map]);

  return null;
}

function MapEvents({ onMapMove }: { onMapMove?: (bounds: L.LatLngBounds, center: L.LatLng, zoom: number) => void }) {
  useMapEvents({
    moveend: (e) => {
      if (onMapMove) {
        const map = e.target;
        onMapMove(map.getBounds(), map.getCenter(), map.getZoom());
      }
    },
  });
  return null;
}


export default function ActivityMap({
  activities,
  onActivityClick,
  center,
  zoom = 11,
  className = '',
  singleMarker,
  selectedActivityId,
  userLocation,
  onMapMove,
  interactive = true,
}: ActivityMapProps) {
  const defaultCenter: [number, number] = center ?? [-41.1335, -71.3103];

  // Memoize markers
  const markers = useMemo(
    () =>
      activities
        .filter((a) => a.latitude && a.longitude)
        .map((a) => ({
          id: a.id,
          position: [a.latitude, a.longitude] as [number, number],
          icon: getActivityIcon(a.category.slug, a.id === selectedActivityId),
          title: a.title,
          location: a.location_name,
          meetingPoint: a.meeting_point,
          price: a.is_free ? 'Gratis' : `$${a.price.toLocaleString('es-CL')}`,
          spots: a.spots_remaining,
          capacity: a.capacity,
          cover: a.cover_image,
          category: a.category.name,
          categorySlug: a.category.slug,
          categoryColor: categoryColors[a.category.slug] || '#ffc56c',
          difficulty: a.difficulty,
          date: a.start_datetime,
          distanceKm: a.distance_km,
          confirmedCount: a.confirmed_count,
          participantsPreview: a.participants_preview,
          organizer: a.organizer,
          isSelected: a.id === selectedActivityId,
          status: a.status,
        })),
    [activities, selectedActivityId],
  );

  return (
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      className={`h-full w-full ${className}`}
      style={{ background: '#0c0f0a' }}
      zoomControl={false}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {interactive && (
        <ZoomControl position="bottomright" />
      )}

      {onMapMove && <MapEvents onMapMove={onMapMove} />}

      {/* User location marker */}
      {userLocation && (
        <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={1000}>
          <Popup>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>
              📍 Tu ubicación
            </div>
          </Popup>
        </Marker>
      )}

      {/* Single marker mode */}
      {singleMarker && (
        <Marker position={[singleMarker.lat, singleMarker.lng]} icon={singleMarkerIcon}>
          {singleMarker.label && (
            <Popup>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>
                {singleMarker.label}
              </span>
            </Popup>
          )}
        </Marker>
      )}

      {/* Activity markers with rich popups */}
      {!singleMarker && markers.map((m) => (
        <Marker
          key={m.id}
          position={m.position}
          icon={m.icon}
          zIndexOffset={m.isSelected ? 500 : 0}
          eventHandlers={{
            click: () => onActivityClick?.(m.id),
          }}
        >
          <Popup maxWidth={300} minWidth={260} className="aktivar-popup">
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
              {/* Cover image with gradient overlay */}
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <img
                  src={m.cover}
                  alt={m.title}
                  style={{
                    width: '100%',
                    height: 110,
                    objectFit: 'cover',
                    borderRadius: 10,
                    display: 'block',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 40,
                  background: 'linear-gradient(transparent, rgba(29,32,27,0.9))',
                  borderRadius: '0 0 10px 10px',
                }} />
                {/* Status badge for non-published */}
                {m.status === 'completed' && (
                  <div style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: 'rgba(17,20,15,0.8)',
                    color: '#9f8e79',
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontFamily: "'Space Grotesk', monospace",
                    backdropFilter: 'blur(8px)',
                  }}>
                    Finalizada
                  </div>
                )}
              </div>

              {/* Category + difficulty badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: m.categoryColor,
                  color: '#11140f',
                  padding: '2px 8px',
                  borderRadius: 99,
                  fontFamily: "'Space Grotesk', monospace",
                }}>
                  {m.category}
                </span>
                {m.difficulty && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: 'rgba(255,255,255,0.08)',
                    color: difficultyInfo[m.difficulty]?.color || '#e1e3da',
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontFamily: "'Space Grotesk', monospace",
                  }}>
                    {difficultyInfo[m.difficulty]?.label || m.difficulty}
                  </span>
                )}
                {m.distanceKm && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: '#9f8e79',
                    fontFamily: "'Space Grotesk', monospace",
                  }}>
                    {m.distanceKm} km
                  </span>
                )}
              </div>

              {/* Title */}
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, color: '#e1e3da', lineHeight: 1.3 }}>
                {m.title}
              </div>

              {/* Location + meeting point */}
              <div style={{ fontSize: 11, color: '#9f8e79', marginBottom: 2 }}>
                📍 {m.location}
              </div>
              {m.meetingPoint && (
                <div style={{ fontSize: 10, color: '#6b6155', marginBottom: 6 }}>
                  Punto de encuentro: {m.meetingPoint}
                </div>
              )}

              {/* Date */}
              <div style={{ fontSize: 11, color: '#d6c4ac', marginBottom: 8 }}>
                🗓 {formatDate(m.date)}
              </div>

              {/* Organizer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(81,69,51,0.2)' }}>
                <img
                  src={m.organizer.avatar}
                  alt={m.organizer.full_name}
                  style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '1px solid #514533' }}
                />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#e1e3da' }}>
                    {m.organizer.full_name}
                    {m.organizer.is_verified_email && (
                      <span style={{ color: '#5B9CF6', marginLeft: 4, fontSize: 10 }}>✓</span>
                    )}
                  </div>
                  {m.organizer.total_activities && (
                    <div style={{ fontSize: 9, color: '#9f8e79' }}>
                      {m.organizer.total_activities} actividades organizadas
                    </div>
                  )}
                </div>
              </div>

              {/* Footer: price, spots, participants */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: m.price === 'Gratis' ? '#7BDA96' : '#ffc56c' }}>
                    {m.price}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Participant avatars */}
                  {m.participantsPreview.length > 0 && (
                    <div style={{ display: 'flex', marginRight: 4 }}>
                      {m.participantsPreview.slice(0, 3).map((p, i) => (
                        <img
                          key={p.id}
                          src={p.avatar}
                          alt={p.full_name}
                          title={p.full_name}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #1d201b',
                            marginLeft: i > 0 ? -6 : 0,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: m.spots <= 0 ? '#FF6B6B' : m.spots <= 3 ? '#FFB4AB' : '#9f8e79',
                  }}>
                    {m.spots > 0 ? `${m.spots}/${m.capacity}` : 'Lleno'}
                  </span>
                </div>
              </div>

              {/* CTA button */}
              {m.status === 'published' && (
                <button
                  type="button"
                  onClick={() => onActivityClick?.(m.id)}
                  style={{
                    width: '100%',
                    marginTop: 10,
                    padding: '8px 0',
                    background: 'linear-gradient(135deg, #ffc56c, #f0a500)',
                    color: '#442c00',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: "'Space Grotesk', monospace",
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                >
                  Ver actividad →
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {!singleMarker && <FitBounds activities={activities} />}
      {center && <MapCenter center={center} zoom={zoom} />}
    </MapContainer>
  );
}
