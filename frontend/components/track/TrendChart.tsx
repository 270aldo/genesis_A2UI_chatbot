import React, { useState, useRef, useMemo, useCallback, useId } from 'react';
import { SectionCard } from '../shared/SectionCard';

// --- Constants ---

const TRACK_ACCENT = '#3B82F6';

const CHART_PADDING = { top: 16, right: 12, bottom: 28, left: 36 };

const METRIC_TABS = [
  { key: 'fuerza', label: 'Fuerza' },
  { key: 'peso', label: 'Peso' },
  { key: 'adherencia', label: 'Adherencia' },
  { key: 'sueno', label: 'Sueno' },
] as const;

type MetricKey = (typeof METRIC_TABS)[number]['key'];

// --- Types ---

interface DataPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  activeMetric?: MetricKey;
  onMetricChange?: (metric: MetricKey) => void;
}

// --- Main Component ---

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  color = TRACK_ACCENT,
  height = 160,
  activeMetric = 'fuerza',
  onMetricChange,
}) => {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    value: number;
    label: string;
  } | null>(null);

  // Compute chart geometry
  const chartMetrics = useMemo(() => {
    if (data.length === 0) return null;

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return { min, max, range };
  }, [data]);

  // Build SVG points from data
  const buildPoints = useCallback(
    (containerWidth: number) => {
      if (!chartMetrics || data.length === 0) return { polyline: '', areaPath: '', coords: [] };

      const drawW = containerWidth - CHART_PADDING.left - CHART_PADDING.right;
      const drawH = height - CHART_PADDING.top - CHART_PADDING.bottom;

      const coords = data.map((d, i) => {
        const x =
          CHART_PADDING.left +
          (data.length > 1 ? (i / (data.length - 1)) * drawW : drawW / 2);
        const y =
          CHART_PADDING.top +
          drawH -
          ((d.value - chartMetrics.min) / chartMetrics.range) * drawH;
        return { x, y, value: d.value, label: d.label };
      });

      const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');

      // Closed area path for gradient fill
      const firstX = coords[0]?.x ?? 0;
      const lastX = coords[coords.length - 1]?.x ?? 0;
      const bottomY = CHART_PADDING.top + drawH;

      const areaPath = [
        `M ${firstX},${bottomY}`,
        ...coords.map((c) => `L ${c.x},${c.y}`),
        `L ${lastX},${bottomY}`,
        'Z',
      ].join(' ');

      return { polyline, areaPath, coords };
    },
    [data, chartMetrics, height],
  );

  // Use a default width for SSR / initial render, then measure via ref
  const [containerWidth, setContainerWidth] = useState(320);

  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const w = node.getBoundingClientRect().width;
      if (w > 0) setContainerWidth(w);

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newW = entry.contentRect.width;
          if (newW > 0) setContainerWidth(newW);
        }
      });
      observer.observe(node);
      return () => observer.disconnect();
    }
  }, []);

  const { polyline, areaPath, coords } = buildPoints(containerWidth);

  const handleDotInteraction = (
    coord: { x: number; y: number; value: number; label: string },
  ) => {
    setTooltip(
      tooltip?.label === coord.label
        ? null
        : { x: coord.x, y: coord.y, value: coord.value, label: coord.label },
    );
  };

  return (
    <SectionCard title="Tendencias" accentColor={TRACK_ACCENT}>
      {/* Metric toggle pills */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
        {METRIC_TABS.map((tab) => {
          const isActive = activeMetric === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onMetricChange?.(tab.key)}
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg whitespace-nowrap transition-all"
              style={{
                color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                background: isActive ? `${color}25` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? `${color}40` : 'rgba(255,255,255,0.06)'}`,
              }}
              aria-pressed={isActive}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Chart area */}
      <div ref={measureRef} className="relative w-full" style={{ height }}>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-[11px] text-white/20">Sin datos</span>
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={containerWidth}
            height={height}
            viewBox={`0 0 ${containerWidth} ${height}`}
            className="overflow-visible"
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Y-axis labels */}
            {chartMetrics && (
              <>
                <text
                  x={CHART_PADDING.left - 8}
                  y={CHART_PADDING.top + 4}
                  textAnchor="end"
                  className="fill-white/25 text-[9px]"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {chartMetrics.max}
                </text>
                <text
                  x={CHART_PADDING.left - 8}
                  y={height - CHART_PADDING.bottom + 4}
                  textAnchor="end"
                  className="fill-white/25 text-[9px]"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {chartMetrics.min}
                </text>
              </>
            )}

            {/* Filled area */}
            <path d={areaPath} fill={`url(#${gradientId})`} />

            {/* Line */}
            <polyline
              points={polyline}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data point dots */}
            {coords.map((coord, i) => (
              <g key={i}>
                {/* Larger invisible hit area for touch */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={12}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => handleDotInteraction(coord)}
                  onMouseEnter={() =>
                    setTooltip({ x: coord.x, y: coord.y, value: coord.value, label: coord.label })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
                {/* Visible dot */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={3.5}
                  fill={color}
                  stroke="#050505"
                  strokeWidth={2}
                />
              </g>
            ))}

            {/* X-axis labels */}
            {coords.map((coord, i) => (
              <text
                key={`label-${i}`}
                x={coord.x}
                y={height - 6}
                textAnchor="middle"
                className="fill-white/25 text-[9px]"
              >
                {data[i].label}
              </text>
            ))}

            {/* Tooltip */}
            {tooltip && (
              <g>
                <rect
                  x={tooltip.x - 22}
                  y={tooltip.y - 28}
                  width={44}
                  height={20}
                  rx={6}
                  fill="rgba(0,0,0,0.85)"
                  stroke={color}
                  strokeWidth={1}
                />
                <text
                  x={tooltip.x}
                  y={tooltip.y - 15}
                  textAnchor="middle"
                  className="fill-white text-[10px] font-bold"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {tooltip.value}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>
    </SectionCard>
  );
};
