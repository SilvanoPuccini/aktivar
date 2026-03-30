import { motion } from 'framer-motion';
import {
  BarChart3,
  Download,
  DollarSign,
  Users,
  Star,
  TrendingUp,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useOrganizerDashboard } from '@/services/hooks';
import api, { endpoints } from '@/services/api';
import CTAButton from '@/components/CTAButton';
import StatCard from '@/components/StatCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
} as const;

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

type StatusKey = 'draft' | 'published' | 'completed' | 'cancelled';

const statusLabels: Record<StatusKey, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const statusColors: Record<StatusKey, string> = {
  draft: 'bg-surface-container-highest text-muted',
  published: 'bg-secondary/15 text-secondary',
  completed: 'bg-primary/15 text-primary',
  cancelled: 'bg-error/15 text-error',
};

interface DashboardData {
  total_activities: number;
  by_status: Record<string, number>;
  participants: { total: number; unique: number };
  revenue: { total: number; fees: number; payout: number };
  ratings: { average: number; total_reviews: number };
  recent_activities: Array<{
    id: number;
    title: string;
    status: string;
    start_datetime: string;
    capacity: number;
    confirmed: number;
  }>;
}

export default function OrganizerDashboardPage() {
  const { data, isLoading, error } = useOrganizerDashboard() as {
    data: DashboardData | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  const handleExport = async () => {
    try {
      const res = await api.get(`${endpoints.activities}dashboard/export/`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aktivar_activities.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted">
        <p>No se pudieron cargar las estadísticas.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10 pb-28 md:pb-12 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-black text-on-surface tracking-tight">
            Dashboard Organizador
          </h1>
          <p className="text-sm text-muted mt-1 font-body">
            Resumen de tus actividades y métricas
          </p>
        </div>
        <CTAButton variant="secondary" size="sm" onClick={handleExport} icon={<Download className="w-4 h-4" />} label="Exportar CSV" />
      </motion.div>

      {/* Stat Cards Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Actividades"
          value={data.total_activities}
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Participantes"
          value={data.participants.total}
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Ingresos"
          value={formatCLP(data.revenue.payout)}
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Rating"
          value={data.ratings.average > 0 ? `${data.ratings.average} / 5` : '—'}
        />
      </motion.div>

      {/* Revenue Breakdown */}
      <motion.div variants={itemVariants} className="bg-surface-container/60 rounded-2xl p-6 md:p-8 space-y-5 border border-outline-variant/10">
        <div className="flex items-center gap-2 text-on-surface font-headline font-bold text-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
          Desglose de ingresos
        </div>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-xs text-muted font-label uppercase tracking-wider">Total bruto</p>
            <p className="text-xl font-headline font-black text-on-surface mt-1">{formatCLP(data.revenue.total)}</p>
          </div>
          <div>
            <p className="text-xs text-muted font-label uppercase tracking-wider">Comisión</p>
            <p className="text-xl font-headline font-black text-error mt-1">{formatCLP(data.revenue.fees)}</p>
          </div>
          <div>
            <p className="text-xs text-muted font-label uppercase tracking-wider">Pago neto</p>
            <p className="text-xl font-headline font-black text-secondary mt-1">{formatCLP(data.revenue.payout)}</p>
          </div>
        </div>
      </motion.div>

      {/* Status Breakdown */}
      <motion.div variants={itemVariants} className="bg-surface-container/60 rounded-2xl p-6 md:p-8 space-y-5 border border-outline-variant/10">
        <div className="flex items-center gap-2 text-on-surface font-headline font-bold text-lg">
          <BarChart3 className="w-5 h-5 text-primary" />
          Por estado
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.by_status).map(([st, count]) => (
            <span
              key={st}
              className={`px-4 py-1.5 rounded-full text-sm font-label font-bold ${
                statusColors[st as StatusKey] || 'bg-surface-container-highest text-muted'
              }`}
            >
              {statusLabels[st as StatusKey] || st}: {count as number}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Recent Activities Table */}
      <motion.div variants={itemVariants} className="bg-surface-container/60 rounded-2xl p-6 md:p-8 space-y-5 border border-outline-variant/10">
        <h3 className="text-on-surface font-headline font-bold text-lg">Actividades recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted border-b border-outline-variant/15">
              <tr>
                <th className="py-3 pr-4 font-label text-xs uppercase tracking-wider">Título</th>
                <th className="py-3 pr-4 font-label text-xs uppercase tracking-wider">Estado</th>
                <th className="py-3 pr-4 font-label text-xs uppercase tracking-wider">Fecha</th>
                <th className="py-3 text-right font-label text-xs uppercase tracking-wider">Inscritos</th>
              </tr>
            </thead>
            <tbody className="text-on-surface-variant">
              {data.recent_activities.map((act) => (
                <tr key={act.id} className="border-b border-outline-variant/5">
                  <td className="py-3 pr-4 text-on-surface font-medium">{act.title}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-label font-bold ${
                        statusColors[act.status as StatusKey] || 'bg-surface-container-highest text-muted'
                      }`}
                    >
                      {statusLabels[act.status as StatusKey] || act.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted font-label text-xs">
                    {new Date(act.start_datetime).toLocaleDateString('es-CL')}
                  </td>
                  <td className="py-3 text-right font-label">
                    {act.confirmed}/{act.capacity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
