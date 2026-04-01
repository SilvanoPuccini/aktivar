import { motion } from 'framer-motion';
import { Bell, Compass, Home, Mountain, Plus, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface GlassNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAuthenticated?: boolean;
  notificationCount?: number;
}

interface Tab {
  key: string;
  label: string;
  icon: LucideIcon;
}

const tabs: Tab[] = [
  { key: 'home', label: 'Inicio', icon: Home },
  { key: 'explore', label: 'Explorar', icon: Compass },
  { key: 'profile', label: 'Perfil', icon: User },
];

export default function GlassNav({ activeTab, onTabChange, isAuthenticated = false, notificationCount = 0 }: GlassNavProps) {
  const visibleTabs = isAuthenticated ? tabs : tabs.filter((tab) => tab.key !== 'profile');

  return (
    <>
      <nav className="glass fixed left-0 right-0 top-0 z-50 hidden border-b border-outline-variant/10 shadow-[0_20px_40px_rgba(12,15,10,0.22)] md:block">
        <div className="premium-shell flex h-20 items-center justify-between">
          <button type="button" onClick={() => onTabChange('home')} className="flex cursor-pointer items-center gap-3 rounded-full pr-4 transition-transform hover:scale-[1.01]">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-[radial-gradient(circle_at_top,_rgba(255,197,108,0.18),_transparent_58%),rgba(40,43,37,0.95)] text-primary shadow-[var(--shadow-soft)]">
              <Mountain size={18} />
            </div>
            <div className="text-left">
              <div className="font-headline text-2xl font-black uppercase tracking-tight text-primary-container">Aktivar</div>
              <div className="font-label text-[10px] uppercase tracking-[0.24em] text-on-surface-variant">Premium outdoor operating system</div>
            </div>
          </button>

          <div className="rounded-full border border-outline-variant/10 bg-surface-container-low/70 p-1.5 backdrop-blur-xl">
            <div className="flex items-center gap-1.5">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className={[
                    'relative cursor-pointer rounded-full px-5 py-3 font-label text-xs uppercase tracking-[0.18em] transition-colors',
                    isActive ? 'text-[#442c00]' : 'text-on-surface-variant hover:text-on-surface',
                  ].join(' ')}
                  style={isActive ? { background: 'var(--cta-gradient)' } : undefined}
                >
                  {tab.label}
                  {isActive && <motion.div layoutId="nav-active" className="absolute inset-0 -z-10 rounded-full" />}
                </button>
              );
            })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onTabChange('notifications')}
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-high/90 text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <Bell size={18} />
              {notificationCount > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary" />}
            </button>
            <button
              type="button"
              onClick={() => onTabChange('create')}
              className="inline-flex h-12 items-center gap-2 rounded-full px-5 font-label text-xs font-bold uppercase tracking-[0.18em] text-[#442c00] cursor-pointer"
              style={{ background: 'var(--cta-gradient)', boxShadow: 'var(--shadow-soft)' }}
            >
              <Plus size={16} />
              Crear salida
            </button>
          </div>
        </div>
      </nav>

      <nav className="glass pb-safe fixed bottom-3 left-3 right-3 z-50 rounded-[1.8rem] border border-outline-variant/15 px-2 py-2 shadow-[var(--shadow-forest)] md:hidden">
        <div className="flex items-center justify-around">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className="flex min-w-16 flex-col items-center gap-1 px-3 py-2 text-[10px] font-label uppercase tracking-[0.14em]"
              >
                <span className={isActive ? 'text-primary' : 'text-on-surface-variant'}>
                  <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
                </span>
                <span className={isActive ? 'text-primary' : 'text-on-surface-variant'}>{tab.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onTabChange('create')}
            className="flex h-12 w-12 items-center justify-center rounded-full text-[#442c00] shadow-[var(--shadow-soft)]"
            style={{ background: 'var(--cta-gradient)' }}
          >
            <Plus size={20} />
          </button>
        </div>
      </nav>
    </>
  );
}
