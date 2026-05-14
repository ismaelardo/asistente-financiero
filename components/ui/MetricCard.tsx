import Card from './Card';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: 'blue' | 'green' | 'red' | 'gray';
}

const accentClasses: Record<NonNullable<MetricCardProps['accentColor']>, string> = {
  blue:  'text-blue-600',
  green: 'text-green-600',
  red:   'text-red-500',
  gray:  'text-gray-700',
};

export default function MetricCard({
  title,
  value,
  subtitle,
  accentColor = 'gray',
}: MetricCardProps) {
  return (
    <Card>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className={`text-2xl font-semibold mt-1 ${accentClasses[accentColor]}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </Card>
  );
}
