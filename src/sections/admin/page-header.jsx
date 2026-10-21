import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

/** Breadcrumbs, a title with its explanation, and the page's actions on the right. */
export function PageHeader({ title, subtitle, trail = [], actions, sx }) {
  return (
    <Box sx={[{ mb: 3 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Breadcrumbs sx={{ mb: 1.5 }} aria-label="Breadcrumb">
        <Link
          component={RouterLink}
          color="inherit"
          href={paths.dashboard.root}
          underline="hover"
          variant="body2"
        >
          Dashboard
        </Link>
        {trail.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              component={RouterLink}
              color="inherit"
              href={item.href}
              underline="hover"
              variant="body2"
            >
              {item.label}
            </Link>
          ) : (
            <Typography key={item.label} color="text.primary" variant="body2">
              {item.label}
            </Typography>
          )
        )}
      </Breadcrumbs>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { md: 'flex-end' }, justifyContent: 'space-between' }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 720, color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box
            sx={{ gap: 1, flexShrink: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
          >
            {actions}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
