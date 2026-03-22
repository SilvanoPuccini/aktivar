import { Sun, Cloud, CloudRain, Snowflake, CloudSun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface WeatherBadgeProps {
  temp: number;
  description: string;
  icon?: string;
}

function getWeatherIcon(description: string): LucideIcon {
  const d = description.toLowerCase();
  if (d.includes('nieve') || d.includes('snow')) return Snowflake;
  if (d.includes('lluvia') || d.includes('rain')) return CloudRain;
  if (d.includes('nublado') || d.includes('cloud') || d.includes('nube')) return Cloud;
  if (d.includes('parcial') || d.includes('partly')) return CloudSun;
  return Sun;
}

export default function WeatherBadge({ temp, description }: WeatherBadgeProps) {
  const Icon = getWeatherIcon(description);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 font-[Space_Grotesk] text-xs text-muted">
      <Icon size={14} />
      <span>{temp}°C</span>
      <span className="text-on-surface-variant">{description}</span>
    </div>
  );
}
