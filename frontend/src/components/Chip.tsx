import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
}

export default function Chip({ label, selected = false, onClick, icon, className = '' }: ChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 font-label text-[10px] font-bold uppercase tracking-[0.16em] transition-colors cursor-pointer whitespace-nowrap',
        selected ? 'bg-primary text-[#442c00]' : 'bg-surface text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
        className,
      ].join(' ')}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}
