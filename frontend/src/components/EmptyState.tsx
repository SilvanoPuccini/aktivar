import type { ReactNode } from 'react';
import CTAButton from './CTAButton';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      {icon && (
        <div className="flex items-center justify-center w-16 h-16 text-muted">
          {icon}
        </div>
      )}

      <h3 className="font-[Epilogue] text-lg font-semibold text-on-surface">
        {title}
      </h3>

      {description && (
        <p className="max-w-xs font-[Plus_Jakarta_Sans] text-sm text-muted leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-2">
          <CTAButton
            label={action.label}
            onClick={action.onClick}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}
