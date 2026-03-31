import { motion } from 'framer-motion';
import { Home, Compass, Plus, User, Bell } from 'lucide-react';
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
  { key: 'home', label: 'Inicio', icon: Home },
  { key: 'explore', label: 'Explorar', icon: Compass },
  { key: 'profile', label: 'Perfil', icon: User },
];

export default function GlassNav({
  activeTab,
  onTabChange,
  notificationCount = 0,
}: GlassNavProps) {
  return (
    <>
      {/* ===== Mobile bottom nav ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/15 bg-surface-lowest/95 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16 px-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                aria-label={`Ir a ${tab.label}`}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 px-4 py-2 cursor-pointer transition-colors ${
                  isActive ? 'text-primary' : 'text-muted'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
                <span className="font-label text-[10px] tracking-wider">{tab.label}</span>
              </button>
            );
          })}
          {/* Create button in mobile nav */}
          <button
            type="button"
            onClick={() => onTabChange('create')}
            aria-label="Crear actividad"
            className="flex flex-col items-center gap-1 px-4 py-2 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center gradient-cta">
              <Plus size={18} className="text-on-primary" strokeWidth={2.5} />
            </div>
          </button>
        </div>
      </nav>

      {/* ===== Desktop top nav ===== */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 h-16 bg-surface-lowest/95 backdrop-blur-xl border-b border-outline-variant/15">
        <div className="premium-shell h-full flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onTabChange('home')}
            className="font-headline text-xl font-black tracking-tight text-on-surface cursor-pointer"
          >
            AKT<span className="text-primary">IVAR</span>
          </button>

          {/* Center links */}
          <div className="flex items-center gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'text-primary bg-surface-container'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="navUnderline"
                      className="absolute -bottom-[13px] left-4 right-4 h-[2px] bg-primary rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              type="button"
              onClick={() => onTabChange('notifications')}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 transition-colors cursor-pointer"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error" />
              )}
            </button>

            {/* Create CTA */}
            <button
              type="button"
              onClick={() => onTabChange('create')}
              className="flex items-center gap-2 px-5 py-2 rounded-lg gradient-cta text-on-primary font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Plus size={16} strokeWidth={2.5} />
              Crear
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
