import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { fInt } from 'src/utils/admin-format';

import { ChartRoot } from './chart-root';

// ----------------------------------------------------------------------

/**
 * A ranked list of horizontal bars: label and value on one line, a thin bar under it. For nominal categories every
 * bar is the same colour (the length already says "more"), unless an item carries its own entity colour.
 *
 * @param {Array<{ key: string, label: string, value: number, caption?: string, href?: string, color?: string }>} items
 */
export function HBarList({
  items,
  format = fInt,
  max,
  color = 'var(--chart-1)',
  empty = 'No data yet',
}) {
  if (!items?.length) {
    return (
      <Typography variant="body2" sx={{ py: 2, color: 'text.secondary' }}>
        {empty}
      </Typography>
    );
  }

  const top = max ?? Math.max(...items.map((item) => item.value), 1);

  return (
    <ChartRoot>
      <Box
        component="ul"
        sx={{ m: 0, p: 0, gap: 1.75, display: 'flex', listStyle: 'none', flexDirection: 'column' }}
      >
        {items.map((item) => {
          const fill = item.color ?? color;
          const label = item.href ? (
            <Link
              component={RouterLink}
              href={item.href}
              color="inherit"
              underline="hover"
              variant="body2"
              noWrap
              sx={{ minWidth: 0 }}
            >
              {item.label}
            </Link>
          ) : (
            <Typography variant="body2" noWrap title={item.label} sx={{ minWidth: 0 }}>
              {item.label}
            </Typography>
          );

          return (
            <Box component="li" key={item.key}>
              <Box
                sx={{
                  gap: 1.5,
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                {label}
                <Typography
                  variant="subtitle2"
                  sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                >
                  {format(item.value)}
                  {item.caption && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 0.75, color: 'text.secondary' }}
                    >
                      {item.caption}
                    </Typography>
                  )}
                </Typography>
              </Box>
              <Box
                sx={{
                  mt: 0.75,
                  height: 6,
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: `color-mix(in srgb, ${fill} 14%, var(--chart-surface))`,
                }}
              >
                <Box
                  sx={{
                    height: 1,
                    borderRadius: 3,
                    bgcolor: fill,
                    width: `${Math.max(item.value > 0 ? 1.5 : 0, (item.value / top) * 100)}%`,
                    transition: 'width 240ms ease',
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </ChartRoot>
  );
}
