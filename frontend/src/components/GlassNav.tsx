import { motion } from 'framer-motion';
import { Home, Compass, Plus, Mountain, User, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface GlassNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationCount?: number;
}

interface Tab {
  key: string;
  label: string;
  icon: LucideIcon;
}

const tabs: Tab[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'explore', label: 'Explorar', icon: Compass },
  { key: 'create', label: 'Crear', icon: Plus },
  { key: 'trips', label: 'Trips', icon: Mountain },
  { key: 'profile', label: 'Perfil', icon: User },
];

export default function GlassNav({
  activeTab,
  onTabChange,
  notificationCount = 0,
}: GlassNavProps) {
  return (
    <>
      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-[env(safe-area-inset-bottom,8px)] pt-2 z-50"
        style={{
          background: 'rgba(12, 15, 10, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(81, 69, 51, 0.15)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;

          if (tab.key === 'create') {
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className="relative flex items-center justify-center -mt-5 cursor-pointer"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #ffc56c, #f0a500)',
                    boxShadow: '0 4px 20px rgba(240, 165, 0, 0.3)',
                  }}
                >
                  <Plus size={22} className="text-on-primary" strokeWidth={2.5} />
                </div>
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`relative flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all duration-200 ease-out cursor-pointer ${
                isActive
                  ? 'text-primary'
                  : 'text-on-surface/40 hover:text-on-surface/60'
              }`}
            >
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -2 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Icon
                  size={20}
                  fill={isActive ? 'currentColor' : 'none'}
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </motion.div>

              {/* notification badge */}
              {tab.key === 'home' && notificationCount > 0 && (
                <span className="absolute -top-0.5 right-2 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-error text-[9px] font-bold text-on-error leading-none">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}

              <span className={`font-label text-[9px] uppercase tracking-wider mt-0.5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Desktop side nav - minimal */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 flex-col items-center py-6 z-50 border-r border-outline-variant/10"
        style={{
          background: 'rgba(12, 15, 10, 0.90)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Logo */}
        <div className="mb-8">
          <Mountain size={22} className="text-primary" />
        </div>

        <div className="flex-1 flex flex-col items-center gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;

            if (tab.key === 'create') {
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className="my-2 w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #ffc56c, #f0a500)',
                  }}
                >
                  <Plus size={18} className="text-on-primary" strokeWidth={2.5} />
                </button>
              );
            }

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-surface-container-high text-primary'
                    : 'text-on-surface/40 hover:bg-surface-container/50 hover:text-on-surface/60'
                }`}
                title={tab.label}
              >
                <Icon size={18} fill={isActive ? 'currentColor' : 'none'} strokeWidth={isActive ? 2 : 1.5} />

                {tab.key === 'home' && notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-error text-[8px] font-bold text-on-error leading-none">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications at bottom */}
        <button
          type="button"
          onClick={() => onTabChange('notifications')}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center text-on-surface/40 hover:bg-surface-container/50 hover:text-on-surface/60 transition-all cursor-pointer"
          title="Notificaciones"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-error" />
          )}
        </button>
      </nav>
    </>
  );
}
