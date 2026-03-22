import { motion } from 'framer-motion';
import { Home, Compass, Plus, Mountain, User } from 'lucide-react';
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
  { key: 'explore', label: 'Explore', icon: Compass },
  { key: 'create', label: 'Create', icon: Plus },
  { key: 'trips', label: 'Trips', icon: Mountain },
  { key: 'profile', label: 'Profile', icon: User },
];

export default function GlassNav({
  activeTab,
  onTabChange,
  notificationCount = 0,
}: GlassNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-2 rounded-t-2xl z-50"
      style={{
        background: 'rgba(17,20,15,0.70)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.4)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`relative flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-all duration-300 ease-out cursor-pointer ${
              isActive
                ? 'text-[#F0A500] bg-[#1d201b]'
                : 'text-[#EDE9DF]/60 hover:bg-[#333630]'
            }`}
          >
            <motion.div
              animate={{ scale: isActive ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Icon
                size={22}
                fill={isActive ? 'currentColor' : 'none'}
                strokeWidth={isActive ? 2 : 1.5}
              />
            </motion.div>

            {/* notification badge */}
            {tab.key === 'explore' && notificationCount > 0 && (
              <span className="absolute top-0 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-error text-[10px] font-bold text-[#442c00] leading-none">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}

            <span className="font-label text-[10px] uppercase tracking-widest mt-0.5">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
