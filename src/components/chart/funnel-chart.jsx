import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { fInt, fPercent } from 'src/utils/admin-format';

import { ChartRoot } from './chart-root';

// ----------------------------------------------------------------------

/**
 * Ordered stages as bars scaled to the first stage. The stages are ordinal, so they take one hue stepping from light
 * to dark (the lightest still clears 2:1 on the card). Each row shows the count, the share of the top of the funnel
 * and, between stages, how many fell away.
 *
 * @param {Array<{ key: string, label: string, count: number, pct_of_signups: number|null, pct_of_previous: number|null }>} stages
 */
export function FunnelChart({ stages }) {
  if (!stages?.length) return null;

  const top = Math.max(stages[0].count, 1);

  return (
    <ChartRoot>
      <Box
        component="ol"
        sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0.5 }}
      >
        {stages.map((stage, index) => {
          const previous = stages[index - 1];
          const lost = previous ? previous.count - stage.count : 0;
          const shade = 55 + (45 * index) / Math.max(stages.length - 1, 1);

          return (
            <Box component="li" key={stage.key}>
              {previous && (
                <Typography
                  variant="caption"
                  sx={{ pl: 0.5, display: 'block', color: 'text.disabled', mb: 0.5 }}
                >
                  {lost > 0
                    ? `↓ ${fInt(lost)} dropped off (${fPercent(100 - (stage.pct_of_previous ?? 0), 0)})`
                    : '↓ nobody dropped off'}
                </Typography>
              )}
              <Box sx={{ gap: 1.5, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      height: 28,
                      minWidth: 6,
                      borderRadius: '0 6px 6px 0',
                      width: `${Math.max((stage.count / top) * 100, 0.6)}%`,
                      bgcolor: `color-mix(in srgb, var(--chart-1) ${shade}%, var(--chart-surface))`,
                      transition: 'width 240ms ease',
                    }}
                  />
                </Box>
                <Box sx={{ width: 168, flexShrink: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {fInt(stage.count)}{' '}
                    <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                      {fPercent(stage.pct_of_signups, 0)} of signups
                    </Typography>
                  </Typography>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ display: 'block', color: 'text.secondary' }}
                  >
                    {stage.label}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </ChartRoot>
  );
}
