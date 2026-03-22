import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-surface-container p-5">
      <div className="text-primary">{icon}</div>

      <span className="font-[Epilogue] text-2xl font-bold text-on-surface leading-none">
        {value}
      </span>

      <span className="font-[Space_Grotesk] text-xs uppercase tracking-wider text-muted">
        {label}
      </span>
    </div>
  );
}
