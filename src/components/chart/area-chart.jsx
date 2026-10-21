'use client';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';

import { fCompact } from 'src/utils/admin-format';

import { ChartRoot } from './chart-root';
import { ChartLegend } from './chart-legend';
import { ChartTooltip } from './chart-tooltip';
import { useElementWidth } from './use-element-width';
import { clamp, areaPath, linePath, niceTicks, seriesColor, labelIndexes } from './chart-utils';

// ----------------------------------------------------------------------

const MARGIN = { top: 12, right: 12, bottom: 26, left: 44 };

/**
 * Line / area chart over a shared x axis, with a crosshair that snaps to the nearest x and one tooltip for every
 * series. 2px lines, a 10% wash under them, hairline recessive grid. Hover, touch and arrow keys all work.
 *
 * @param {Array<{ key: string, label: string, title?: string }>} categories one entry per x position
 * @param {Array<{ key: string, label: string, values: number[], color?: number }>} series
 */
export function AreaChart({
  categories,
  series,
  height = 240,
  stacked = false,
  area = true,
  format = fCompact,
  axisFormat = fCompact,
  ariaLabel,
  sx,
}) {
  const [ref, width] = useElementWidth();
  const [active, setActive] = useState(null);

  const count = categories.length;
  const plotWidth = Math.max(10, width - MARGIN.left - MARGIN.right);
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const layout = useMemo(() => {
    // Cumulative baselines for stacks.
    const lower = series.map(() => new Array(count).fill(0));
    const upper = series.map(() => new Array(count).fill(0));
    let max = 0;

    for (let i = 0; i < count; i += 1) {
      let running = 0;
      series.forEach((item, s) => {
        const value = Number(item.values[i]) || 0;
        lower[s][i] = stacked ? running : 0;
        upper[s][i] = stacked ? running + value : value;
        running += stacked ? value : 0;
        max = Math.max(max, upper[s][i]);
      });
    }

    const whole = series.every((item) => item.values.every((value) => Number.isInteger(value)));
    return { lower, upper, ...niceTicks(max, 4, whole) };
  }, [series, count, stacked]);

  const x = useCallback(
    (index) => MARGIN.left + (count <= 1 ? plotWidth / 2 : (index / (count - 1)) * plotWidth),
    [count, plotWidth]
  );
  const y = useCallback(
    (value) => MARGIN.top + plotHeight - (value / layout.max) * plotHeight,
    [plotHeight, layout.max]
  );

  const indexAt = useCallback(
    (clientX, bounds) => {
      if (count <= 1) return 0;
      const ratio = (clientX - bounds.left - MARGIN.left) / plotWidth;
      return clamp(Math.round(ratio * (count - 1)), 0, count - 1);
    },
    [count, plotWidth]
  );

  const handleMove = (event) =>
    setActive(indexAt(event.clientX, event.currentTarget.getBoundingClientRect()));

  const handleKey = (event) => {
    if (event.key === 'ArrowRight') setActive((prev) => clamp((prev ?? -1) + 1, 0, count - 1));
    else if (event.key === 'ArrowLeft')
      setActive((prev) => clamp((prev ?? count) - 1, 0, count - 1));
    else if (event.key === 'Escape') setActive(null);
    else return;
    event.preventDefault();
  };

  if (count === 0) return null;

  const labels = labelIndexes(count, plotWidth);
  const activeCategory = active !== null ? categories[active] : null;

  const tooltipRows =
    active === null
      ? []
      : series.map((item, s) => ({
          key: item.key,
          label: item.label,
          value: format(Number(item.values[active]) || 0),
          color: seriesColor(item.color ?? s),
        }));

  return (
    <ChartRoot ref={ref} sx={sx}>
      <svg
        width={width}
        height={height}
        role="img"
        tabIndex={0}
        aria-label={ariaLabel ?? series.map((item) => item.label).join(', ')}
        onKeyDown={handleKey}
        onBlur={() => setActive(null)}
        style={{ outline: 'none', touchAction: 'pan-y' }}
      >
        {/* Gridlines and y labels */}
        {layout.ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke={tick === 0 ? 'var(--chart-axis)' : 'var(--chart-grid)'}
              strokeWidth={1}
            />
            <text
              className="chart-tick"
              x={MARGIN.left - 8}
              y={y(tick)}
              textAnchor="end"
              dy="0.32em"
            >
              {axisFormat(tick)}
            </text>
          </g>
        ))}

        {/* X labels */}
        {labels.map((index) => (
          <text
            key={categories[index].key}
            className="chart-tick"
            x={x(index)}
            y={height - 6}
            textAnchor={index === 0 ? 'start' : index === count - 1 ? 'end' : 'middle'}
          >
            {categories[index].label}
          </text>
        ))}

        {/* Series */}
        {series.map((item, s) => {
          const color = seriesColor(item.color ?? s);
          const top = item.values.map((_, i) => [x(i), y(layout.upper[s][i])]);
          const bottom = item.values.map((_, i) => [x(i), y(layout.lower[s][i])]);

          return (
            <g key={item.key}>
              {area && count > 1 && (
                <path d={areaPath(top, bottom)} fill={color} fillOpacity={stacked ? 0.55 : 0.1} />
              )}
              {count > 1 ? (
                <path
                  d={linePath(top)}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : (
                <circle cx={top[0][0]} cy={top[0][1]} r={4} fill={color} />
              )}
            </g>
          );
        })}

        {/* Crosshair, snapped to a category */}
        {active !== null && (
          <g pointerEvents="none">
            <line
              x1={x(active)}
              x2={x(active)}
              y1={MARGIN.top}
              y2={MARGIN.top + plotHeight}
              stroke="var(--chart-axis)"
              strokeWidth={1}
            />
            {series.map((item, s) => (
              <circle
                key={item.key}
                cx={x(active)}
                cy={y(layout.upper[s][active])}
                r={4}
                fill={seriesColor(item.color ?? s)}
                stroke="var(--chart-surface)"
                strokeWidth={2}
              />
            ))}
          </g>
        )}

        {/* Hit layer, bigger than any mark */}
        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={plotWidth}
          height={plotHeight}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerDown={handleMove}
          onPointerLeave={() => setActive(null)}
        />
      </svg>

      <ChartTooltip
        open={active !== null}
        x={active !== null ? x(active) : 0}
        width={width}
        title={activeCategory?.title ?? activeCategory?.label}
        rows={tooltipRows}
      />

      {series.length > 1 && (
        <Box sx={{ pt: 1.5, pl: `${MARGIN.left}px` }}>
          <ChartLegend
            shape={area && stacked ? 'bar' : 'line'}
            items={series.map((item, s) => ({
              key: item.key,
              label: item.label,
              color: seriesColor(item.color ?? s),
            }))}
          />
        </Box>
      )}
    </ChartRoot>
  );
}
