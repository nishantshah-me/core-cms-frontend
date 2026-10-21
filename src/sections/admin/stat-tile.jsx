'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import {
  Remove as FlatIcon,
  TrendingUp as UpIcon,
  TrendingDown as DownIcon,
  FiberNew as NewIcon,
} from '@mui/icons-material';

import { RouterLink } from 'src/routes/components';

import { Sparkline } from 'src/components/chart';

import { deltaOf, fPercent } from 'src/utils/admin-format';

// ----------------------------------------------------------------------

/**
 * Change against the previous period. Colour is direction x whether up is good (churn going up is bad), and the
 * arrow plus the signed number mean it never relies on colour alone.
 */
export function DeltaBadge({
  current,
  previous,
  goodWhen = 'up',
  period = 'the previous period',
  format,
}) {
  const { pct, diff, direction } = deltaOf(current, previous);

  let tone = 'text.secondary';
  if (direction === 'up' || direction === 'down') {
    const good = goodWhen === 'up' ? direction === 'up' : direction === 'down';
    tone = good ? 'success.main' : 'error.main';
  } else if (direction === 'new') {
    tone = goodWhen === 'up' ? 'success.main' : 'error.main';
  }

  const Icon = { up: UpIcon, down: DownIcon, new: NewIcon, flat: FlatIcon }[direction];
  const text =
    direction === 'flat'
      ? 'No change'
      : direction === 'new'
        ? `+${format ? format(diff) : diff}`
        : `${diff > 0 ? '+' : '−'}${fPercent(Math.abs(pct), Math.abs(pct) < 10 ? 1 : 0)}`;

  const title = `${format ? format(current) : current} now, ${format ? format(previous) : previous} in ${period}`;

  return (
    <Tooltip title={title} placement="top">
      <Box
        component="span"
        sx={{ gap: 0.25, color: tone, display: 'inline-flex', alignItems: 'center' }}
      >
        <Icon sx={{ fontSize: 16 }} />
        <Typography
          component="span"
          variant="caption"
          sx={{ fontWeight: 700, color: 'inherit', fontVariantNumeric: 'tabular-nums' }}
        >
          {text}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ----------------------------------------------------------------------

const TONES = {
  default: { bar: 'transparent', icon: 'primary' },
  warning: { bar: 'warning.main', icon: 'warning' },
  error: { bar: 'error.main', icon: 'error' },
  success: { bar: 'success.main', icon: 'success' },
};

/**
 * One headline number: label, value, optional change against the previous period, optional trend. Sentence-case
 * label, proportional digits for the value. Pass `href` to make the whole tile a link to where the number comes from.
 */
export function StatTile({
  label,
  value,
  hint,
  icon,
  delta,
  trend,
  trendColor,
  href,
  tone = 'default',
  loading = false,
  sx,
}) {
  const palette = TONES[tone] ?? TONES.default;

  const body = (
    <Box
      sx={{
        p: 2.5,
        height: 1,
        width: 1,
        display: 'flex',
        textAlign: 'left',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{ gap: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
        {icon && (
          <Box
            sx={(theme) => ({
              mt: -0.5,
              mr: -0.5,
              width: 32,
              height: 32,
              display: 'flex',
              borderRadius: 1,
              alignItems: 'center',
              justifyContent: 'center',
              color: `${palette.icon}.main`,
              bgcolor: theme.vars.palette[palette.icon]
                ? `rgba(${theme.vars.palette[palette.icon].mainChannel} / 0.12)`
                : 'action.hover',
              '& svg': { fontSize: 18 },
            })}
          >
            {icon}
          </Box>
        )}
      </Box>

      <Typography
        variant="h3"
        sx={{
          mt: 0.75,
          lineHeight: 1.15,
          opacity: loading ? 0.45 : 1,
          transition: 'opacity 160ms',
        }}
      >
        {value}
      </Typography>

      <Box
        sx={{
          mt: 1,
          gap: 1,
          minHeight: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {delta && <DeltaBadge {...delta} />}
        {hint && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {hint}
          </Typography>
        )}
      </Box>

      {trend && (
        <Box sx={{ mt: 1.5, mx: -0.5 }}>
          <Sparkline values={trend} color={trendColor} />
        </Box>
      )}
    </Box>
  );

  return (
    <Card
      sx={[
        (theme) => ({
          height: 1,
          position: 'relative',
          border: `solid 1px ${theme.vars.palette.divider}`,
          boxShadow: 'none',
          '&::before': {
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            content: '""',
            position: 'absolute',
            bgcolor: palette.bar,
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {href ? (
        <CardActionArea
          component={RouterLink}
          href={href}
          sx={{ height: 1, alignItems: 'stretch', display: 'flex' }}
        >
          {body}
        </CardActionArea>
      ) : (
        body
      )}
    </Card>
  );
}
