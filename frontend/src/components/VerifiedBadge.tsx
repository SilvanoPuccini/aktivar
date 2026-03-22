import { CheckCircle } from 'lucide-react';

interface VerifiedBadgeProps {
  type: 'email' | 'phone' | 'driver' | 'organizer';
  size?: 'sm' | 'md';
}

const tooltips: Record<VerifiedBadgeProps['type'], string> = {
  email: 'Email verificado',
  phone: 'Teléfono verificado',
  driver: 'Conductor verificado',
  organizer: 'Organizador verificado',
};

const iconSizes = { sm: 14, md: 18 } as const;

export default function VerifiedBadge({ type, size = 'md' }: VerifiedBadgeProps) {
  return (
    <span className="inline-flex items-center text-secondary" title={tooltips[type]}>
      <CheckCircle size={iconSizes[size]} />
    </span>
  );
}
