import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function SearchBar({ value, onChange, placeholder = 'Buscar aventuras…', onFocus, onBlur }: SearchBarProps) {
  return (
    <div className="glass flex w-full items-center rounded-[1.5rem] border border-outline-variant/20 bg-surface/70 px-4 py-1.5 shadow-[var(--shadow-soft)] transition-all focus-within:-translate-y-0.5 focus-within:border-primary/40 focus-within:bg-surface-container/85">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-primary">
        <Search size={16} className="shrink-0" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-3.5 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
      />
      <AnimatePresence>
        {value.length > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => onChange('')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <X size={14} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
