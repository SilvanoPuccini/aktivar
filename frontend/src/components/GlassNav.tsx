import { motion } from 'framer-motion';
import { Home, Compass, Plus, Car, User } from 'lucide-react';
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
  { key: 'create', label: 'Crear', icon: Plus },
  { key: 'trips', label: 'Viajes', icon: Car },
  { key: 'profile', label: 'Perfil', icon: User },
];

export default function GlassNav({
  activeTab,
  onTabChange,
  notificationCount = 0,
}: GlassNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around px-2"
      style={{
        background: 'rgba(17,20,15,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(81,69,51,0.3)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const isCreate = tab.key === 'create';
        const Icon = tab.icon;

        if (isCreate) {
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className="flex flex-col items-center gap-0.5 pt-2 pb-1 cursor-pointer"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="flex items-center justify-center w-12 h-8 rounded-full -mt-2"
                style={{
                  background: 'linear-gradient(135deg, #ffc56c, #f0a500)',
                  boxShadow: '0 4px 16px rgba(240,165,0,0.35)',
                }}
              >
                <Plus size={20} className="text-[#442c00]" />
              </motion.div>
              <span className="font-[Space_Grotesk] text-xs text-primary">
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className="relative flex flex-col items-center gap-0.5 pt-2 pb-1 px-3 cursor-pointer"
          >
            <motion.div
              animate={{ scale: isActive ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Icon
                size={22}
                className={isActive ? 'text-primary' : 'text-muted'}
              />
            </motion.div>

            {/* notification badge on explore */}
            {tab.key === 'explore' && notificationCount > 0 && (
              <span className="absolute top-1.5 right-2 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-error text-[10px] font-bold text-[#442c00] leading-none">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}

            <span
              className={`font-[Space_Grotesk] text-xs ${
                isActive ? 'text-primary' : 'text-muted'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
