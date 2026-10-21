import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

/**
 * Identity for two or more series. Marks mirror the chart: a short line for lines, a small rectangle for bars and
 * areas. Text stays in the ink colour; only the key beside it carries the series colour.
 */
export function ChartLegend({ items, shape = 'line', sx }) {
  if (!items || items.length < 2) return null;

  return (
    <Box
      component="ul"
      sx={[
        { m: 0, p: 0, gap: 2, rowGap: 0.5, display: 'flex', flexWrap: 'wrap', listStyle: 'none' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {items.map((item) => (
        <Box
          component="li"
          key={item.key}
          sx={{ gap: 0.75, display: 'flex', alignItems: 'center' }}
        >
          <Box
            component="span"
            sx={{
              width: 12,
              height: shape === 'line' ? 3 : 8,
              borderRadius: shape === 'line' ? 1 : 0.5,
              bgcolor: item.color,
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
