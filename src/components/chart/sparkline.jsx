'use client';

import { ChartRoot } from './chart-root';
import { areaPath, linePath } from './chart-utils';
import { useElementWidth } from './use-element-width';

// ----------------------------------------------------------------------

/** A word-sized trend: a 2px line, a faint wash and a dot on the latest value. No axes: the stat beside it has the number. */
export function Sparkline({ values, color = 'var(--chart-1)', height = 36, area = true, sx }) {
  const [ref, width] = useElementWidth(96);

  if (!values || values.length < 2) return <ChartRoot ref={ref} sx={{ height }} />;

  const pad = 5; // room for the end dot
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low || 1;

  const points = values.map((value, index) => [
    pad + (index / (values.length - 1)) * (width - pad * 2),
    pad + (1 - (value - low) / span) * (height - pad * 2),
  ]);
  const [lastX, lastY] = points[points.length - 1];
  const baseline = points.map(([x]) => [x, height - pad]);

  return (
    <ChartRoot ref={ref} sx={sx} aria-hidden>
      <svg width={width} height={height}>
        {area && <path d={areaPath(points, baseline)} fill={color} fillOpacity={0.1} />}
        <path
          d={linePath(points)}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={lastX}
          cy={lastY}
          r={4}
          fill={color}
          stroke="var(--chart-surface)"
          strokeWidth={2}
        />
      </svg>
    </ChartRoot>
  );
}
