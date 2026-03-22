import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar actividades…',
  onFocus,
  onBlur,
}: SearchBarProps) {
  return (
    <div
      className="relative flex items-center w-full rounded-full border border-outline-variant focus-within:border-primary transition-colors duration-200"
      style={{
        background: 'rgba(17,20,15,0.70)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <Search size={18} className="ml-4 shrink-0 text-muted" />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="flex-1 bg-transparent py-3 px-3 text-sm text-on-surface placeholder:text-muted font-[Plus_Jakarta_Sans] outline-none"
      />

      <AnimatePresence>
        {value.length > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            onClick={() => onChange('')}
            className="mr-3 shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-highest text-muted hover:text-on-surface transition-colors cursor-pointer"
          >
            <X size={14} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
