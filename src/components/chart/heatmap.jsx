'use client';

import { useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { fInt, fPercent } from 'src/utils/admin-format';

import { ChartRoot } from './chart-root';
import { ChartTooltip } from './chart-tooltip';

// ----------------------------------------------------------------------

/** One hue, light to dark: more is darker. Zero stays on the surface so empty cells recede. */
export const heatColor = (ratio, hue = 'var(--chart-1)') =>
  `color-mix(in srgb, ${hue} ${Math.round(ratio <= 0 ? 0 : 10 + 90 * Math.min(ratio, 1))}%, var(--chart-surface))`;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first

function Scale({ label = 'Less', end = 'More' }) {
  return (
    <Box sx={{ gap: 0.75, display: 'flex', alignItems: 'center' }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      {[0, 0.25, 0.5, 0.75, 1].map((step) => (
        <Box
          key={step}
          sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: heatColor(step) }}
        />
      ))}
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {end}
      </Typography>
    </Box>
  );
}

/**
 * Weekday x hour grid (7 x 24). Hover or focus a cell for the exact count; the darkest cell is the busiest hour.
 * @param {Array<{ weekday: number, hour: number, count: number }>} cells weekday 0 = Sunday, in the viewer's timezone
 */
export function HourHeatmap({ cells, unit = 'logins' }) {
  const containerRef = useRef(null);
  const [hover, setHover] = useState(null);

  const byKey = new Map(cells.map((cell) => [`${cell.weekday}-${cell.hour}`, cell.count]));
  const max = Math.max(...cells.map((cell) => cell.count), 0);

  const show = (event, weekday, hour) => {
    const box = containerRef.current?.getBoundingClientRect();
    const target = event.currentTarget.getBoundingClientRect();
    if (!box) return;
    setHover({
      weekday,
      hour,
      x: target.left - box.left + target.width / 2,
      y: target.top - box.top - 4,
    });
  };

  const hourLabel = (hour) => `${String(hour).padStart(2, '0')}:00`;

  return (
    <ChartRoot ref={containerRef}>
      <Box
        role="grid"
        aria-label={`${unit} by weekday and hour`}
        sx={{
          gap: '3px',
          display: 'grid',
          gridTemplateColumns: '34px repeat(24, minmax(0, 1fr))',
          alignItems: 'center',
        }}
      >
        <span />
        {Array.from({ length: 24 }, (_, hour) => (
          <Typography
            key={hour}
            variant="caption"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: 10,
              visibility: hour % 3 === 0 ? 'visible' : 'hidden',
            }}
          >
            {hour}
          </Typography>
        ))}

        {WEEK_ORDER.map((weekday) => (
          <Box key={weekday} sx={{ display: 'contents' }} role="row">
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {WEEKDAYS[weekday]}
            </Typography>
            {Array.from({ length: 24 }, (_, hour) => {
              const count = byKey.get(`${weekday}-${hour}`) ?? 0;
              return (
                <Box
                  key={hour}
                  role="gridcell"
                  tabIndex={0}
                  aria-label={`${WEEKDAYS[weekday]} ${hourLabel(hour)}: ${count} ${unit}`}
                  onPointerEnter={(event) => show(event, weekday, hour)}
                  onFocus={(event) => show(event, weekday, hour)}
                  onPointerLeave={() => setHover(null)}
                  onBlur={() => setHover(null)}
                  sx={{
                    height: 22,
                    outline: 'none',
                    borderRadius: 0.5,
                    bgcolor: max ? heatColor(count / max) : 'transparent',
                    boxShadow: count === 0 ? 'inset 0 0 0 1px var(--chart-grid)' : 'none',
                    '&:hover, &:focus-visible': { boxShadow: 'inset 0 0 0 2px var(--chart-ink)' },
                  }}
                />
              );
            })}
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
        <Scale end={max ? `More (${fInt(max)})` : 'More'} />
      </Box>

      <ChartTooltip
        open={Boolean(hover)}
        x={hover?.x ?? 0}
        y={hover?.y ?? 0}
        width={containerRef.current?.clientWidth ?? 600}
        title={
          hover
            ? `${WEEKDAYS[hover.weekday]}, ${hourLabel(hover.hour)}–${hourLabel((hover.hour + 1) % 24)}`
            : ''
        }
        rows={
          hover
            ? [
                {
                  key: 'count',
                  label: unit,
                  value: fInt(byKey.get(`${hover.weekday}-${hover.hour}`) ?? 0),
                  swatch: true,
                  color: 'var(--chart-1)',
                },
              ]
            : []
        }
      />
    </ChartRoot>
  );
}

/**
 * Cohort retention: one row per signup month, one column per month since signup. Cells hold the percentage, so
 * the number is always readable; the shade only helps the eye find the pattern. Months that have not happened are blank.
 * @param {Array<{ key: string, label: string, size: number, values: Array<number|null> }>} rows
 */
export function CohortGrid({ rows, columns, hue = 'var(--chart-1)' }) {
  return (
    <ChartRoot>
      <Box sx={{ overflowX: 'auto' }}>
        <Box
          role="table"
          sx={{
            gap: '3px',
            minWidth: 420,
            display: 'grid',
            alignItems: 'center',
            gridTemplateColumns: `148px repeat(${columns.length}, minmax(44px, 1fr))`,
          }}
        >
          <span />
          {columns.map((column) => (
            <Typography
              key={column}
              variant="caption"
              sx={{ textAlign: 'center', color: 'text.secondary' }}
            >
              {column}
            </Typography>
          ))}

          {rows.map((row) => (
            <Box key={row.key} role="row" sx={{ display: 'contents' }}>
              <Box sx={{ pr: 1 }}>
                <Typography variant="body2" noWrap>
                  {row.label}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {row.size} {row.size === 1 ? 'workspace' : 'workspaces'}
                </Typography>
              </Box>
              {columns.map((column, index) => {
                const value = row.values[index];
                const known = typeof value === 'number';
                return (
                  <Box
                    key={column}
                    role="cell"
                    sx={{
                      height: 34,
                      display: 'flex',
                      borderRadius: 0.75,
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: known ? heatColor(value / 100, hue) : 'transparent',
                      boxShadow: known ? 'none' : 'inset 0 0 0 1px var(--chart-grid)',
                      color: known && value > 55 ? '#fff' : 'var(--chart-ink)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, color: 'inherit', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {known ? fPercent(value, 0) : ''}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </ChartRoot>
  );
}
