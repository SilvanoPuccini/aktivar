import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="editorial-card flex min-h-36 flex-col justify-between rounded-[1.75rem] px-5 py-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-high text-primary">
        {icon}
      </div>
      <div className="space-y-1">
        <div className="font-headline text-3xl font-black leading-none tracking-tight text-on-surface">{value}</div>
        <div className="font-label text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">{label}</div>
      </div>
    </div>
  );
}
