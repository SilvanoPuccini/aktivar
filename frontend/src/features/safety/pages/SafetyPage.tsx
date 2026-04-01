import { AlertTriangle, CheckCircle2, Radio, ShieldAlert, Wind } from 'lucide-react';
import toast from 'react-hot-toast';
import CTAButton from '@/components/CTAButton';
import EmptyState from '@/components/EmptyState';
import EcosystemNav from '@/components/EcosystemNav';
import { mockSafetyDashboard } from '@/data/ecosystem';
import { useInitiateSOS, useSafetyDashboard, useUpdateSafetyChecklist } from '@/services/hooks';

const riskTone: Record<'green' | 'warning' | 'high', string> = {
  green: 'text-secondary',
  warning: 'text-primary',
  high: 'text-error',
};

const severityTone: Record<'info' | 'warning' | 'critical', string> = {
  info: 'border-secondary/40 bg-secondary/8 text-secondary',
  warning: 'border-primary/40 bg-primary/8 text-primary',
  critical: 'border-error/40 bg-error-container/25 text-error',
};

export default function SafetyPage() {
  const { data, isLoading, refetch } = useSafetyDashboard();
  const sos = useInitiateSOS();
  const updateChecklist = useUpdateSafetyChecklist();

  if (isLoading && !data) {
    return (
      <div className="premium-page">
        <EcosystemNav />
        <section className="editorial-card-tonal rounded-[2rem] p-6 md:p-8">
          <p className="section-kicker">Loading safety data</p>
          <h1 className="mt-2 font-headline text-4xl font-black uppercase tracking-tight text-on-surface">Connecting the command center…</h1>
        </section>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="premium-page">
        <EcosystemNav />
        <EmptyState
          title="No pudimos cargar safety"
          description="Reintenta para recuperar alertas, contactos y checklist operativo."
          action={{ label: 'Retry', onClick: () => void refetch() }}
        />
      </div>
    );
  }

  const dashboard = {
    ...mockSafetyDashboard,
    ...data,
    status: { ...mockSafetyDashboard.status, ...(data.status ?? {}) },
    checklist: { ...mockSafetyDashboard.checklist, ...(data.checklist ?? {}) },
    contacts: Array.isArray(data.contacts) ? data.contacts : [],
    logs: Array.isArray(data.logs) ? data.logs : [],
  };
  const contacts = dashboard.contacts;
  const logs = dashboard.logs;
  const gearTarget = Math.max(1, Number(dashboard.checklist.gear_target) || 0);
  const gearProgress = Math.max(0, Number(dashboard.checklist.gear_progress) || 0);
  const gearPercent = Math.min(100, Math.round((gearProgress / gearTarget) * 100));
  const riskLevel = dashboard.status.risk_level && dashboard.status.risk_level in riskTone ? dashboard.status.risk_level : 'warning';

  const handleSos = () => {
    sos.mutate({ message: 'SOS triggered from command center.' }, {
      onSuccess: () => toast.success('SOS emitido correctamente'),
      onError: () => toast.error('No se pudo emitir SOS'),
    });
  };

  return (
    <div className="premium-page">
      <EcosystemNav />

      <section className="premium-hero p-6 md:p-8 lg:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 text-sm text-on-surface-variant">
               <span className="premium-chip">{dashboard.status.expedition_protocol}</span>
               <span className={`premium-chip ${riskTone[riskLevel]}`}>{riskLevel} risk</span>
            </div>
            <h1 className="mt-5 hero-title text-5xl text-on-surface md:text-7xl">Safety & SOS command center</h1>
            <p className="mt-4 text-base text-on-surface-variant md:text-lg">Reordenamos la página como un centro operativo: acción crítica arriba, lectura meteorológica más teatral y módulos secundarios con menos ruido visual.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[24rem]">
            <div className="editorial-metric rounded-[1.5rem] px-5 py-5">
              <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">System</p>
               <p className="mt-2 font-headline text-2xl font-black tracking-tight text-secondary">{dashboard.status.system_status}</p>
            </div>
            <div className="editorial-metric rounded-[1.5rem] px-5 py-5">
              <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Last sync</p>
               <p className="mt-2 font-headline text-2xl font-black tracking-tight text-on-surface">{Number.isNaN(new Date(dashboard.status.last_sync_at).getTime()) ? '—' : new Date(dashboard.status.last_sync_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.05fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-error/25 bg-error-container/14 p-6 shadow-[var(--shadow-soft)]">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-error/10 blur-3xl" />
          <div className="relative">
            <p className="section-kicker text-error">Emergency override</p>
            <h2 className="mt-3 font-headline text-4xl font-black uppercase text-on-surface">Initiate SOS</h2>
            <p className="mt-4 max-w-sm text-sm text-on-surface-variant">Broadcasts coordinates to SAR, park rangers and emergency contacts through the expedition safety stack.</p>
            <div className="mt-10">
              <CTAButton label="Hold to broadcast" variant="danger" onClick={handleSos} loading={sos.isPending} fullWidth size="lg" />
            </div>
            <p className="mt-4 text-center font-label text-[10px] uppercase tracking-[0.18em] text-error/80">Accidental trigger protection active</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-surface-container shadow-[var(--shadow-forest)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,197,108,0.12),_transparent_32%),linear-gradient(180deg,_rgba(17,20,15,0.12),_rgba(17,20,15,0.72))]" />
          <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Current location</p>
                 <h2 className="mt-2 font-headline text-3xl font-black text-on-surface md:text-4xl">{dashboard.status.current_location}</h2>
              </div>
              <div className="text-right">
                <Wind className="ml-auto text-primary" />
                 <p className={`mt-2 font-label text-[10px] uppercase tracking-[0.18em] ${riskTone[riskLevel]}`}>{riskLevel} risk</p>
              </div>
            </div>

            <div className="mt-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                 <p className="font-headline text-7xl font-black tracking-tight text-on-surface">{dashboard.status.temperature_c}°C</p>
                <div className="mt-4 grid grid-cols-2 gap-5 text-sm text-on-surface-variant">
                  <div>
                    <p className="section-kicker">Wind</p>
                     <p className="mt-1 text-on-surface">{dashboard.status.wind_kmh} km/h</p>
                  </div>
                  <div>
                    <p className="section-kicker">Visibility</p>
                     <p className="mt-1 text-on-surface">{dashboard.status.visibility_m} m</p>
                  </div>
                </div>
              </div>

              <div className="max-w-xs rounded-[1.4rem] bg-surface-container-highest/70 p-5 backdrop-blur-sm">
                <p className="section-kicker text-primary">Storm warning</p>
                 <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{dashboard.status.storm_warning}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="editorial-card-tonal rounded-[2rem] p-6">
          <div className="flex items-center justify-between">
            <p className="section-kicker">Group status</p>
            <CheckCircle2 size={16} className="text-secondary" />
          </div>
          <div className="mt-6 space-y-4">
             {contacts.length === 0 ? (
               <EmptyState title="No critical contacts configured" description="La red de soporte no llegó desde backend, pero el módulo sigue operativo." />
             ) : contacts.slice(0, 3).map((contact, index) => (
               <div key={`${contact.contact_name}-${index}`} className="flex items-center justify-between rounded-[1.2rem] bg-surface-container-low/80 px-4 py-4">
                <div>
                  <p className="font-semibold text-on-surface">{contact.contact_name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant">{contact.relationship}</p>
                </div>
                <Radio size={16} className="text-secondary" />
              </div>
             ))}
           </div>
         </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="editorial-card-tonal rounded-[2rem] p-6 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Critical contacts</p>
              <h2 className="mt-2 font-headline text-3xl font-black uppercase tracking-tight text-on-surface">Safety network</h2>
            </div>
            <ShieldAlert size={18} className="text-primary" />
          </div>

          <div className="mt-6 space-y-4">
             {contacts.length === 0 ? (
               <EmptyState title="No contacts available" description="Recarga la página o revisa la integración del dashboard de safety." />
             ) : contacts.map((contact, index) => (
               <div key={`${contact.contact_name}-${index}`} className="rounded-[1.35rem] bg-surface-container-low/75 px-5 py-5">
                <p className="font-semibold text-on-surface">{contact.contact_name}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{contact.relationship}</p>
                <p className="mt-3 font-label text-[10px] uppercase tracking-[0.18em] text-primary">{contact.contact_phone}</p>
              </div>
             ))}
           </div>
         </div>

        <div className="editorial-card-tonal rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-kicker">Pre-ex checklists</p>
              <h2 className="mt-2 font-headline text-3xl font-black uppercase tracking-tight text-on-surface">Field readiness</h2>
            </div>
             <span className="premium-chip">{dashboard.checklist.permits_count} permits live</span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-[1.5rem] bg-surface-container-low/80 p-5 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="section-kicker">Gear & equipment</span>
                 <span className="text-sm text-on-surface">{gearProgress}/{Number(dashboard.checklist.gear_target) || 0}</span>
              </div>
              <div className="premium-progress-track mt-3"><div className="premium-progress-fill-secondary" style={{ width: `${gearPercent}%` }} /></div>
               <p className="mt-3 text-sm text-on-surface-variant">{gearPercent}% del equipo esencial confirmado antes de salir.</p>
            </div>

            <div className="rounded-[1.5rem] bg-surface-container-low/80 p-5">
              <p className="section-kicker">Route planning</p>
               <p className={`mt-3 font-headline text-3xl font-black uppercase ${dashboard.checklist.route_status === 'completed' ? 'text-secondary' : 'text-primary'}`}>{dashboard.checklist.route_status}</p>
            </div>
            <div className="rounded-[1.5rem] bg-surface-container-low/80 p-5">
              <p className="section-kicker">Health & fitness</p>
               <p className={`mt-3 font-headline text-3xl font-black uppercase ${dashboard.checklist.health_status === 'completed' ? 'text-secondary' : 'text-primary'}`}>{dashboard.checklist.health_status}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <CTAButton label="Mark route ready" variant="secondary" onClick={() => updateChecklist.mutate({ route_status: 'completed' }, { onSuccess: () => toast.success('Route ready') })} />
            <CTAButton label="Mark health ready" variant="secondary" onClick={() => updateChecklist.mutate({ health_status: 'completed' }, { onSuccess: () => toast.success('Health ready') })} />
          </div>
        </div>
      </section>

      {dashboard.active_trip && (
        <section className="editorial-card-tonal rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="section-kicker">Active trip</p>
              <h2 className="mt-2 font-headline text-3xl font-black uppercase tracking-tight text-on-surface">{dashboard.active_trip.origin_name} → {dashboard.active_trip.destination_name}</h2>
            </div>
            <div className="premium-chip">Trip #{dashboard.active_trip.id}</div>
          </div>
        </section>
      )}

      <section className="editorial-card-tonal rounded-[2rem] p-6 md:p-7">
        <div className="flex items-center gap-2 text-primary">
          <AlertTriangle size={16} />
          <p className="section-kicker text-primary">Real-time safety log</p>
        </div>
        <div className="mt-6 space-y-4">
           {logs.length === 0 ? (
             <EmptyState title="No safety events yet" description="El log está vacío o incompleto, pero las acciones principales siguen disponibles." />
           ) : logs.map((log) => (
             <div key={log.id} className={`rounded-[1.35rem] border px-5 py-5 ${severityTone[log.severity]}`}>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="font-label text-[10px] uppercase tracking-[0.18em]">{log.severity}</p>
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{new Date(log.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-on-surface">{log.message}</p>
            </div>
           ))}
        </div>
      </section>
    </div>
  );
}
