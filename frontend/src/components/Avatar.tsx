import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  fallback?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-[9px]',
  md: 'h-11 w-11 text-[10px]',
  lg: 'h-16 w-16 text-xs',
} as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function Avatar({ src, alt, size = 'md', fallback, className = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !failed && !!src;

  return (
    <div
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-high font-[Space_Grotesk] font-semibold text-muted',
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="select-none">{fallback ?? getInitials(alt)}</span>
      )}
    </div>
  );
}
