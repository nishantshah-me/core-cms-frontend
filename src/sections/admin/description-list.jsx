import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

/**
 * Label / value pairs in two columns. Empty values show an em dash so the layout does not jump around.
 * @param {Array<{ label: string, value: any, hidden?: boolean }>} items
 */
export function DescriptionList({ items, sx }) {
  return (
    <Box
      component="dl"
      sx={[
        {
          m: 0,
          rowGap: 1.5,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: 'minmax(110px, 38%) minmax(0, 1fr)',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {items
        .filter((item) => !item.hidden)
        .map((item) => (
          <Box key={item.label} sx={{ display: 'contents' }}>
            <Typography component="dt" variant="body2" sx={{ color: 'text.secondary' }}>
              {item.label}
            </Typography>
            <Typography
              component="dd"
              variant="body2"
              sx={{ m: 0, minWidth: 0, wordBreak: 'break-word' }}
            >
              {item.value ?? '—'}
            </Typography>
          </Box>
        ))}
    </Box>
  );
}
