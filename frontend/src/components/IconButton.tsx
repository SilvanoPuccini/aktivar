import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost';
  className?: string;
  style?: CSSProperties;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
} as const;

const variantClasses = {
  default: 'bg-surface-container-high text-on-surface-variant hover:text-on-surface',
  ghost: 'bg-transparent text-on-surface-variant hover:text-on-surface',
} as const;

export default function IconButton({
  icon,
  onClick,
  ariaLabel,
  size = 'md',
  variant = 'default',
  className = '',
  style,
  type = 'button',
  disabled = false,
}: IconButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      style={style}
      className={[
        'inline-flex items-center justify-center rounded-full cursor-pointer transition-colors',
        sizeClasses[size],
        variantClasses[variant],
        disabled ? 'cursor-not-allowed opacity-50' : '',
        className,
      ].join(' ')}
    >
      {icon}
    </motion.button>
  );
}
