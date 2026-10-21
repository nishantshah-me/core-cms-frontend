import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

/**
 * The floating readout of a chart. Values lead, series names follow; rows are keyed with a short stroke of the
 * series colour (a line key), not a box. Every string is rendered as text, never as HTML.
 *
 * `x` / `y` are pixels inside the chart's relative container; the box flips to the left of the pointer past the middle.
 */
export function ChartTooltip({ open, x, y = 8, width, title, rows = [], footer }) {
  if (!open) return null;

  const flip = x > width / 2;

  return (
    <Box
      role="status"
      sx={(theme) => ({
        top: y,
        left: x,
        zIndex: 2,
        minWidth: 150,
        maxWidth: 260,
        borderRadius: 1.5,
        position: 'absolute',
        pointerEvents: 'none',
        p: theme.spacing(1, 1.5),
        color: 'text.primary',
        bgcolor: 'background.paper',
        boxShadow: theme.vars.customShadows?.z16 ?? theme.shadows[8],
        border: `solid 1px ${theme.vars.palette.divider}`,
        transform: flip ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
      })}
    >
      {title && (
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
          {title}
        </Typography>
      )}

      {rows.map((row) => (
        <Box
          key={row.key ?? row.label}
          sx={{ gap: 1, py: 0.25, display: 'flex', alignItems: 'center' }}
        >
          <Box
            component="span"
            sx={{
              width: 12,
              height: row.swatch ? 8 : 3,
              flexShrink: 0,
              borderRadius: row.swatch ? 0.5 : 1,
              bgcolor: row.color,
            }}
          />
          <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }} noWrap>
            {row.label}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {row.value}
          </Typography>
        </Box>
      ))}

      {footer && (
        <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.disabled' }}>
          {footer}
        </Typography>
      )}
    </Box>
  );
}
