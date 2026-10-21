'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Typography from '@mui/material/Typography';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import {
  Webhook as EventIcon,
  ErrorOutline as FailedIcon,
  HourglassTop as StuckIcon,
  AccessTime as ClockIcon,
} from '@mui/icons-material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { ChartCard, HBarList } from 'src/components/chart';

import { fInt, fAgo, fMoney, fWhenTime } from 'src/utils/admin-format';

import { listWebhooks } from 'src/auth/services/adminReportsService';

import { CopyText } from 'src/sections/admin/copy-text';
import { StatTile } from 'src/sections/admin/stat-tile';
import { TableState } from 'src/sections/admin/table-state';
import { StatusTabs } from 'src/sections/admin/status-tabs';
import { ReportError } from 'src/sections/admin/report-error';
import { usePagedList } from 'src/sections/admin/use-paged-list';
import { WebhookStateLabel } from 'src/sections/admin/status-labels';
import { toolbarSx, FilterSelect } from 'src/sections/admin/filter-select';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'processed', label: 'Processed', color: 'success' },
  { value: 'failed', label: 'Failed', color: 'error' },
  { value: 'stuck', label: 'Stuck', color: 'warning' },
  { value: 'pending', label: 'Pending' },
];

const COLUMN_COUNT = 6;

/**
 * The Razorpay event log. Razorpay is the source of truth for subscriptions, so a failed or stuck event means a
 * workspace's plan may disagree with what it paid for.
 */
export function EventsTab({ initial }) {
  const list = usePagedList(listWebhooks, {
    initialFilters: { state: initial.state ?? 'all', event: '' },
  });
  const { filters, setFilter, result, rows, total, loading, error, reload } = list;

  const waiting = loading && rows.length === 0;
  const counts = result?.counts ?? {};

  return (
    <>
      <ReportError error={error} onRetry={reload} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Received, 24 hours"
            value={fInt(result?.received_24h)}
            icon={<EventIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Failed"
            value={fInt(counts.failed)}
            hint="processing raised an error"
            tone={counts.failed ? 'error' : 'default'}
            icon={<FailedIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Stuck"
            value={fInt(counts.stuck)}
            hint="unprocessed for over 5 minutes"
            tone={counts.stuck ? 'warning' : 'default'}
            icon={<StuckIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Last event"
            value={fAgo(result?.last_received_at, 'None yet')}
            hint={fWhenTime(result?.last_received_at, '')}
            icon={<ClockIcon />}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <StatusTabs
              value={filters.state}
              onChange={(value) => setFilter('state', value)}
              tabs={TABS}
              counts={counts}
            />

            <Box sx={toolbarSx}>
              <FilterSelect
                label="Event"
                value={filters.event}
                options={[
                  { value: '', label: 'All events' },
                  ...(result?.events ?? []).map((name) => ({ value: name, label: name })),
                ]}
                onChange={(value) => setFilter('event', value)}
                minWidth={240}
              />
            </Box>

            <TableContainer
              sx={{ opacity: loading && !waiting ? 0.55 : 1, transition: 'opacity 160ms' }}
            >
              <Table sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Received</TableCell>
                    <TableCell>Event</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Workspace</TableCell>
                    <TableCell>Razorpay id</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableState
                    colSpan={COLUMN_COUNT}
                    loading={waiting}
                    empty={!loading && rows.length === 0}
                    title="No events"
                    hint="Razorpay sends events here once billing is on."
                  />
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2">{fAgo(row.received_at)}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {fWhenTime(row.received_at)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="subtitle2" noWrap>
                          {row.event}
                        </Typography>
                        {row.entity_status && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            entity {row.entity_status}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <WebhookStateLabel state={row.state} />
                        {row.error && (
                          <Typography
                            variant="caption"
                            sx={{ mt: 0.5, display: 'block', maxWidth: 200, color: 'error.main' }}
                          >
                            {row.error}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        {row.workspace ? (
                          <Link
                            component={RouterLink}
                            href={paths.dashboard.workspaceDetails(row.workspace.id)}
                            color="inherit"
                            underline="hover"
                            variant="body2"
                            noWrap
                          >
                            {row.workspace.name}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        <CopyText
                          value={row.razorpay_payment_id ?? row.razorpay_subscription_id}
                          label="Razorpay id"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.amount_minor
                          ? fMoney(row.amount_minor, row.currency ?? 'INR', { exact: true })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={list.page}
              rowsPerPage={list.rowsPerPage}
              rowsPerPageOptions={[10, 25, 50]}
              onPageChange={(_, value) => list.setPage(value)}
              onRowsPerPageChange={(event) => list.setRowsPerPage(parseInt(event.target.value, 10))}
            />
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            title="Events by type"
            subheader="Last 30 days; failures shown beside the count"
            loading={loading}
          >
            <HBarList
              items={(result?.by_event ?? []).map((item) => ({
                key: item.event,
                label: item.event,
                value: item.count,
                caption: item.failed ? `${item.failed} failed` : undefined,
              }))}
              empty="No events yet"
            />
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
}
