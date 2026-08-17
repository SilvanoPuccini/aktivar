import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'tonal' | 'soft';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantClasses = {
  default: 'editorial-card',
  tonal: 'editorial-card-tonal',
  soft: 'editorial-card-soft',
} as const;

const paddingClasses = {
  sm: 'px-6 py-6',
  md: 'px-6 py-6 md:px-8 md:py-8',
  lg: 'px-6 py-8 md:px-8 md:py-10',
} as const;

export default function Card({ children, variant = 'default', padding = 'md', className = '' }: CardProps) {
  return (
    <div className={[variantClasses[variant], 'rounded-md', paddingClasses[padding], className].join(' ')}>
      {children}
    </div>
  );
}
