import type { ReactNode } from 'react';
import CTAButton from './CTAButton';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="editorial-card mx-auto flex max-w-xl flex-col items-start gap-5 rounded-[1rem] px-6 py-10 text-left md:px-8">
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-[0.75rem] bg-surface-container-high text-primary">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <span className="section-kicker">Estado</span>
        <h3 className="font-headline text-3xl font-black uppercase tracking-tight text-on-surface">{title}</h3>
        {description && <p className="max-w-md text-sm text-on-surface-variant">{description}</p>}
      </div>
      {action && <CTAButton label={action.label} onClick={action.onClick} size="sm" />}
    </div>
  );
}
