'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import { VerifiedOutlined as VerifiedIcon } from '@mui/icons-material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { UsageMeter } from 'src/components/chart';
import { DashboardContent } from 'src/layouts/dashboard';

import { fAgo, fInt, fWhen, fMoney, daysUntil } from 'src/utils/admin-format';

import { getDistribution, listWorkspaces } from 'src/auth/services/adminReportsService';

import { useReport } from 'src/sections/admin/use-report';
import { PageHeader } from 'src/sections/admin/page-header';
import { TableState } from 'src/sections/admin/table-state';
import { SearchField } from 'src/sections/admin/search-field';
import { StatusTabs } from 'src/sections/admin/status-tabs';
import { ReportError } from 'src/sections/admin/report-error';
import { usePagedList } from 'src/sections/admin/use-paged-list';
import { SubscriptionStatusLabel } from 'src/sections/admin/status-labels';
import { toolbarSx, FilterSelect } from 'src/sections/admin/filter-select';

import { ChangePlanDialog } from './change-plan-dialog';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Paying', color: 'success' },
  { value: 'past_due', label: 'Past due', color: 'error' },
  { value: 'trialing', label: 'Trial', color: 'info' },
  { value: 'free', label: 'Free' },
  { value: 'grandfathered', label: 'Grandfathered', color: 'secondary' },
];

const SORTS = [
  { value: 'created:desc', label: 'Newest first' },
  { value: 'created:asc', label: 'Oldest first' },
  { value: 'name:asc', label: 'Name A–Z' },
  { value: 'seats:desc', label: 'Most seats' },
  { value: 'mrr:desc', label: 'Highest revenue' },
  { value: 'trial_ends:asc', label: 'Trial ending soonest' },
  { value: 'renews:asc', label: 'Renewing soonest' },
];

const COLUMN_COUNT = 9;

/** Who is on a trial and when it ends, or when a paid plan renews. */
function planDetail(subscription) {
  if (subscription.status === 'trialing' && subscription.trial_days_left !== null) {
    return `Trial · ${subscription.trial_days_left} d left`;
  }
  if (subscription.status === 'active' || subscription.status === 'past_due') {
    const per = subscription.interval === 'year' ? 'yearly' : 'monthly';
    const renew = daysUntil(subscription.current_period_end);
    return `${subscription.plan_name} · ${per}${renew !== null && renew >= 0 ? ` · renews in ${renew} d` : ''}`;
  }
  return subscription.plan_name;
}

// ----------------------------------------------------------------------

export function WorkspacesView() {
  const router = useRouter();
  const params = useSearchParams();

  const list = usePagedList(listWorkspaces, {
    initialFilters: {
      subscriptionStatus: params.get('status') ?? 'all',
      ownerId: params.get('owner_id') ?? '',
      plan: '',
      search: '',
      sort: 'created',
      order: 'desc',
    },
  });
  const { filters, setFilter, patchFilters, result, rows, total, loading, error, reload } = list;

  const [targetWorkspace, setTargetWorkspace] = useState(null);

  const distribution = useReport(() => getDistribution(), 'distribution');
  const planOptions = useMemo(
    () => [
      { value: '', label: 'All plans' },
      ...(distribution.data?.plans ?? []).map((plan) => ({ value: plan.key, label: plan.label })),
    ],
    [distribution.data]
  );

  const sortValue = `${filters.sort}:${filters.order}`;
  const waiting = loading && rows.length === 0;
  const filtered = Boolean(
    filters.search || filters.plan || filters.ownerId || filters.subscriptionStatus !== 'all'
  );

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Workspaces"
        subtitle="Every customer workspace: who owns it, how many people use it, what it pays and when it was last active."
        trail={[{ label: 'Workspaces' }]}
      />

      <ReportError error={error} onRetry={reload} />

      <Card>
        <StatusTabs
          value={filters.subscriptionStatus}
          onChange={(value) => setFilter('subscriptionStatus', value)}
          tabs={TABS}
          counts={result?.counts}
        />

        <Box sx={toolbarSx}>
          <SearchField
            placeholder="Search by workspace, subdomain or owner"
            onSearch={(value) => setFilter('search', value)}
          />
          <FilterSelect
            label="Plan"
            value={filters.plan}
            options={planOptions}
            onChange={(value) => setFilter('plan', value)}
          />
          <FilterSelect
            label="Sort by"
            value={sortValue}
            options={SORTS}
            minWidth={190}
            onChange={(value) => {
              const [sort, order] = value.split(':');
              patchFilters({ sort, order });
            }}
          />
        </Box>

        {filters.ownerId && (
          <Typography variant="body2" sx={{ px: 2.5, pb: 2, color: 'text.secondary' }}>
            Showing one owner&apos;s workspaces.{' '}
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => setFilter('ownerId', '')}
            >
              Show everyone&apos;s
            </Link>
          </Typography>
        )}

        <TableContainer
          sx={{ opacity: loading && !waiting ? 0.55 : 1, transition: 'opacity 160ms' }}
        >
          <Table sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell>Workspace</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell sx={{ minWidth: 140 }}>Seats</TableCell>
                <TableCell align="right">Companies</TableCell>
                <TableCell align="right">MRR</TableCell>
                <TableCell>Last active</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableState
                colSpan={COLUMN_COUNT}
                loading={waiting}
                empty={!loading && rows.length === 0}
                title={filtered ? 'No workspaces match' : 'No workspaces yet'}
                hint={
                  filtered
                    ? 'Try a different search or clear the filters.'
                    : 'Workspaces appear when an approved owner signs up.'
                }
              />
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  onClick={() => router.push(paths.dashboard.workspaceDetails(row.id))}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Box sx={{ gap: 0.75, display: 'flex', alignItems: 'center' }}>
                      <Link
                        component={RouterLink}
                        href={paths.dashboard.workspaceDetails(row.id)}
                        onClick={(event) => event.stopPropagation()}
                        color="inherit"
                        underline="hover"
                        variant="subtitle2"
                        noWrap
                      >
                        {row.name || `Workspace ${row.id}`}
                      </Link>
                      {row.is_verified && (
                        <Tooltip title="Verified">
                          <VerifiedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        </Tooltip>
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ display: 'block', color: 'text.secondary' }}
                    >
                      {row.subdomain}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography variant="body2" noWrap>
                      {row.owner?.name ?? '—'}
                    </Typography>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ display: 'block', color: 'text.secondary' }}
                    >
                      {row.owner?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <SubscriptionStatusLabel status={row.subscription.status} />
                    <Typography
                      variant="caption"
                      sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}
                    >
                      {planDetail(row.subscription)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {fInt(row.seats_used)}
                      {row.subscription.seats
                        ? ` / ${fInt(row.subscription.seats)} bought`
                        : row.seat_limit
                          ? ` / ${fInt(row.seat_limit)}`
                          : ''}
                    </Typography>
                    <UsageMeter
                      dense
                      value={row.seats_used}
                      limit={row.subscription.seats ?? row.seat_limit}
                      label="Seats"
                    />
                  </TableCell>
                  <TableCell align="right">{fInt(row.companies)}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {row.mrr_minor ? fMoney(row.mrr_minor, row.subscription.currency) : '—'}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {fAgo(row.last_active_at, 'Never')}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fWhen(row.created_at)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(event) => {
                        event.stopPropagation();
                        setTargetWorkspace(row);
                      }}
                    >
                      Change plan
                    </Button>
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
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_, value) => list.setPage(value)}
          onRowsPerPageChange={(event) => list.setRowsPerPage(parseInt(event.target.value, 10))}
        />
      </Card>

      <ChangePlanDialog
        workspace={targetWorkspace}
        open={Boolean(targetWorkspace)}
        onClose={() => setTargetWorkspace(null)}
        onUpdated={reload}
      />
    </DashboardContent>
  );
}
