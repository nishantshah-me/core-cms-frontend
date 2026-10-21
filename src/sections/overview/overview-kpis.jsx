import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import {
  Group as PeopleIcon,
  Login as LoginIcon,
  Payments as PaymentsIcon,
  Business as CompanyIcon,
  TrendingUp as GrowthIcon,
  Percent as PercentIcon,
  PersonOff as ChurnIcon,
  CreditCardOff as FailedIcon,
  Workspaces as WorkspaceIcon,
  AccountBalance as CollectedIcon,
  VerifiedUser as OwnerIcon,
  SupportAgent as ActiveIcon,
} from '@mui/icons-material';

import { paths } from 'src/routes/paths';

import { fInt, fMoney, fCompact, fPercent } from 'src/utils/admin-format';

import { StatTile } from 'src/sections/admin/stat-tile';
import { pluck, cumulative, pluckRevenue, downsample } from 'src/sections/admin/chart-helpers';

// ----------------------------------------------------------------------

const SIZE = { xs: 12, sm: 6, md: 4, xl: 2 };

function Section({ title, children }) {
  return (
    <>
      <Typography variant="overline" sx={{ mb: 1.5, display: 'block', color: 'text.secondary' }}>
        {title}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {children}
      </Grid>
    </>
  );
}

const tile = (node) => (
  <Grid size={SIZE} key={node.key}>
    {node}
  </Grid>
);

/**
 * The two rows of headline numbers. `overview` is the platform report; `growth` and `engagement` only feed the trend
 * lines. Revenue is shown in one currency at a time: rupees and dollars are never added together.
 */
export function OverviewKpis({ overview, growth, engagement, currency, loading }) {
  const { totals, period, revenue, trials, subscriptions, days } = overview;
  const money = revenue[currency] ?? {
    mrr_minor: 0,
    arr_minor: 0,
    paying_workspaces: 0,
    arpw_minor: null,
    collected: { current: 0, previous: 0 },
    refunded: { current: 0, previous: 0 },
  };
  const points = growth?.points ?? [];
  const periodLabel = `the previous ${days} days`;

  return (
    <>
      <Section title={`Revenue · ${currency}`}>
        {tile(
          <StatTile
            key="mrr"
            label="Monthly recurring revenue"
            value={fMoney(money.mrr_minor, currency, { compact: true })}
            hint={`ARR ${fMoney(money.arr_minor, currency, { compact: true })} · contracted`}
            icon={<PaymentsIcon />}
            href={paths.dashboard.subscriptions}
            loading={loading}
          />
        )}
        {tile(
          <StatTile
            key="collected"
            label={`Collected, last ${days} days`}
            value={fMoney(money.collected.current, currency, { compact: true })}
            delta={{
              current: money.collected.current,
              previous: money.collected.previous,
              period: periodLabel,
              format: (v) => fMoney(v, currency, { compact: true }),
            }}
            hint={
              money.refunded.current
                ? `${fMoney(money.refunded.current, currency, { compact: true })} refunded`
                : undefined
            }
            trend={growth ? downsample(pluckRevenue(points, currency)) : undefined}
            icon={<CollectedIcon />}
            href={paths.dashboard.payments}
            loading={loading}
          />
        )}
        {tile(
          <StatTile
            key="paying"
            label="Paying workspaces"
            value={fInt(money.paying_workspaces)}
            hint={
              money.arpw_minor
                ? `${fMoney(money.arpw_minor, currency, { compact: true })} avg / month`
                : `${fInt(subscriptions.paying)} across all currencies`
            }
            icon={<WorkspaceIcon />}
            href={`${paths.dashboard.subscriptions}?status=active`}
            loading={loading}
          />
        )}
        {tile(
          <StatTile
            key="newpaid"
            label="New paying customers"
            value={fInt(period.new_paid.current)}
            delta={{ ...period.new_paid, period: periodLabel }}
            trend={growth ? downsample(pluck(points, 'new_paid')) : undefined}
            icon={<GrowthIcon />}
            loading={loading}
          />
        )}
        {tile(
          <StatTile
            key="conversion"
            label="Trial to paid"
            value={
              trials.conversion_rate.current === null
                ? '—'
                : fPercent(trials.conversion_rate.current, 0)
            }
            hint={`${fInt(trials.converted.current)} converted · ${fInt(trials.expired.current)} lapsed`}
            delta={
              trials.conversion_rate.current !== null && trials.conversion_rate.previous !== null
                ? {
                    current: trials.conversion_rate.current,
                    previous: trials.conversion_rate.previous,
                    period: periodLabel,
                    format: (v) => fPercent(v, 0),
                  }
                : undefined
            }
            icon={<PercentIcon />}
            loading={loading}
          />
        )}
        {tile(
          <StatTile
            key="churn"
            label="Churned"
            value={fInt(period.churned.current)}
            delta={{ ...period.churned, goodWhen: 'down', period: periodLabel }}
            hint={
              subscriptions.cancelling
                ? `${fInt(subscriptions.cancelling)} cancelling at period end`
                : undefined
            }
            trend={growth ? downsample(pluck(points, 'churned')) : undefined}
            trendColor="var(--chart-critical)"
            tone={period.churned.current > period.new_paid.current ? 'warning' : 'default'}
            icon={<ChurnIcon />}
            loading={loading}
          />
        )}
      </Section>

      <Section title="Customers and usage">
        {tile(
          <StatTile
            key="workspaces"
            label="Workspaces"
            value={fInt(totals.workspaces)}
            delta={{ ...period.new_workspaces, period: periodLabel }}
            hint={`${fInt(totals.workspaces_verified)} verified`}
            trend={
              growth
                ? downsample(
                    cumulative(pluck(points, 'workspaces'), growth.base.workspaces),
                    12,
                    'last'
                  )
                : undefined
            }
            icon={<WorkspaceIcon />}
            href={paths.dashboard.workspaces}
            loading={loading}
          />
        )}
        {tile(
          <StatTile
            key="owners"
            label="Owners"
            value={fInt(totals.owners_approved)}
            delta={{ ...period.new_owners, period: periodLabel }}
            hint={
              totals.owners_pending
                ? `${fInt(totals.owners_pending)} awaiting review`
                : `${fInt(totals.owners_rejected)} rejected`
            }
            tone={totals.owners_pending ? 'warning' : 'default'}
            trend={
              growth
                ? downsample(cumulative(pluck(points, 'owners'), growth.base.owners), 12, 'last')
                : undefined
            }
            icon={<OwnerIcon />}
            href={paths.dashboard.owners}
            loading={loading}
          />
        )}
        {tile(
          <StatTile
            key="companies"
            label="Companies"
            value={fInt(totals.companies)}
            hint={`${(totals.companies / Math.max(totals.workspaces, 1)).toFixed(1)} per workspace`}
            icon={<CompanyIcon />}
            href={paths.dashboard.companies}
            loading={loading}
          />
        )}
        {tile(
          <StatTile
            key="seats"
            label="Active seats"
            value={fCompact(totals.active_seats)}
            delta={{ ...period.new_people, period: periodLabel }}
            hint={`${fInt(period.new_people.current)} people added`}
            trend={growth ? downsample(pluck(points, 'people')) : undefined}
            icon={<PeopleIcon />}
            loading={loading}
          />
        )}
        {tile(
          <StatTile
            key="active"
            label="Active workspaces"
            value={fInt(period.active_workspaces.current)}
            delta={{ ...period.active_workspaces, period: periodLabel }}
            hint={`${fPercent((period.active_workspaces.current * 100) / Math.max(totals.workspaces, 1), 0)} of all · ${fInt(period.active_users.current)} people`}
            trend={
              engagement
                ? downsample(engagement.daily.map((day) => day.active_workspaces))
                : undefined
            }
            icon={<ActiveIcon />}
            href={paths.dashboard.analytics}
            loading={loading}
          />
        )}
        {tile(
          <StatTile
            key="logins"
            label="Logins"
            value={fCompact(period.logins.current)}
            delta={{ ...period.logins, period: periodLabel }}
            hint={
              engagement?.totals?.stickiness != null
                ? `${fPercent(engagement.totals.stickiness, 0)} daily / monthly`
                : undefined
            }
            trend={engagement ? downsample(engagement.daily.map((day) => day.logins)) : undefined}
            icon={<LoginIcon />}
            href={paths.dashboard.analytics}
            loading={loading}
          />
        )}
        {period.failed_payments.current > 0 &&
          tile(
            <StatTile
              key="failed"
              label="Failed payments"
              value={fInt(period.failed_payments.current)}
              delta={{ ...period.failed_payments, goodWhen: 'down', period: periodLabel }}
              tone="error"
              icon={<FailedIcon />}
              href={`${paths.dashboard.payments}?status=failed`}
              loading={loading}
            />
          )}
      </Section>
    </>
  );
}
