import { Activity, ShieldCheck, ShoppingBag, Trophy, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const items = [
  { to: '/journal', label: 'Journal', icon: Activity },
  { to: '/communities', label: 'Communities', icon: Users },
  { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { to: '/safety', label: 'Safety', icon: ShieldCheck, requiresAuth: true },
  { to: '/achievements', label: 'Ranks', icon: Trophy, requiresAuth: true },
];

export default function EcosystemNav() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const visibleItems = items.filter((item) => !item.requiresAuth || isAuthenticated);

  return (
    <div className="premium-hero mb-6 overflow-hidden px-4 py-4 md:mb-8 md:px-5">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="section-kicker">Expanded ecosystem</p>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">Journal, comunidades, gear, safety y rank comparten ahora una shell tonal, CTAs más consistentes y una jerarquía editorial común.</p>
        </div>
        <div className="premium-chip w-fit">Design-first system</div>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={[
              'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 font-label text-[10px] uppercase tracking-[0.18em] transition',
              active ? 'border-primary/20 text-[#442c00] shadow-[var(--shadow-soft)]' : 'border-outline-variant/10 bg-surface-container-high/80 text-on-surface-variant hover:border-outline-variant/20 hover:text-on-surface',
            ].join(' ')}
            style={active ? { background: 'var(--cta-gradient)' } : undefined}
          >
            <Icon size={14} />
            {item.label}
          </Link>
        );
      })}
      </div>
    </div>
  );
}
