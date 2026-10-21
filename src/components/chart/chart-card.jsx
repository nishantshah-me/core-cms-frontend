'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tooltip from '@mui/material/Tooltip';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { TableChart as TableIcon, BarChart as ChartIcon } from '@mui/icons-material';

import { ChartTable } from './chart-table';

// ----------------------------------------------------------------------

/**
 * A card around one chart. Give it `table` ({ columns, rows }) and the header gets a chart / table switch, so every
 * value in the chart is also readable as text. While `loading`, the previous chart stays put, dimmed: no skeleton, no jump.
 */
export function ChartCard({
  title,
  subheader,
  action,
  table,
  loading,
  empty,
  children,
  sx,
  contentSx,
}) {
  const [view, setView] = useState('chart');

  return (
    <Card
      sx={[
        { height: 1, display: 'flex', flexDirection: 'column' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <CardHeader
        title={title}
        subheader={subheader}
        slotProps={{ title: { variant: 'subtitle1' }, subheader: { variant: 'caption' } }}
        action={
          <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
            {action}
            {table && !empty && (
              <ToggleButtonGroup
                exclusive
                size="small"
                value={view}
                onChange={(_, next) => next && setView(next)}
                aria-label="Chart or table view"
              >
                <Tooltip title="Chart">
                  <ToggleButton value="chart" aria-label="Chart view" sx={{ px: 1 }}>
                    <ChartIcon fontSize="small" />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Table">
                  <ToggleButton value="table" aria-label="Table view" sx={{ px: 1 }}>
                    <TableIcon fontSize="small" />
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
            )}
          </Box>
        }
        sx={{ pb: 1 }}
      />

      <CardContent
        sx={[{ pt: 1, flex: '1 1 auto' }, ...(Array.isArray(contentSx) ? contentSx : [contentSx])]}
      >
        {empty ? (
          <Typography variant="body2" sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            {empty}
          </Typography>
        ) : (
          <Box
            sx={{
              opacity: loading ? 0.5 : 1,
              transition: 'opacity 160ms',
              pointerEvents: loading ? 'none' : 'auto',
            }}
          >
            {view === 'table' && table ? <ChartTable {...table} /> : children}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
