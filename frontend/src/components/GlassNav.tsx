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
      {/* ============ Mobile bottom nav ============ */}
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

              {tab.key === 'home' && notificationCount > 0 && (
                <span className="absolute -top-0.5 right-2 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-error text-[9px] font-bold text-on-error leading-none">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}

              <span className={`font-label text-[9px] uppercase tracking-wider mt-0.5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>

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

      {/* ============ Desktop top header ============ */}
      <header
        className="hidden md:block fixed top-0 left-0 right-0 z-50 border-b border-outline-variant/15"
        style={{
          background: 'rgba(12, 15, 10, 0.92)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
        }}
      >
        <nav className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center border border-primary/15 group-hover:border-primary/30 transition-colors">
              <Mountain size={16} className="text-primary" />
            </div>
            <span className="text-on-surface font-headline font-black text-lg tracking-tight">
              Aktivar
            </span>
          </button>

          {/* Center tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;

              if (tab.key === 'create') {
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange(tab.key)}
                    className="mx-2 px-5 py-2 rounded-full flex items-center gap-2 cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/20"
                    style={{
                      background: 'linear-gradient(135deg, #ffc56c, #f0a500)',
                    }}
                  >
                    <Plus size={16} className="text-on-primary" strokeWidth={2.5} />
                    <span className="text-on-primary text-sm font-headline font-bold">{tab.label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'text-primary bg-primary/8'
                      : 'text-on-surface/50 hover:text-on-surface/80 hover:bg-surface-container/40'
                  }`}
                >
                  <Icon size={18} fill={isActive ? 'currentColor' : 'none'} strokeWidth={isActive ? 2 : 1.5} />
                  <span className={`text-sm font-medium ${isActive ? 'text-primary font-semibold' : ''}`}>{tab.label}</span>

                  {tab.key === 'home' && notificationCount > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-error text-[9px] font-bold text-on-error leading-none">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}

                  {isActive && (
                    <motion.div
                      layoutId="desktopNavIndicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTabChange('notifications')}
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-on-surface/50 hover:bg-surface-container/50 hover:text-on-surface/80 transition-all cursor-pointer"
              title="Notificaciones"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-error border-2 border-surface-lowest" />
              )}
            </button>
          </div>
        </nav>
      </header>
    </>
  );
}
