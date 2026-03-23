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
  draft: 'bg-gray-500/20 text-gray-300',
  published: 'bg-green-500/20 text-green-400',
  completed: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-red-500/20 text-red-400',
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-cta-from)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        <p>No se pudieron cargar las estadísticas.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-[var(--font-display)]">
            Dashboard Organizador
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Resumen de tus actividades y métricas
          </p>
        </div>
        <CTAButton variant="secondary" size="sm" onClick={handleExport} icon={<Download className="w-4 h-4" />} label="Exportar CSV" />
      </motion.div>

      {/* Stat Cards Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
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
      <motion.div variants={itemVariants} className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold">
          <TrendingUp className="w-5 h-5 text-[var(--color-cta-from)]" />
          Desglose de ingresos
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-400">Total bruto</p>
            <p className="text-lg font-bold text-white">{formatCLP(data.revenue.total)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Comisión plataforma</p>
            <p className="text-lg font-bold text-red-400">{formatCLP(data.revenue.fees)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Tu pago neto</p>
            <p className="text-lg font-bold text-green-400">{formatCLP(data.revenue.payout)}</p>
          </div>
        </div>
      </motion.div>

      {/* Status Breakdown */}
      <motion.div variants={itemVariants} className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold">
          <BarChart3 className="w-5 h-5 text-[var(--color-cta-from)]" />
          Por estado
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.by_status).map(([st, count]) => (
            <span
              key={st}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[st as StatusKey] || 'bg-gray-500/20 text-gray-300'
              }`}
            >
              {statusLabels[st as StatusKey] || st}: {count as number}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Recent Activities Table */}
      <motion.div variants={itemVariants} className="glass rounded-2xl p-5 space-y-3">
        <h3 className="text-white font-semibold">Actividades recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-400 border-b border-white/10">
              <tr>
                <th className="py-2 pr-4">Título</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 text-right">Inscritos</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {data.recent_activities.map((act) => (
                <tr key={act.id} className="border-b border-white/5">
                  <td className="py-2 pr-4 text-white">{act.title}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[act.status as StatusKey] || 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {statusLabels[act.status as StatusKey] || act.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-400">
                    {new Date(act.start_datetime).toLocaleDateString('es-CL')}
                  </td>
                  <td className="py-2 text-right">
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
