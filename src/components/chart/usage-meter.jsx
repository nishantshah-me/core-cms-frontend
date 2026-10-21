import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { fInt } from 'src/utils/admin-format';

import { ChartRoot } from './chart-root';

// ----------------------------------------------------------------------

/**
 * Used against a limit. The fill carries severity (blue, then amber from 80%, then red once over); the unfilled
 * track is a lighter step of the same colour, so the state reads across the whole bar. No limit = unlimited.
 */
export function UsageMeter({ value, limit, label, unit = '', dense = false }) {
  const unlimited = limit === null || limit === undefined;
  const ratio = unlimited ? 0 : limit === 0 ? (value > 0 ? 2 : 0) : value / limit;
  const fill =
    ratio > 1 ? 'var(--chart-critical)' : ratio >= 0.8 ? 'var(--chart-warning)' : 'var(--chart-1)';

  return (
    <ChartRoot>
      {!dense && (
        <Box
          sx={{
            mb: 0.75,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {label}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {fInt(value)}
            {!unlimited && ` / ${fInt(limit)}`}
            {unit && ` ${unit}`}
            {unlimited && (
              <Typography
                component="span"
                variant="caption"
                sx={{ ml: 0.5, color: 'text.secondary' }}
              >
                no limit
              </Typography>
            )}
          </Typography>
        </Box>
      )}
      <Box
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={unlimited ? undefined : limit}
        sx={{
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: `color-mix(in srgb, ${fill} 16%, var(--chart-surface))`,
        }}
      >
        <Box
          sx={{
            height: 1,
            borderRadius: 3,
            bgcolor: fill,
            width: `${unlimited ? (value ? 100 : 0) : Math.min(ratio, 1) * 100}%`,
            opacity: unlimited ? 0.35 : 1,
          }}
        />
      </Box>
    </ChartRoot>
  );
}
