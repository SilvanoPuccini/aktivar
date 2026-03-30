import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-surface-container/60 border border-outline-variant/10 p-6">
      <div className="text-primary">{icon}</div>

      <span className="font-headline text-2xl font-black text-on-surface leading-none">
        {value}
      </span>

      <span className="font-label text-[10px] uppercase tracking-[0.15em] text-muted">
        {label}
      </span>
    </div>
  );
}
