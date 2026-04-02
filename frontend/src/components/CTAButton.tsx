import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface CTAButtonProps {
  label: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  type?: 'button' | 'submit';
}

const sizeClasses = {
  sm: 'min-h-12 px-6 py-3 text-xs',
  md: 'min-h-14 px-8 py-4 text-sm',
  lg: 'min-h-16 px-10 py-5 text-base',
} as const;

export default function CTAButton({
  label,
  onClick,
  loading = false,
  disabled = false,
  variant = 'primary',
  fullWidth = false,
  size = 'md',
  icon,
  type = 'button',
}: CTAButtonProps) {
  const isDisabled = disabled || loading;

  const variantClasses = {
    primary: 'text-[#442c00]',
    secondary: 'bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container-high',
    danger: 'bg-error text-[#442c00] shadow-[var(--shadow-soft)]',
  };

  const style = variant === 'primary'
    ? { background: 'linear-gradient(135deg, #ffc56c 0%, #f0a500 100%)', boxShadow: 'var(--shadow-soft)' }
    : undefined;

  return (
    <motion.button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.02 }}
      whileTap={isDisabled ? undefined : { scale: 0.985 }}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-[0.75rem] font-label font-bold uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer',
        sizeClasses[size],
        variantClasses[variant],
        variant === 'primary' ? 'ring-1 ring-[#fff3dd]/15 hover:brightness-[1.02]' : '',
        fullWidth ? 'w-full' : '',
        isDisabled ? 'cursor-not-allowed opacity-50' : '',
      ].join(' ')}
      style={style}
    >
      {loading ? <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} /> : icon}
      <span>{label}</span>
    </motion.button>
  );
}
