'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';

import { fCompact } from 'src/utils/admin-format';

import { ChartRoot } from './chart-root';
import { ChartLegend } from './chart-legend';
import { ChartTooltip } from './chart-tooltip';
import { useElementWidth } from './use-element-width';
import { clamp, niceTicks, columnPath, seriesColor, labelIndexes } from './chart-utils';

// ----------------------------------------------------------------------

const MARGIN = { top: 12, right: 12, bottom: 26, left: 44 };
const MAX_BAR = 24; // thin marks: never fill the slot
const GAP = 2; // surface gap between touching fills
const RADIUS = 4; // rounded data end, square baseline

/**
 * Columns over a shared x axis, grouped or stacked. One tooltip per category lists every series; bars are at most
 * 24px thick with a 4px rounded top, and stacked segments are separated by a 2px gap rather than a border.
 *
 * @param {Array<{ key: string, label: string, title?: string }>} categories
 * @param {Array<{ key: string, label: string, values: number[], color?: number }>} series
 */
export function BarChart({
  categories,
  series,
  height = 240,
  stacked = false,
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
  const band = plotWidth / Math.max(count, 1);

  const { ticks, max } = useMemo(() => {
    let top = 0;
    for (let i = 0; i < count; i += 1) {
      const values = series.map((item) => Number(item.values[i]) || 0);
      top = Math.max(top, stacked ? values.reduce((a, b) => a + b, 0) : Math.max(...values, 0));
    }
    const whole = series.every((item) => item.values.every((value) => Number.isInteger(value)));
    return niceTicks(top, 4, whole);
  }, [series, count, stacked]);

  const y = (value) => MARGIN.top + plotHeight - (value / max) * plotHeight;

  const groupSize = stacked ? 1 : series.length;
  const barWidth = clamp(
    Math.min(MAX_BAR, (band * 0.7 - GAP * (groupSize - 1)) / groupSize),
    2,
    MAX_BAR
  );
  const groupWidth = barWidth * groupSize + GAP * (groupSize - 1);

  const handleKey = (event) => {
    if (event.key === 'ArrowRight') setActive((prev) => clamp((prev ?? -1) + 1, 0, count - 1));
    else if (event.key === 'ArrowLeft')
      setActive((prev) => clamp((prev ?? count) - 1, 0, count - 1));
    else if (event.key === 'Escape') setActive(null);
    else return;
    event.preventDefault();
  };

  if (count === 0) return null;

  const labels = labelIndexes(count, plotWidth, 56);
  const centre = (index) => MARGIN.left + band * (index + 0.5);
  const activeCategory = active !== null ? categories[active] : null;

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
        {ticks.map((tick) => (
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

        {labels.map((index) => (
          <text
            key={categories[index].key}
            className="chart-tick"
            x={centre(index)}
            y={height - 6}
            textAnchor="middle"
          >
            {categories[index].label}
          </text>
        ))}

        {active !== null && (
          <rect
            x={MARGIN.left + band * active}
            y={MARGIN.top}
            width={band}
            height={plotHeight}
            fill="var(--chart-grid)"
            fillOpacity={0.5}
            rx={4}
            pointerEvents="none"
          />
        )}

        {categories.map((category, i) => {
          const values = series.map((item) => Number(item.values[i]) || 0);
          const left = centre(i) - groupWidth / 2;

          if (stacked) {
            let running = 0;
            const visible = values
              .map((value, s) => ({ value, s }))
              .filter(({ value }) => value > 0);

            return (
              <g key={category.key}>
                {visible.map(({ value, s }, position) => {
                  const bottom = y(running);
                  const top = y(running + value);
                  running += value;
                  const isTop = position === visible.length - 1;
                  const segment = bottom - top - (position === 0 ? 0 : GAP);

                  return (
                    <path
                      key={series[s].key}
                      d={columnPath(left, top, barWidth, segment, RADIUS, isTop)}
                      fill={seriesColor(series[s].color ?? s)}
                      opacity={active === null || active === i ? 1 : 0.55}
                    />
                  );
                })}
              </g>
            );
          }

          return (
            <g key={category.key}>
              {values.map((value, s) => (
                <path
                  key={series[s].key}
                  d={columnPath(
                    left + s * (barWidth + GAP),
                    y(value),
                    barWidth,
                    y(0) - y(value),
                    RADIUS
                  )}
                  fill={seriesColor(series[s].color ?? s)}
                  opacity={active === null || active === i ? 1 : 0.55}
                />
              ))}
            </g>
          );
        })}

        {/* One hit target per category: as wide as the whole slot, not just the painted bar */}
        {categories.map((category, i) => (
          <rect
            key={category.key}
            x={MARGIN.left + band * i}
            y={MARGIN.top}
            width={band}
            height={plotHeight}
            fill="transparent"
            onPointerEnter={() => setActive(i)}
            onPointerDown={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
          />
        ))}
      </svg>

      <ChartTooltip
        open={active !== null}
        x={active !== null ? centre(active) : 0}
        width={width}
        title={activeCategory?.title ?? activeCategory?.label}
        rows={
          active === null
            ? []
            : series.map((item, s) => ({
                key: item.key,
                label: item.label,
                value: format(Number(item.values[active]) || 0),
                color: seriesColor(item.color ?? s),
                swatch: true,
              }))
        }
      />

      {series.length > 1 && (
        <Box sx={{ pt: 1.5, pl: `${MARGIN.left}px` }}>
          <ChartLegend
            shape="bar"
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
