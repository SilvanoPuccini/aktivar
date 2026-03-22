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
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
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

  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-full font-[Space_Grotesk] uppercase tracking-wider font-semibold transition-all duration-200 cursor-pointer select-none';

  const variantClasses = {
    primary: 'text-[#442c00]',
    secondary:
      'bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container',
    danger: 'bg-error text-[#442c00]',
  };

  const variantStyle =
    variant === 'primary'
      ? {
          background: 'linear-gradient(135deg, #ffc56c, #f0a500)',
        }
      : undefined;

  return (
    <motion.button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.02 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        ...variantStyle,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      }}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
      ) : icon ? (
        icon
      ) : null}
      {label}
    </motion.button>
  );
}
