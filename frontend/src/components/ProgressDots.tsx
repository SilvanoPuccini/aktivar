import { motion } from 'framer-motion';

interface ProgressDotsProps {
  steps: number;
  currentStep: number;
  labels?: string[];
}

export default function ProgressDots({
  steps,
  currentStep,
  labels,
}: ProgressDotsProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center">
        {Array.from({ length: steps }, (_, i) => {
          const stepIndex = i;
          const isCompleted = stepIndex < currentStep;
          const isActive = stepIndex === currentStep;

          return (
            <div key={stepIndex} className="flex items-center">
              {/* connecting line before dot (skip first) */}
              {stepIndex > 0 && (
                <div
                  className="h-0.5 w-8 transition-colors duration-300"
                  style={{
                    backgroundColor: isCompleted || isActive ? '#7bda96' : '#333630',
                  }}
                />
              )}

              {/* dot */}
              <motion.div
                animate={{
                  scale: isActive ? 1.3 : 1,
                  backgroundColor: isCompleted
                    ? '#7bda96'
                    : isActive
                      ? '#ffc56c'
                      : '#333630',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="w-3 h-3 rounded-full shrink-0"
              />
            </div>
          );
        })}
      </div>

      {/* optional labels */}
      {labels && labels.length > 0 && (
        <div className="flex items-start">
          {labels.map((label, i) => {
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;
            return (
              <div
                key={i}
                className="flex items-center"
              >
                {i > 0 && <div className="w-8 shrink-0" />}
                <span
                  className={`text-center text-xs font-[Space_Grotesk] min-w-3 ${
                    isActive
                      ? 'text-primary'
                      : isCompleted
                        ? 'text-secondary'
                        : 'text-muted'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
