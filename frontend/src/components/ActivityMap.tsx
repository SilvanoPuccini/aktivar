import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Activity } from '@/types/activity';

// Fix Leaflet default marker icon issue with bundlers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface ActivityMapProps {
  activities: Activity[];
  onActivityClick?: (id: number) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
  singleMarker?: { lat: number; lng: number; label?: string };
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
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [activities, map]);

  return null;
}

export default function ActivityMap({
  activities,
  onActivityClick,
  center,
  zoom = 11,
  className = '',
  singleMarker,
}: ActivityMapProps) {
  const defaultCenter: [number, number] = center ?? [-33.4489, -70.6693]; // Santiago default

  return (
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      className={`h-full w-full ${className}`}
      style={{ background: '#11140f' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {singleMarker && (
        <Marker position={[singleMarker.lat, singleMarker.lng]}>
          {singleMarker.label && (
            <Popup>
              <span className="text-sm font-semibold">{singleMarker.label}</span>
            </Popup>
          )}
        </Marker>
      )}

      {!singleMarker && activities.map((activity) =>
        activity.latitude && activity.longitude ? (
          <Marker
            key={activity.id}
            position={[activity.latitude, activity.longitude]}
            eventHandlers={{
              click: () => onActivityClick?.(activity.id),
            }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <img
                  src={activity.cover_image}
                  alt={activity.title}
                  style={{
                    width: '100%',
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 6,
                    marginBottom: 6,
                  }}
                />
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                  {activity.title}
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>
                  {activity.location_name}
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                  {activity.is_free
                    ? 'Gratis'
                    : `$${activity.price.toLocaleString('es-CL')}`}
                  {' · '}
                  {activity.spots_remaining} cupos
                </div>
              </div>
            </Popup>
          </Marker>
        ) : null,
      )}

      {!singleMarker && <FitBounds activities={activities} />}
    </MapContainer>
  );
}
