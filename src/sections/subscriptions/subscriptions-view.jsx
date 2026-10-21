'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

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
import CardActionArea from '@mui/material/CardActionArea';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { UsageMeter } from 'src/components/chart';
import { DashboardContent } from 'src/layouts/dashboard';

import { fInt, fWhen, fMoney, fAgo, daysUntil } from 'src/utils/admin-format';

import { getDistribution, listSubscriptions } from 'src/auth/services/adminReportsService';

import { useReport } from 'src/sections/admin/use-report';
import { CopyText } from 'src/sections/admin/copy-text';
import { StatTile } from 'src/sections/admin/stat-tile';
import { PageHeader } from 'src/sections/admin/page-header';
import { TableState } from 'src/sections/admin/table-state';
import { SearchField } from 'src/sections/admin/search-field';
import { StatusTabs } from 'src/sections/admin/status-tabs';
import { ReportError } from 'src/sections/admin/report-error';
import { usePagedList } from 'src/sections/admin/use-paged-list';
import { SubscriptionStatusLabel } from 'src/sections/admin/status-labels';
import { toolbarSx, FilterSelect } from 'src/sections/admin/filter-select';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Paying', color: 'success' },
  { value: 'past_due', label: 'Past due', color: 'error' },
  { value: 'trialing', label: 'Trial', color: 'info' },
  { value: 'free', label: 'Free' },
  { value: 'grandfathered', label: 'Grandfathered', color: 'secondary' },
];

const ATTENTION = [
  { key: 'past_due', label: 'Past due', hint: 'Payment is failing', tone: 'error' },
  { key: 'trial_ending', label: 'Trials ending', hint: 'Within 7 days', tone: 'warning' },
  { key: 'trial_lapsed', label: 'Lapsed trials', hint: 'Never converted', tone: 'default' },
  { key: 'cancelling', label: 'Cancelling', hint: 'Ends at period close', tone: 'warning' },
  { key: 'over_seats', label: 'Over seats', hint: 'More people than bought', tone: 'warning' },
];

const SORTS = [
  { value: 'updated:desc', label: 'Recently changed' },
  { value: 'created:desc', label: 'Newest first' },
  { value: 'workspace:asc', label: 'Workspace A–Z' },
  { value: 'mrr:desc', label: 'Highest revenue' },
  { value: 'seats:desc', label: 'Most seats bought' },
  { value: 'trial_ends:asc', label: 'Trial ending soonest' },
  { value: 'renews:asc', label: 'Renewing soonest' },
];

const INTERVALS = [
  { value: '', label: 'Any interval' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

const COLUMN_COUNT = 8;

/** What happens next on this subscription: when a trial ends, when a period renews, or that it is being cancelled. */
function nextEvent({ subscription }) {
  if (subscription.status === 'trialing' && subscription.trial_ends_at) {
    const days = daysUntil(subscription.trial_ends_at);
    return {
      primary: fWhen(subscription.trial_ends_at),
      secondary: days <= 0 ? 'Ends today' : `Trial ends in ${days} d`,
      tone: days <= 7 ? 'warning.main' : undefined,
    };
  }
  if (
    subscription.current_period_end &&
    (subscription.status === 'active' || subscription.status === 'past_due')
  ) {
    return {
      primary: fWhen(subscription.current_period_end),
      secondary: subscription.cancel_at_period_end
        ? 'Cancels then'
        : subscription.status === 'past_due'
          ? 'Renewal overdue'
          : 'Renews',
      tone:
        subscription.cancel_at_period_end || subscription.status === 'past_due'
          ? 'error.main'
          : undefined,
    };
  }
  return { primary: '—', secondary: '' };
}

// ----------------------------------------------------------------------

export function SubscriptionsView() {
  const params = useSearchParams();

  const list = usePagedList(listSubscriptions, {
    initialFilters: {
      subscriptionStatus: params.get('status') ?? 'all',
      attention: params.get('attention') ?? '',
      search: '',
      plan: '',
      interval: '',
      currency: '',
      sort: 'updated',
      order: 'desc',
    },
  });
  const { filters, setFilter, patchFilters, result, rows, total, loading, error, reload } = list;

  const distribution = useReport(() => getDistribution(), 'distribution');
  const planOptions = useMemo(
    () => [
      { value: '', label: 'All plans' },
      ...(distribution.data?.plans ?? []).map((plan) => ({ value: plan.key, label: plan.label })),
    ],
    [distribution.data]
  );
  const currencyOptions = useMemo(
    () => [
      { value: '', label: 'Any currency' },
      ...Object.keys(result?.mrr ?? {}).map((code) => ({ value: code, label: code })),
    ],
    [result?.mrr]
  );

  const waiting = loading && rows.length === 0;
  const mrr = result?.mrr ?? {};
  const attention = result?.attention ?? {};
  const filtered = Boolean(
    filters.search ||
      filters.plan ||
      filters.interval ||
      filters.currency ||
      filters.attention ||
      filters.subscriptionStatus !== 'all'
  );

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Subscriptions"
        subtitle="One subscription per workspace: what each is worth, when it renews, and which ones need a conversation."
        trail={[{ label: 'Subscriptions' }]}
      />

      <ReportError error={error} onRetry={reload} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {Object.entries(mrr).map(([currency, value]) => (
          <Grid key={currency} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatTile
              label={`Monthly recurring revenue · ${currency}`}
              value={fMoney(value.mrr_minor, currency, { compact: true })}
              hint={`${fInt(value.paying_workspaces)} paying workspaces · ${fInt(value.seats)} seats`}
              loading={loading}
            />
          </Grid>
        ))}
        {Object.keys(mrr).length === 0 && (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatTile
              label="Monthly recurring revenue"
              value="—"
              hint="No paying workspaces yet"
              loading={loading}
            />
          </Grid>
        )}
      </Grid>

      <Typography variant="overline" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
        Needs a look (click to filter)
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {ATTENTION.map((item) => {
          const selected = filters.attention === item.key;
          const count = attention[item.key] ?? 0;
          return (
            <Grid key={item.key} size={{ xs: 6, md: 4, lg: 'grow' }}>
              <Card
                sx={(theme) => ({
                  height: 1,
                  boxShadow: 'none',
                  border: `solid 1px ${selected ? theme.vars.palette.primary.main : theme.vars.palette.divider}`,
                  bgcolor: selected
                    ? `rgba(${theme.vars.palette.primary.mainChannel} / 0.06)`
                    : undefined,
                })}
              >
                <CardActionArea
                  onClick={() => setFilter('attention', selected ? '' : item.key)}
                  sx={{ p: 2, height: 1 }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {item.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      my: 0.5,
                      color:
                        count && item.tone !== 'default' ? `${item.tone}.main` : 'text.primary',
                    }}
                  >
                    {fInt(count)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {item.hint}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card>
        <StatusTabs
          value={filters.subscriptionStatus}
          onChange={(value) => setFilter('subscriptionStatus', value)}
          tabs={TABS}
          counts={result?.counts}
        />

        <Box sx={toolbarSx}>
          <SearchField
            placeholder="Search by workspace, owner email or Razorpay id"
            onSearch={(value) => setFilter('search', value)}
          />
          <FilterSelect
            label="Plan"
            value={filters.plan}
            options={planOptions}
            onChange={(value) => setFilter('plan', value)}
          />
          <FilterSelect
            label="Interval"
            value={filters.interval}
            options={INTERVALS}
            onChange={(value) => setFilter('interval', value)}
          />
          <FilterSelect
            label="Currency"
            value={filters.currency}
            options={currencyOptions}
            onChange={(value) => setFilter('currency', value)}
          />
          <FilterSelect
            label="Sort by"
            value={`${filters.sort}:${filters.order}`}
            options={SORTS}
            minWidth={190}
            onChange={(value) => {
              const [sort, order] = value.split(':');
              patchFilters({ sort, order });
            }}
          />
        </Box>

        {filters.attention && (
          <Typography variant="body2" sx={{ px: 2.5, pb: 2, color: 'text.secondary' }}>
            Showing:{' '}
            <Label color="warning">
              {ATTENTION.find((item) => item.key === filters.attention)?.label}
            </Label>{' '}
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => setFilter('attention', '')}
            >
              Clear
            </Link>
          </Typography>
        )}

        <TableContainer
          sx={{ opacity: loading && !waiting ? 0.55 : 1, transition: 'opacity 160ms' }}
        >
          <Table sx={{ minWidth: 1040 }}>
            <TableHead>
              <TableRow>
                <TableCell>Workspace</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell sx={{ minWidth: 150 }}>Seats used / bought</TableCell>
                <TableCell align="right">Price per seat</TableCell>
                <TableCell align="right">MRR</TableCell>
                <TableCell>Next</TableCell>
                <TableCell>Razorpay</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableState
                colSpan={COLUMN_COUNT}
                loading={waiting}
                empty={!loading && rows.length === 0}
                title={filtered ? 'No subscriptions match' : 'No subscriptions yet'}
                hint={filtered ? 'Try a different search or clear the filters.' : undefined}
              />
              {rows.map((row) => {
                const { subscription } = row;
                const next = nextEvent(row);
                const paid = subscription.status === 'active' || subscription.status === 'past_due';
                return (
                  <TableRow key={row.workspace.id} hover>
                    <TableCell sx={{ maxWidth: 240 }}>
                      <Link
                        component={RouterLink}
                        href={paths.dashboard.workspaceDetails(row.workspace.id)}
                        color="inherit"
                        underline="hover"
                        variant="subtitle2"
                        noWrap
                      >
                        {row.workspace.name}
                      </Link>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ display: 'block', color: 'text.secondary' }}
                      >
                        {row.owner?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusLabel status={subscription.status} />
                      {subscription.cancel_at_period_end && (
                        <Label color="warning" sx={{ ml: 0.5 }}>
                          Cancelling
                        </Label>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{subscription.plan_name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {paid
                          ? `${subscription.interval === 'year' ? 'Yearly' : 'Monthly'} · ${subscription.currency}`
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ mb: 0.5, fontVariantNumeric: 'tabular-nums' }}
                      >
                        {fInt(row.seats_used)}
                        {subscription.seats ? ` / ${fInt(subscription.seats)}` : ''}
                      </Typography>
                      <UsageMeter
                        dense
                        value={row.seats_used}
                        limit={subscription.seats ?? null}
                        label="Seats"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {row.unit_amount_minor
                        ? fMoney(row.unit_amount_minor, subscription.currency, { exact: true })
                        : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {row.mrr_minor
                        ? fMoney(row.mrr_minor, subscription.currency, { exact: true })
                        : '—'}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2">{next.primary}</Typography>
                      <Typography variant="caption" sx={{ color: next.tone ?? 'text.secondary' }}>
                        {next.secondary}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 190 }}>
                      <CopyText
                        value={subscription.razorpay_subscription_id}
                        label="Subscription id"
                      />
                      {subscription.last_event_at && (
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', color: 'text.secondary' }}
                        >
                          event {fAgo(subscription.last_event_at)}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
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

      <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
        MRR is contracted: seats bought x the plan&apos;s current list price (yearly prices spread
        over 12 months). A lapsed trial reads as Free. To change plans, prices or switch billing on
        or off, use{' '}
        <Link component={RouterLink} href={paths.dashboard.billing} underline="hover">
          Billing setup
        </Link>
        .
      </Typography>
    </DashboardContent>
  );
}
