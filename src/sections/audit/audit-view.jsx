'use client';

import { useState, Fragment } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import {
  Lock as LockIcon,
  Bolt as ChangeIcon,
  Replay as ReuseIcon,
  History as EventsIcon,
  ExpandMore as ExpandIcon,
  GppMaybe as FailedLoginIcon,
} from '@mui/icons-material';

import { Label } from 'src/components/label';
import { BarChart, ChartCard } from 'src/components/chart';
import { DashboardContent } from 'src/layouts/dashboard';

import { fInt, fAgo, fWhenTime, describeAgent } from 'src/utils/admin-format';

import { listAuditLogs } from 'src/auth/services/adminReportsService';

import { StatTile } from 'src/sections/admin/stat-tile';
import { PageHeader } from 'src/sections/admin/page-header';
import { TableState } from 'src/sections/admin/table-state';
import { SearchField } from 'src/sections/admin/search-field';
import { ReportError } from 'src/sections/admin/report-error';
import { usePagedList } from 'src/sections/admin/use-paged-list';
import { DateRangeFields } from 'src/sections/admin/date-range-fields';
import { toolbarSx, FilterSelect } from 'src/sections/admin/filter-select';
import { fAction, CATEGORY_COLORS, SECURITY_ACTIONS } from 'src/sections/admin/audit-utils';

// ----------------------------------------------------------------------

const COLUMN_COUNT = 5;

function DetailRow({ row, open }) {
  const details =
    row.details && Object.keys(row.details).length > 0
      ? JSON.stringify(row.details, null, 2)
      : null;

  return (
    <TableRow>
      <TableCell colSpan={COLUMN_COUNT} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ py: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                Details
              </Typography>
              {details ? (
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.5,
                    mt: 0.5,
                    fontSize: 12,
                    borderRadius: 1,
                    overflow: 'auto',
                    bgcolor: 'background.neutral',
                  }}
                >
                  {details}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No extra details were recorded.
                </Typography>
              )}
            </Box>
            <Box sx={{ minWidth: 220 }}>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                Where from
              </Typography>
              <Typography variant="body2">{row.ip ?? 'Unknown address'}</Typography>
              <Typography
                variant="caption"
                sx={{ display: 'block', color: 'text.secondary' }}
                title={row.user_agent ?? ''}
              >
                {describeAgent(row.user_agent)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ mt: 1, display: 'block', color: 'text.disabled' }}
              >
                {row.action} · #{row.id}
              </Typography>
            </Box>
          </Stack>
        </Collapse>
      </TableCell>
    </TableRow>
  );
}

/** Everything platform admins did in this console, and every sign-in attempt that failed: newest first, filterable. */
export function AuditView() {
  const list = usePagedList(listAuditLogs, {
    initialFilters: { search: '', category: '', action: '', adminId: '', start: '', end: '' },
    initialRowsPerPage: 25,
  });
  const { filters, setFilter, patchFilters, result, rows, total, loading, error, reload } = list;
  const [expanded, setExpanded] = useState({});

  const waiting = loading && rows.length === 0;
  const summary = result?.summary ?? {};
  const perDay = result?.per_day ?? [];
  const filtered = Boolean(
    filters.search ||
      filters.category ||
      filters.action ||
      filters.adminId ||
      filters.start ||
      filters.end
  );

  const dayCategories = perDay.map((day) => ({
    key: day.date,
    label: new Date(`${day.date}T00:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    }),
    title: new Date(`${day.date}T00:00:00`).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }));

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Audit log"
        subtitle="Every change made in this console and every sign-in attempt, with who did it and from where."
        trail={[{ label: 'Audit log' }]}
      />

      <ReportError error={error} onRetry={reload} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 'grow' }}>
          <StatTile
            label="Events, 24 hours"
            value={fInt(summary.events_24h)}
            icon={<EventsIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 'grow' }}>
          <StatTile
            label="Changes, 24 hours"
            value={fInt(summary.changes_24h)}
            hint="excluding sign-in events"
            icon={<ChangeIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 'grow' }}>
          <StatTile
            label="Failed sign-ins, 24 hours"
            value={fInt(summary.failed_logins_24h)}
            tone={summary.failed_logins_24h > 5 ? 'warning' : 'default'}
            icon={<FailedLoginIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 'grow' }}>
          <StatTile
            label="Lockouts, 7 days"
            value={fInt(summary.lockouts_7d)}
            tone={summary.lockouts_7d ? 'warning' : 'default'}
            icon={<LockIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 'grow' }}>
          <StatTile
            label="Token reuse, 7 days"
            value={fInt(summary.token_reuse_7d)}
            hint="a refresh token replayed"
            tone={summary.token_reuse_7d ? 'error' : 'default'}
            icon={<ReuseIcon />}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <ChartCard
          title="Activity, last 14 days"
          subheader="Events recorded per day"
          loading={loading}
          table={{
            columns: [
              { key: 'title', label: 'Day' },
              { key: 'count', label: 'Events', align: 'right' },
            ],
            rows: perDay.map((day, index) => ({
              key: day.date,
              title: dayCategories[index].title,
              count: day.count,
            })),
          }}
        >
          <BarChart
            categories={dayCategories}
            series={[{ key: 'events', label: 'Events', values: perDay.map((day) => day.count) }]}
            format={fInt}
            height={180}
          />
        </ChartCard>
      </Box>

      <Card>
        <Stack
          direction="row"
          spacing={1}
          sx={{ p: 2.5, pb: 0, flexWrap: 'wrap', rowGap: 1 }}
          role="group"
          aria-label="Filter by category"
        >
          <Chip
            label="Everything"
            color={filters.category === '' ? 'primary' : 'default'}
            variant={filters.category === '' ? 'filled' : 'outlined'}
            onClick={() => setFilter('category', '')}
          />
          {(result?.categories ?? []).map((category) => (
            <Chip
              key={category.key}
              label={`${fAction(category.key)} · ${fInt(category.count)}`}
              color={filters.category === category.key ? 'primary' : 'default'}
              variant={filters.category === category.key ? 'filled' : 'outlined'}
              onClick={() =>
                setFilter('category', filters.category === category.key ? '' : category.key)
              }
            />
          ))}
        </Stack>

        <Box sx={toolbarSx}>
          <SearchField
            placeholder="Search action, target id, IP or admin"
            onSearch={(value) => setFilter('search', value)}
          />
          <FilterSelect
            label="Action"
            value={filters.action}
            minWidth={210}
            options={[
              { value: '', label: 'Any action' },
              ...(result?.actions ?? []).map((action) => ({
                value: action.key,
                label: `${action.key} (${action.count})`,
              })),
            ]}
            onChange={(value) => setFilter('action', value)}
          />
          <FilterSelect
            label="Admin"
            value={filters.adminId}
            options={[
              { value: '', label: 'Anyone' },
              ...(result?.admins ?? []).map((admin) => ({ value: admin.id, label: admin.name })),
            ]}
            onChange={(value) => setFilter('adminId', value)}
          />
        </Box>
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <DateRangeFields
            start={filters.start}
            end={filters.end}
            onChange={(range) => patchFilters(range)}
          />
        </Box>

        <TableContainer
          sx={{ opacity: loading && !waiting ? 0.55 : 1, transition: 'opacity 160ms' }}
        >
          <Table sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Target</TableCell>
                <TableCell width={56} />
              </TableRow>
            </TableHead>
            <TableBody>
              <TableState
                colSpan={COLUMN_COUNT}
                loading={waiting}
                empty={!loading && rows.length === 0}
                title={filtered ? 'No events match' : 'Nothing logged yet'}
                hint={filtered ? 'Try a different search or widen the dates.' : undefined}
              />
              {rows.map((row) => {
                const open = Boolean(expanded[row.id]);
                const security = SECURITY_ACTIONS.has(row.action);
                return (
                  <Fragment key={row.id}>
                    <TableRow
                      hover
                      onClick={() => setExpanded((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                      sx={{
                        cursor: 'pointer',
                        '& > td': { borderBottom: open ? 'none' : undefined },
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2">{fAgo(row.created_at)}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {fWhenTime(row.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Label
                          color={security ? 'error' : (CATEGORY_COLORS[row.category] ?? 'default')}
                          title={row.action}
                        >
                          {fAction(row.action)}
                        </Label>
                      </TableCell>
                      <TableCell>
                        {row.admin?.name ?? (
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{ color: 'text.secondary' }}
                          >
                            {row.category === 'auth' ? 'Not signed in' : 'System'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="body2" noWrap>
                          {row.target_label ?? row.target_id ?? '—'}
                        </Typography>
                        {row.target_type && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {row.target_type.replace(/_/g, ' ')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          aria-label={open ? 'Hide details' : 'Show details'}
                          aria-expanded={open}
                          sx={{
                            transform: open ? 'rotate(180deg)' : 'none',
                            transition: 'transform 160ms',
                          }}
                        >
                          <ExpandIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <DetailRow row={row} open={open} />
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={list.page}
          rowsPerPage={list.rowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_, value) => list.setPage(value)}
          onRowsPerPageChange={(event) => list.setRowsPerPage(parseInt(event.target.value, 10))}
        />
      </Card>
    </DashboardContent>
  );
}
