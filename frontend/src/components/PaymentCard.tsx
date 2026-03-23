import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface PaymentCardProps {
  id: number;
  activityTitle: string;
  amount: number;
  currency?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  date: string;
  onClick?: () => void;
}

const statusConfig = {
  completed: {
    label: 'Completado',
    icon: CheckCircle,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  pending: {
    label: 'Pendiente',
    icon: Clock,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  failed: {
    label: 'Fallido',
    icon: AlertCircle,
    color: 'text-error',
    bg: 'bg-error/10',
  },
  refunded: {
    label: 'Reembolsado',
    icon: CreditCard,
    color: 'text-muted',
    bg: 'bg-surface-container-highest',
  },
} as const;

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentCard({
  activityTitle,
  amount,
  status,
  date,
  onClick,
}: PaymentCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="flex w-full items-center gap-3 rounded-2xl bg-surface-container border border-outline-variant p-4 text-left transition-colors hover:bg-surface-container-high cursor-pointer"
    >
      {/* Icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
        <StatusIcon size={18} className={config.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-display text-sm font-bold text-on-surface truncate">
          {activityTitle}
        </p>
        <p className="font-label text-xs text-muted mt-0.5">
          {new Date(date).toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Amount & Status */}
      <div className="text-right shrink-0">
        <p className="font-display text-sm font-bold text-on-surface">
          {formatCLP(amount)}
        </p>
        <p className={`font-label text-[10px] uppercase tracking-wider ${config.color}`}>
          {config.label}
        </p>
      </div>
    </motion.button>
  );
}
