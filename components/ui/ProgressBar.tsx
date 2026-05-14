interface ProgressBarProps {
  value: number;   // 0–100
  color?: 'blue' | 'green' | 'yellow' | 'red';
  showLabel?: boolean;
  height?: 'sm' | 'md';
}

const colorClasses = {
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  yellow: 'bg-yellow-400',
  red:    'bg-red-400',
};

export default function ProgressBar({
  value,
  color = 'blue',
  showLabel = false,
  height = 'md',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const h = height === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-100 rounded-full ${h} overflow-hidden`}>
        <div
          className={`${colorClasses[color]} ${h} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-1 text-right">{clamped.toFixed(0)}%</p>
      )}
    </div>
  );
}
