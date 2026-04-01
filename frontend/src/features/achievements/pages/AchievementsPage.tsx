import { Compass, Leaf, Moon, ShieldCheck, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CTAButton from '@/components/CTAButton';
import EmptyState from '@/components/EmptyState';
import EcosystemNav from '@/components/EcosystemNav';
import { mockRankDashboard } from '@/data/ecosystem';
import { useRankDashboard } from '@/services/hooks';

const badgeIconMap = {
  award: Trophy,
  compass: Compass,
  shield: ShieldCheck,
  users: Users,
  moon: Moon,
  leaf: Leaf,
} as const;

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useRankDashboard();

  if (isLoading && !data) {
    return (
      <div className="premium-page">
        <EcosystemNav />
        <section className="editorial-card-tonal rounded-[2rem] p-6 md:p-8">
          <p className="section-kicker">Loading rank data</p>
          <h1 className="mt-2 font-headline text-4xl font-black uppercase tracking-tight text-on-surface">Preparing your trophy room…</h1>
        </section>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="premium-page">
        <EcosystemNav />
        <EmptyState
          title="No pudimos cargar tus logros"
          description="Reintenta para recuperar rango, badges y desafíos activos."
          action={{ label: 'Retry', onClick: () => void refetch() }}
        />
      </div>
    );
  }

  const dashboard = {
    ...mockRankDashboard,
    ...data,
    badges: Array.isArray(data.badges) ? data.badges : [],
    challenges: Array.isArray(data.challenges) ? data.challenges : [],
  };
  const badges = dashboard.badges;
  const challenges = dashboard.challenges;
  const xpGoal = Math.max(1, Number(dashboard.next_level_xp) || 0);
  const xpCurrent = Math.max(0, Number(dashboard.current_xp) || 0);
  const progress = Math.min(100, Math.round((xpCurrent / xpGoal) * 100));
  const unlockedBadges = badges.filter((badge) => !badge.is_locked).length;

  return (
    <div className="premium-page">
      <EcosystemNav />

      <section className="premium-hero overflow-hidden p-6 md:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 text-sm text-on-surface-variant">
              <span className="premium-chip">Current expedition rank</span>
               <span className="premium-chip">Level {dashboard.level}</span>
             </div>
             <h1 className="hero-title text-5xl text-on-surface md:text-7xl">{dashboard.title}</h1>
            <p className="max-w-2xl text-base text-on-surface-variant md:text-lg">La página ahora funciona como una sala de trofeos seria: mejor progresión visual, stats más memorables y badges con presencia de colección.</p>
            <div className="max-w-xl rounded-[1.6rem] bg-surface-container-low/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="section-kicker">XP progression</span>
               <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface">{xpCurrent} / {Number(dashboard.next_level_xp) || 0} XP</span>
              </div>
              <div className="premium-progress-track mt-3"><div className="premium-progress-fill" style={{ width: `${progress}%` }} /></div>
              <p className="mt-3 text-sm text-on-surface-variant">{progress}% hacia el próximo desbloqueo premium.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="editorial-card-tonal rounded-[1.8rem] p-6">
              <p className="section-kicker">Next unlock</p>
               <p className="mt-3 font-headline text-3xl font-black text-on-surface">{dashboard.next_unlock}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="editorial-metric rounded-[1.5rem] px-4 py-5">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Badges</p>
                <p className="mt-2 font-headline text-3xl font-black text-primary">{unlockedBadges}</p>
              </div>
              <div className="editorial-metric rounded-[1.5rem] px-4 py-5">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Challenges</p>
                 <p className="mt-2 font-headline text-3xl font-black text-secondary">{challenges.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="editorial-card-tonal rounded-[1.8rem] px-6 py-6">
          <p className="section-kicker">Total distance</p>
           <p className="mt-3 font-headline text-5xl font-black text-on-surface">{dashboard.total_distance_km}<span className="ml-2 text-2xl text-primary">km</span></p>
          <p className="mt-3 text-sm text-on-surface-variant">Se amplió la lectura de métricas principales para que se sientan como hitos, no solo números.</p>
        </div>
        <div className="editorial-card-tonal rounded-[1.8rem] px-6 py-6">
          <p className="section-kicker">Peak elevation</p>
           <p className="mt-3 font-headline text-5xl font-black text-on-surface">{dashboard.peak_elevation_m}<span className="ml-2 text-2xl text-primary">m</span></p>
          <p className="mt-3 text-sm text-on-surface-variant">Más énfasis tipográfico y menos borde duro para una sensación de perfil élite.</p>
        </div>
        <div className="editorial-card-tonal rounded-[1.8rem] px-6 py-6">
          <p className="section-kicker">Group saves</p>
           <p className="mt-3 font-headline text-5xl font-black text-on-surface">{dashboard.group_saves}<span className="ml-2 text-2xl text-secondary">verified</span></p>
          <p className="mt-3 text-sm text-on-surface-variant">La métrica de impacto social ahora gana peso visual junto al resto del progreso.</p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="section-kicker">Collection</p>
              <h2 className="mt-2 font-headline text-3xl font-black uppercase tracking-tight text-on-surface">Earned badges</h2>
            </div>
             <div className="premium-chip">{unlockedBadges}/{badges.length} unlocked</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
             {badges.length === 0 ? (
               <EmptyState title="No badges yet" description="Tus insignias volverán a aparecer cuando el backend entregue una colección válida." />
             ) : (
               badges.map((badge) => {
                 const Icon = badgeIconMap[badge.icon as keyof typeof badgeIconMap] ?? Trophy;
                 return (
                  <article key={badge.id} className={`rounded-[1.7rem] px-6 py-7 text-center transition ${badge.is_locked ? 'bg-surface-container/45 opacity-55' : 'editorial-card-tonal hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]'}`}>
                    <div className={`mx-auto mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full ${badge.is_locked ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary/12 text-primary'}`}>
                      <Icon size={28} />
                    </div>
                    <h3 className="font-headline text-2xl font-black text-on-surface">{badge.name}</h3>
                    <p className="mt-2 text-sm text-on-surface-variant">{badge.description}</p>
                    <p className="mt-4 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{badge.is_locked ? 'Locked' : 'Unlocked'}</p>
                  </article>
                );
               })
             )}
           </div>
         </div>

         <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
           <div className="editorial-card-tonal rounded-[2rem] px-6 py-6 md:px-8 md:py-8">
             <h2 className="font-headline text-3xl font-black uppercase tracking-tight text-on-surface">Active challenges</h2>
             <div className="mt-6 space-y-6">
               {challenges.length === 0 ? (
                 <EmptyState title="No active challenges" description="Cuando el servicio recupere desafíos, volverán a mostrarse aquí sin bloquear el CTA principal." />
               ) : challenges.map((challenge) => (
                 <div key={challenge.id} className="rounded-[1.5rem] bg-surface-container-low/80 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-on-surface">{challenge.title}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{challenge.description}</p>
                    </div>
                    <span className="premium-chip text-primary">{challenge.reward_label}</span>
                  </div>
                  <div className="mt-4 premium-progress-track"><div className="premium-progress-fill-secondary" style={{ width: `${challenge.percent}%` }} /></div>
                  <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                    <span>{challenge.progress}/{challenge.target}</span>
                    <span>{challenge.percent}%</span>
                  </div>
                </div>
               ))}
             </div>
            <div className="mt-8"><CTAButton label="Explore marketplace" onClick={() => navigate('/marketplace')} fullWidth /></div>
          </div>
        </aside>
      </section>
    </div>
  );
}
