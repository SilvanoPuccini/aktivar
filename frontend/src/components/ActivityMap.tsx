import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Activity } from '@/types/activity';

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
function createActivityIcon(color: string, isSelected: boolean = false): L.DivIcon {
  const size = isSelected ? 44 : 36;
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
        <div style="
          width: ${isSelected ? 12 : 10}px;
          height: ${isSelected ? 12 : 10}px;
          border-radius: 50%;
          transform: rotate(45deg);
          background: #11140f;
        "></div>
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

function getActivityIcon(slug: string, isSelected: boolean = false): L.DivIcon {
  // Avoid sharing DivIcon instances across markers to prevent
  // edge-case recursion issues in some Leaflet runtime states.
  return createActivityIcon(categoryColors[slug] || '#ffc56c', isSelected);
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
