import { motion } from 'framer-motion';
import {
  Mountain,
  Music,
  Bike,
  Waves,
  Film,
  Plane,
  Users,
  Trophy,
  Tent,
  HelpCircle,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  mountain: Mountain,
  music: Music,
  bike: Bike,
  waves: Waves,
  film: Film,
  plane: Plane,
  users: Users,
  trophy: Trophy,
  tent: Tent,
  zap: Zap,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name.toLowerCase()] ?? HelpCircle;
}

interface CategoryChipProps {
  category: { name: string; icon: string; color?: string };
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'min-h-10 px-4 py-2 text-xs',
  md: 'min-h-12 px-5 py-2.5 text-sm',
} as const;

const iconSizes = { sm: 14, md: 16 } as const;

function renderIcon(name: string, size: number) {
  const IconComponent = getIcon(name);
  return <IconComponent size={size} strokeWidth={1.8} />;
}

export default function CategoryChip({ category, selected = false, onClick, size = 'md' }: CategoryChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={[
        'inline-flex items-center gap-2 rounded-full border font-label font-bold uppercase tracking-[0.14em] transition-all duration-200 cursor-pointer',
        sizeClasses[size],
        selected
          ? 'border-secondary/30 bg-secondary text-surface shadow-[0_10px_24px_rgba(123,218,150,0.18)]'
          : 'border-outline-variant/10 bg-surface-container-highest text-on-surface-variant hover:border-outline-variant/20 hover:bg-surface-container-high hover:text-on-surface',
      ].join(' ')}
    >
      {renderIcon(category.icon, iconSizes[size])}
      <span>{category.name}</span>
    </motion.button>
  );
}
