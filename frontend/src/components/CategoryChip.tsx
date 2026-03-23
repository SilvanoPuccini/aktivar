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
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
} as const;

const iconSizes = { sm: 14, md: 16 } as const;

function renderIcon(name: string, size: number): JSX.Element {
  const IconComponent = getIcon(name);
  return <IconComponent size={size} />;
}

export default function CategoryChip({
  category,
  selected = false,
  onClick,
  size = 'md',
}: CategoryChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05, opacity: 0.9 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center gap-1.5 rounded-full font-[Space_Grotesk] font-medium transition-colors duration-200 cursor-pointer select-none ${sizeClasses[size]} ${
        selected
          ? 'bg-secondary text-surface'
          : 'bg-surface-container-highest text-on-surface-variant'
      }`}
    >
      {renderIcon(category.icon, iconSizes[size])}
      <span>{category.name}</span>
    </motion.button>
  );
}
