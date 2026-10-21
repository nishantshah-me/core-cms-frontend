'use client';

import { useState } from 'react';

import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Refresh as RefreshIcon } from '@mui/icons-material';

import { DashboardContent } from 'src/layouts/dashboard';

import { fAgo } from 'src/utils/admin-format';

import { listOwners } from 'src/auth/services/adminOwnerService';
import {
  getGrowth,
  getFunnel,
  getOverview,
  listPayments,
  getEngagement,
  listAuditLogs,
  listWorkspaces,
  getDistribution,
  listSubscriptions,
} from 'src/auth/services/adminReportsService';

import { useReport } from 'src/sections/admin/use-report';
import { PageHeader } from 'src/sections/admin/page-header';
import { ReportError } from 'src/sections/admin/report-error';
import { RangeFilter } from 'src/sections/admin/range-filter';
import {
  PlansCard,
  FunnelCard,
  GrowthCard,
  RevenueCard,
  IndustryCard,
  ConversionCard,
  EngagementCard,
  SubscriptionMixCard,
} from 'src/sections/admin/report-cards';

import { OverviewKpis } from './overview-kpis';
import { OverviewAttention } from './overview-attention';
import {
  TopWorkspacesCard,
  RecentSignupsCard,
  RecentPaymentsCard,
  NeedsAttentionCard,
  RecentActivityCard,
} from './overview-lists';

// ----------------------------------------------------------------------

export function OverviewView() {
  const [days, setDays] = useState(30);
  const [chosenCurrency, setCurrency] = useState(null);

  const overview = useReport(() => getOverview(days), days);
  const growth = useReport(() => getGrowth(days), days);
  const engagement = useReport(() => getEngagement(days), days);
  const distribution = useReport(() => getDistribution(), 'distribution');
  const funnel = useReport(() => getFunnel(Math.max(days, 30)), days);

  const topWorkspaces = useReport(
    () => listWorkspaces({ sort: 'seats', order: 'desc', limit: 6 }),
    'top'
  );
  const signups = useReport(() => listOwners({ limit: 6 }), 'signups');
  const payments = useReport(() => listPayments({ limit: 6 }), 'payments');
  const activity = useReport(() => listAuditLogs({ limit: 6 }), 'activity');
  const pastDue = useReport(
    () => listSubscriptions({ attention: 'past_due', limit: 5 }),
    'past-due'
  );
  const trialsEnding = useReport(
    () =>
      listSubscriptions({ attention: 'trial_ending', sort: 'trial_ends', order: 'asc', limit: 5 }),
    'trials'
  );

  const data = overview.data;
  const currencies = data?.currencies?.length ? data.currencies : ['INR'];
  const currency =
    chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0];

  const reloadAll = () =>
    [
      overview,
      growth,
      engagement,
      distribution,
      funnel,
      topWorkspaces,
      signups,
      payments,
      activity,
      pastDue,
      trialsEnding,
    ].forEach((report) => report.reload());

  const followUp = [...pastDue.rows, ...trialsEnding.rows];
  const busy = overview.loading || growth.loading;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Platform overview"
        subtitle="Customers, revenue and product usage across every workspace, and what needs you today."
        actions={
          <>
            {overview.updatedAt && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Updated {fAgo(overview.updatedAt.toISOString())}
              </Typography>
            )}
            <RangeFilter value={days} onChange={setDays} />
            <Tooltip title="Refresh everything">
              <span>
                <IconButton onClick={reloadAll} disabled={busy} aria-label="Refresh">
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </>
        }
      />

      <ReportError error={overview.error} onRetry={overview.reload} />

      {data ? (
        <>
          <OverviewAttention attention={data.attention} />
          <OverviewKpis
            overview={data}
            growth={growth.data}
            engagement={engagement.data}
            currency={currency}
            loading={overview.loading}
          />
        </>
      ) : (
        !overview.error && <Skeleton variant="rounded" height={420} sx={{ mb: 4 }} />
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <GrowthCard growth={growth.data} loading={growth.loading} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SubscriptionMixCard distribution={distribution.data} loading={distribution.loading} />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <RevenueCard
            growth={growth.data}
            currency={currency}
            currencies={currencies}
            onCurrency={setCurrency}
            loading={growth.loading}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <PlansCard distribution={distribution.data} loading={distribution.loading} />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <ConversionCard growth={growth.data} loading={growth.loading} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <FunnelCard funnel={funnel.data} loading={funnel.loading} />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <EngagementCard engagement={engagement.data} loading={engagement.loading} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <IndustryCard distribution={distribution.data} loading={distribution.loading} />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <TopWorkspacesCard report={topWorkspaces} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <RecentSignupsCard report={signups} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <NeedsAttentionCard rows={followUp} loading={pastDue.loading || trialsEnding.loading} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <RecentPaymentsCard report={payments} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <RecentActivityCard report={activity} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
