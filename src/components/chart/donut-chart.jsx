'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { fInt, fPercent } from 'src/utils/admin-format';

import { ChartRoot } from './chart-root';
import { arcPath } from './chart-utils';

// ----------------------------------------------------------------------

/**
 * Part-to-whole at a glance, for a handful of segments. The legend beside it always lists the numbers, so the ring
 * is never the only way to read a value. Slices are separated by a 2px gap of the surface colour.
 *
 * @param {Array<{ key: string, label: string, value: number, color: string }>} slices `color` is a CSS colour / var.
 */
export function DonutChart({
  slices,
  size = 168,
  thickness = 22,
  format = fInt,
  caption = 'Total',
  total: totalOverride,
  empty = 'No data yet',
}) {
  const [hover, setHover] = useState(null);

  const visible = slices.filter((slice) => slice.value > 0);
  const total = totalOverride ?? slices.reduce((sum, slice) => sum + slice.value, 0);
  const sum = visible.reduce((acc, slice) => acc + slice.value, 0);
  const radius = size / 2;
  const focus = slices.find((slice) => slice.key === hover);

  let cursor = 0;
  const arcs = visible.map((slice) => {
    const start = cursor;
    cursor += (slice.value / sum) * Math.PI * 2;
    // A single slice is a full circle, which an arc path cannot draw; stop a hair short of it.
    return { slice, start, end: visible.length === 1 ? cursor - 0.0001 : cursor };
  });

  return (
    <ChartRoot>
      <Box sx={{ gap: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} role="img" aria-label={`${caption}: ${format(total)}`}>
            {sum === 0 && (
              <circle
                cx={radius}
                cy={radius}
                r={radius - thickness / 2}
                fill="none"
                stroke="var(--chart-grid)"
                strokeWidth={thickness}
              />
            )}
            {arcs.map(({ slice, start, end }) => {
              const lifted = hover === slice.key;
              return (
                <path
                  key={slice.key}
                  d={arcPath(
                    radius,
                    radius,
                    radius - (lifted ? 0 : 3),
                    radius - thickness - (lifted ? 0 : 3),
                    start,
                    end
                  )}
                  fill={slice.color}
                  stroke="var(--chart-surface)"
                  strokeWidth={2}
                  opacity={hover && !lifted ? 0.5 : 1}
                  onPointerEnter={() => setHover(slice.key)}
                  onPointerLeave={() => setHover(null)}
                  style={{ transition: 'opacity 120ms' }}
                />
              );
            })}
          </svg>

          <Box
            sx={{
              inset: 0,
              display: 'flex',
              position: 'absolute',
              textAlign: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              justifyContent: 'center',
              pointerEvents: 'none',
              px: `${thickness + 8}px`,
            }}
          >
            <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
              {format(focus ? focus.value : total)}
            </Typography>
            <Typography variant="caption" noWrap sx={{ maxWidth: 1, color: 'text.secondary' }}>
              {focus ? focus.label : caption}
            </Typography>
          </Box>
        </Box>

        <Box
          component="ul"
          sx={{
            m: 0,
            p: 0,
            gap: 0.75,
            flex: '1 1 140px',
            minWidth: 0,
            display: 'flex',
            listStyle: 'none',
            flexDirection: 'column',
          }}
        >
          {slices.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {empty}
            </Typography>
          )}
          {slices.map((slice) => (
            <Box
              component="li"
              key={slice.key}
              onPointerEnter={() => setHover(slice.key)}
              onPointerLeave={() => setHover(null)}
              sx={{
                gap: 1,
                display: 'flex',
                alignItems: 'center',
                opacity: hover && hover !== slice.key ? 0.6 : 1,
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 12,
                  height: 8,
                  flexShrink: 0,
                  borderRadius: 0.5,
                  bgcolor: slice.color,
                }}
              />
              <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }} title={slice.label}>
                {slice.label}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {format(slice.value)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  width: 44,
                  textAlign: 'right',
                  color: 'text.secondary',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {sum ? fPercent((slice.value / sum) * 100, 0) : '—'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </ChartRoot>
  );
}
