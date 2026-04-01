interface SpotsBarProps {
  capacity: number;
  taken: number;
  showLabel?: boolean;
}

export default function SpotsBar({ capacity, taken, showLabel = true }: SpotsBarProps) {
  const remaining = capacity - taken;
  const percentage = capacity > 0 ? (taken / capacity) * 100 : 100;
  const remainingPercent = capacity > 0 ? (remaining / capacity) * 100 : 0;
  const isFull = remaining <= 0;

  const barColor = isFull || remainingPercent < 5 ? '#ffb4ab' : remainingPercent <= 20 ? '#ffc56c' : '#7bda96';

  return (
    <div className="flex flex-col gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
        <div
          className="h-full rounded-full"
          data-testid="spots-bar-fill"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: barColor,
            transition: 'width 500ms ease-out, background-color 300ms ease',
          }}
        />
      </div>
      {showLabel && (
        <span className="font-label text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">
          {isFull ? 'Lista de espera' : `${taken}/${capacity} cupos`}
        </span>
      )}
    </div>
  );
}
