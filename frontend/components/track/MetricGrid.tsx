import React from 'react';
import { Dumbbell, Scale, Target, Moon, LucideIcon } from 'lucide-react';
import { MetricCard } from '../shared/MetricCard';

// --- Types ---

interface MetricItem {
  label: string;
  value: string | number;
  unit?: string;
  delta: number;
  color: string;
  icon: LucideIcon;
}

interface MetricGridProps {
  metrics?: MetricItem[];
}

// --- Default Metrics ---

const DEFAULT_METRICS: MetricItem[] = [
  {
    label: 'Fuerza',
    value: 82,
    unit: 'kg',
    delta: 5,
    color: '#EF4444',
    icon: Dumbbell,
  },
  {
    label: 'Composicion',
    value: 18.4,
    unit: '%bf',
    delta: -1.2,
    color: '#22C55E',
    icon: Scale,
  },
  {
    label: 'Adherencia',
    value: 94,
    unit: '%',
    delta: 8,
    color: '#3B82F6',
    icon: Target,
  },
  {
    label: 'Sueno',
    value: 7.6,
    unit: 'hrs',
    delta: 3,
    color: '#A855F7',
    icon: Moon,
  },
];

// --- Main Component ---

export const MetricGrid: React.FC<MetricGridProps> = ({
  metrics = DEFAULT_METRICS,
}) => {
  const displayMetrics = metrics.slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-3">
      {displayMetrics.map((metric) => {
        const IconComponent = metric.icon;
        return (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            delta={metric.delta}
            accentColor={metric.color}
            icon={<IconComponent size={14} />}
          />
        );
      })}
    </div>
  );
};
