import { Calendar, Download, DollarSign, Loader2, Star, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import CTAButton from '@/components/CTAButton';
import api, { endpoints } from '@/services/api';
import { useOrganizerDashboard } from '@/services/hooks';

interface DashboardData {
  total_activities: number;
  by_status: Record<string, number>;
  participants: { total: number; unique: number };
  revenue: { total: number; fees: number; payout: number };
  ratings: { average: number; total_reviews: number };
  recent_activities: Array<{ id: number; title: string; status: string; start_datetime: string; capacity: number; confirmed: number }>;
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
}

function downloadCsv(filename: string, rows: string[]) {
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function OrganizerDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useOrganizerDashboard() as { data: DashboardData | undefined; isLoading: boolean; error: Error | null };
  const [now] = useState(() => Date.now());
  const recent = data?.recent_activities ?? [];
  const upcoming = recent.filter((activity) => new Date(activity.start_datetime).getTime() >= now).slice(0, 2);
  const archive = recent.filter((activity) => new Date(activity.start_datetime).getTime() < now);
  const cardBackgrounds = [
    'linear-gradient(180deg, rgba(6,18,28,0.05) 0%, rgba(17,20,15,0.92) 100%), linear-gradient(135deg, #8ec5fc 0%, #111827 75%)',
    'linear-gradient(180deg, rgba(6,18,28,0.05) 0%, rgba(17,20,15,0.92) 100%), linear-gradient(135deg, #14532d 0%, #d9f99d 120%)',
  ];

  const handleExport = async () => {
    if (!data) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      const res = await api.get(`${endpoints.activities}dashboard/export/`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'aktivar_activities.csv';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exportado');
    } catch {
      const rows = [
        'title,status,start_datetime,capacity,confirmed',
        ...recent.map((activity) => [
          activity.title,
          activity.status,
          activity.start_datetime,
          activity.capacity,
          activity.confirmed,
        ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')),
      ];
      downloadCsv('aktivar_activities.csv', rows);
      toast('Exportamos una copia local del dashboard.', { icon: '⬇️' });
    }
  };

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (error || !data) return <div className="flex min-h-[60vh] items-center justify-center text-on-surface-variant">No se pudo cargar el dashboard.</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-12">
      <section className="px-2 pt-2">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">Adventurer dashboard</p>
            <h1 className="hero-title text-5xl text-on-surface md:text-7xl">My trips</h1>
          </div>
          <CTAButton label="Exportar CSV" variant="secondary" icon={<Download size={14} />} onClick={() => void handleExport()} />
        </div>
      </section>

      <section className="space-y-7">
        <div className="flex items-baseline gap-4">
          <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-on-surface">Upcoming</h2>
          <div className="h-px flex-1 bg-outline-variant/20" />
          <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">{upcoming.length} expeditions</span>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {upcoming.map((activity, index) => (
            <article key={activity.id} className="group relative overflow-hidden rounded-[1.8rem] bg-surface-container shadow-2xl">
              <div className="relative h-[26rem] overflow-hidden">
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ background: cardBackgrounds[index % cardBackgrounds.length] }} />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
                <div className={`absolute right-6 top-6 rounded-[1rem] px-4 py-2 font-label text-[10px] uppercase tracking-[0.16em] ${index === 0 ? 'bg-primary text-[#442c00]' : 'bg-surface-container-highest text-on-surface'}`}>
                  {Math.max(1, Math.ceil((new Date(activity.start_datetime).getTime() - now) / 86400000))} days to go
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="font-label text-[10px] uppercase tracking-[0.16em] text-secondary">{activity.status}</p>
                  <h3 className="mt-3 font-headline text-4xl font-black uppercase leading-none tracking-tight text-on-surface">{activity.title}</h3>
                  <div className="mt-5 grid grid-cols-2 gap-6">
                    <div>
                      <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Meeting point</p>
                      <p className="mt-2 text-sm text-on-surface">{new Date(activity.start_datetime).toLocaleDateString('es-CL')}</p>
                    </div>
                    <div>
                      <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Team size</p>
                      <p className="mt-2 text-sm text-on-surface">{String(activity.confirmed).padStart(2, '0')} members</p>
                    </div>
                  </div>
                  <div className="mt-8">
                    <CTAButton label="Open group chat" variant="secondary" onClick={() => navigate(`/chat/${activity.id}`)} fullWidth />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="editorial-card rounded-[2rem] px-6 py-6 md:px-8 md:py-8">
          <div className="flex items-center gap-3"><TrendingUp size={18} className="text-primary" /><div><p className="section-kicker">Revenue</p><h2 className="font-headline text-3xl font-black uppercase tracking-tight text-on-surface">Desglose financiero</h2></div></div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-surface px-4 py-5"><p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Bruto</p><p className="mt-2 font-headline text-3xl font-black text-on-surface">{formatCLP(data.revenue.total)}</p></div>
            <div className="rounded-[1.5rem] bg-surface px-4 py-5"><p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Comisión</p><p className="mt-2 font-headline text-3xl font-black text-error">{formatCLP(data.revenue.fees)}</p></div>
            <div className="rounded-[1.5rem] bg-surface px-4 py-5"><p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Neto</p><p className="mt-2 font-headline text-3xl font-black text-secondary">{formatCLP(data.revenue.payout)}</p></div>
          </div>
        </div>

        <div className="editorial-card rounded-[2rem] px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] bg-surface px-4 py-5">
              <div className="flex items-center gap-2"><Calendar size={16} className="text-primary" /><p className="section-kicker">Activities</p></div>
              <p className="mt-3 font-headline text-4xl font-black text-on-surface">{data.total_activities}</p>
            </div>
            <div className="rounded-[1.5rem] bg-surface px-4 py-5">
              <div className="flex items-center gap-2"><Users size={16} className="text-primary" /><p className="section-kicker">Participants</p></div>
              <p className="mt-3 font-headline text-4xl font-black text-on-surface">{data.participants.total}</p>
            </div>
            <div className="rounded-[1.5rem] bg-surface px-4 py-5">
              <div className="flex items-center gap-2"><DollarSign size={16} className="text-primary" /><p className="section-kicker">Payout</p></div>
              <p className="mt-3 font-headline text-3xl font-black text-on-surface">{formatCLP(data.revenue.payout)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-surface px-4 py-5">
              <div className="flex items-center gap-2"><Star size={16} className="text-primary" /><p className="section-kicker">Rating</p></div>
              <p className="mt-3 font-headline text-4xl font-black text-on-surface">{data.ratings.average > 0 ? `${data.ratings.average}/5` : '—'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-7">
        <div className="flex items-baseline gap-4">
          <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-on-surface">Past expeditions</h2>
          <div className="h-px flex-1 bg-outline-variant/20" />
          <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">History</span>
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {archive.slice(0, 4).map((activity, index) => (
            <div key={activity.id} className="space-y-3">
              <div className="aspect-square overflow-hidden rounded-[1.25rem] bg-surface-container">
                <div className="h-full w-full grayscale transition duration-500 hover:grayscale-0" style={{ background: cardBackgrounds[index % cardBackgrounds.length] }} />
              </div>
              <div className="px-1">
                <h4 className="font-headline text-sm font-bold uppercase tracking-tight text-on-surface">{activity.title}</h4>
                <div className="mt-2 flex gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, starIndex) => <Star key={starIndex} size={12} fill={starIndex < Math.min(5, activity.confirmed) ? 'currentColor' : 'none'} />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
