import { motion } from 'framer-motion';

export default function ActivityCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl bg-surface-container overflow-hidden"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
    >
      <div className="aspect-video skeleton" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-5 w-3/4 skeleton" />
        <div className="h-3 w-1/2 skeleton" />
        <div className="h-3 w-1/3 skeleton" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full skeleton" />
          <div className="h-3 w-24 skeleton" />
        </div>
        <div className="h-2 w-full skeleton rounded-full" />
      </div>
    </motion.div>
  );
}
