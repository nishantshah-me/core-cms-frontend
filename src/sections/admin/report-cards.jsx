'use client';

import { useState } from 'react';

import Skeleton from '@mui/material/Skeleton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import {
  HBarList,
  BarChart,
  AreaChart,
  ChartCard,
  DonutChart,
  FunnelChart,
  seriesColor,
} from 'src/components/chart';

import { fInt, fMoney } from 'src/utils/admin-format';

import { SUBSCRIPTION_STATUS_META } from './status-labels';
import { pluck, cumulative, pluckRevenue, bucketCategories } from './chart-helpers';

// ----------------------------------------------------------------------

// Each industry keeps its colour whatever else is on screen (colour follows the entity, not its rank).
const INDUSTRY_SLOT = {
  'IT Services': 0,
  Healthcare: 2,
  Finance: 1,
  Education: 3,
  Manufacturing: 6,
  Others: 4,
  'Not set': null,
};

const SIZE_SLOT = { '1-50': 0, '51-100': 1, '101-500': 2, '501-1000': 3, '1000+': 4 };

/** Keep the biggest `limit` slices and fold the rest into "Other", so a donut never grows past six segments. */
export function foldTail(items, limit = 5) {
  if (items.length <= limit + 1) return items;
  const head = items.slice(0, limit);
  const tail = items.slice(limit).reduce((total, item) => total + item.count, 0);
  return [...head, { key: 'other', label: 'Other', count: tail }];
}

const Pending = ({ height = 240 }) => <Skeleton variant="rounded" height={height} />;

// ── Time series ──────────────────────────────────────────────────────────

const BUCKET_NOUN = { day: 'day', week: 'week', month: 'month' };

export function GrowthCard({ growth, loading }) {
  const [mode, setMode] = useState('period');

  const points = growth?.points ?? [];
  const categories = bucketCategories(points, growth?.bucket);
  const running = mode === 'total';
  const rows = points.map((p, i) => ({
    key: p.date,
    period: categories[i].title,
    owners: p.owners,
    workspaces: p.workspaces,
    trials_started: p.trials_started,
    people: p.people,
  }));

  const series = running
    ? [
        {
          key: 'owners',
          label: 'Owners (total)',
          values: cumulative(pluck(points, 'owners'), growth?.base.owners),
        },
        {
          key: 'workspaces',
          label: 'Workspaces (total)',
          values: cumulative(pluck(points, 'workspaces'), growth?.base.workspaces),
        },
      ]
    : [
        { key: 'owners', label: 'Owner signups', values: pluck(points, 'owners') },
        { key: 'workspaces', label: 'Workspaces created', values: pluck(points, 'workspaces') },
        { key: 'trials', label: 'Trials started', values: pluck(points, 'trials_started') },
      ];

  return (
    <ChartCard
      title="Signups and new workspaces"
      subheader={
        growth
          ? `${running ? 'Running totals' : `Per ${BUCKET_NOUN[growth.bucket]}`}, last ${growth.days} days`
          : ' '
      }
      loading={loading}
      action={
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_, next) => next && setMode(next)}
          aria-label="Per period or running total"
        >
          <ToggleButton value="period" sx={{ px: 1.25 }}>
            New
          </ToggleButton>
          <ToggleButton value="total" sx={{ px: 1.25 }}>
            Total
          </ToggleButton>
        </ToggleButtonGroup>
      }
      table={{
        columns: [
          { key: 'period', label: 'Period' },
          { key: 'owners', label: 'Owner signups', align: 'right' },
          { key: 'workspaces', label: 'Workspaces', align: 'right' },
          { key: 'trials_started', label: 'Trials started', align: 'right' },
          { key: 'people', label: 'People added', align: 'right' },
        ],
        rows,
      }}
    >
      {growth ? (
        <AreaChart
          categories={categories}
          ariaLabel="Owner signups, workspaces created and trials started over time"
          series={series}
          format={fInt}
        />
      ) : (
        <Pending />
      )}
    </ChartCard>
  );
}

function CurrencyToggle({ currencies, value, onChange }) {
  if (!currencies || currencies.length < 2) return null;

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_, next) => next && onChange(next)}
      aria-label="Currency"
    >
      {currencies.map((code) => (
        <ToggleButton key={code} value={code} sx={{ px: 1.25 }}>
          {code}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export function RevenueCard({ growth, currency, currencies, onCurrency, loading }) {
  const points = growth?.points ?? [];
  const categories = bucketCategories(points, growth?.bucket);
  const values = pluckRevenue(points, currency);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <ChartCard
      title="Revenue collected"
      subheader={
        growth
          ? `${fMoney(total, currency, { compact: true })} in ${growth.days} days, per ${BUCKET_NOUN[growth.bucket]} · captured payments`
          : ' '
      }
      loading={loading}
      action={<CurrencyToggle currencies={currencies} value={currency} onChange={onCurrency} />}
      empty={
        growth && total === 0 ? `No payments collected in ${currency} in this period.` : undefined
      }
      table={{
        columns: [
          { key: 'period', label: 'Period' },
          {
            key: 'amount',
            label: `Collected (${currency})`,
            align: 'right',
            format: (v) => fMoney(v, currency, { exact: true }),
          },
        ],
        rows: points.map((p, i) => ({
          key: p.date,
          period: categories[i].title,
          amount: values[i],
        })),
      }}
    >
      {growth ? (
        <BarChart
          categories={categories}
          ariaLabel={`Revenue collected in ${currency}`}
          series={[{ key: 'revenue', label: `Collected (${currency})`, values }]}
          format={(v) => fMoney(v, currency)}
          axisFormat={(v) => fMoney(v, currency, { compact: true })}
        />
      ) : (
        <Pending />
      )}
    </ChartCard>
  );
}

export function ConversionCard({ growth, loading }) {
  const points = growth?.points ?? [];
  const categories = bucketCategories(points, growth?.bucket);

  return (
    <ChartCard
      title="Customers won and lost"
      subheader={
        growth
          ? `New paying workspaces against workspaces that went back to Free, per ${BUCKET_NOUN[growth.bucket]}`
          : ' '
      }
      loading={loading}
      table={{
        columns: [
          { key: 'period', label: 'Period' },
          { key: 'new_paid', label: 'New paid', align: 'right' },
          { key: 'churned', label: 'Churned', align: 'right' },
        ],
        rows: points.map((p, i) => ({
          key: p.date,
          period: categories[i].title,
          new_paid: p.new_paid,
          churned: p.churned,
        })),
      }}
    >
      {growth ? (
        <BarChart
          categories={categories}
          ariaLabel="New paying workspaces against churned workspaces"
          series={[
            { key: 'new_paid', label: 'New paid', values: pluck(points, 'new_paid'), color: 0 },
            { key: 'churned', label: 'Churned', values: pluck(points, 'churned'), color: 1 },
          ]}
          format={fInt}
        />
      ) : (
        <Pending />
      )}
    </ChartCard>
  );
}

export function EngagementCard({ engagement, loading }) {
  const daily = engagement?.daily ?? [];
  const categories = daily.map((day) => ({
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
    <ChartCard
      title="Daily activity"
      subheader={
        engagement
          ? `Successful logins, people and workspaces active each day, last ${engagement.days} days`
          : ' '
      }
      loading={loading}
      table={{
        columns: [
          { key: 'period', label: 'Day' },
          { key: 'logins', label: 'Logins', align: 'right' },
          { key: 'active_users', label: 'People', align: 'right' },
          { key: 'active_workspaces', label: 'Workspaces', align: 'right' },
        ],
        rows: daily.map((day, i) => ({ key: day.date, period: categories[i].title, ...day })),
      }}
    >
      {engagement ? (
        <AreaChart
          categories={categories}
          ariaLabel="Logins, active people and active workspaces per day"
          series={[
            { key: 'logins', label: 'Logins', values: pluck(daily, 'logins') },
            { key: 'users', label: 'Active people', values: pluck(daily, 'active_users') },
            {
              key: 'workspaces',
              label: 'Active workspaces',
              values: pluck(daily, 'active_workspaces'),
            },
          ]}
          format={fInt}
        />
      ) : (
        <Pending />
      )}
    </ChartCard>
  );
}

// ── Distributions ────────────────────────────────────────────────────────

export function SubscriptionMixCard({ distribution, loading }) {
  const slices = (distribution?.subscription_status ?? []).map((item) => ({
    key: item.key,
    label: SUBSCRIPTION_STATUS_META[item.key]?.label ?? item.key,
    value: item.count,
    color: SUBSCRIPTION_STATUS_META[item.key]?.chart ?? 'var(--chart-neutral)',
  }));

  return (
    <ChartCard
      title="Subscription mix"
      subheader="Every workspace by what it is on today"
      loading={loading}
      table={{
        columns: [
          { key: 'label', label: 'Status' },
          { key: 'value', label: 'Workspaces', align: 'right' },
        ],
        rows: slices,
      }}
    >
      {distribution ? (
        <DonutChart slices={slices} caption="Workspaces" />
      ) : (
        <Pending height={168} />
      )}
    </ChartCard>
  );
}

export function PlansCard({ distribution, loading }) {
  const items = (distribution?.plans ?? []).map((plan) => ({
    key: plan.key,
    label: plan.label,
    value: plan.count,
  }));

  return (
    <ChartCard
      title="Workspaces by plan"
      subheader="Lapsed trials count as Free"
      loading={loading}
      table={{
        columns: [
          { key: 'label', label: 'Plan' },
          { key: 'value', label: 'Workspaces', align: 'right' },
        ],
        rows: items,
      }}
    >
      {distribution ? <HBarList items={items} /> : <Pending height={120} />}
    </ChartCard>
  );
}

export function IndustryCard({ distribution, loading }) {
  const folded = foldTail(distribution?.industry ?? [], 5);
  const slices = folded.map((item, index) => {
    const slot = INDUSTRY_SLOT[item.label];
    return {
      key: item.key,
      label: item.label,
      value: item.count,
      color: slot === null ? 'var(--chart-neutral)' : seriesColor(slot ?? 7 - (index % 2)),
    };
  });

  return (
    <ChartCard
      title="Companies by industry"
      subheader="As the owner described them at signup"
      loading={loading}
      table={{
        columns: [
          { key: 'label', label: 'Industry' },
          { key: 'value', label: 'Companies', align: 'right' },
        ],
        rows: slices,
      }}
    >
      {distribution ? <DonutChart slices={slices} caption="Companies" /> : <Pending height={168} />}
    </ChartCard>
  );
}

export function CompanySizeCard({ distribution, loading }) {
  const items = (distribution?.company_size ?? []).map((item) => ({
    key: item.key,
    label: item.label === 'Not set' ? 'Not set' : `${item.label} employees`,
    value: item.count,
  }));

  return (
    <ChartCard
      title="Companies by size"
      subheader="Employee-count range chosen at signup"
      loading={loading}
      table={{
        columns: [
          { key: 'label', label: 'Size' },
          { key: 'value', label: 'Companies', align: 'right' },
        ],
        rows: items,
      }}
    >
      {distribution ? <HBarList items={items} /> : <Pending height={120} />}
    </ChartCard>
  );
}

export function TeamSizeCard({ distribution, loading }) {
  const items = (distribution?.team_size ?? []).map((item) => ({
    key: item.key,
    label: item.key === 'Empty' ? item.label : `${item.label} seats`,
    value: item.count,
  }));

  return (
    <ChartCard
      title="Workspaces by team size"
      subheader="Active seats today"
      loading={loading}
      table={{
        columns: [
          { key: 'label', label: 'Team size' },
          { key: 'value', label: 'Workspaces', align: 'right' },
        ],
        rows: items,
      }}
    >
      {distribution ? <HBarList items={items} /> : <Pending height={120} />}
    </ChartCard>
  );
}

export function FunnelCard({ funnel, loading }) {
  return (
    <ChartCard
      title="Signup funnel"
      subheader={
        funnel ? `Owners who signed up in the last ${funnel.days} days, and how far they got` : ' '
      }
      loading={loading}
      table={
        funnel && {
          columns: [
            { key: 'label', label: 'Stage' },
            { key: 'count', label: 'Owners', align: 'right', format: fInt },
            {
              key: 'pct_of_signups',
              label: 'Of signups',
              align: 'right',
              format: (v) => (v === null ? '—' : `${v}%`),
            },
            {
              key: 'pct_of_previous',
              label: 'Of previous stage',
              align: 'right',
              format: (v) => (v === null ? '—' : `${v}%`),
            },
          ],
          rows: funnel.stages,
        }
      }
    >
      {funnel ? <FunnelChart stages={funnel.stages} /> : <Pending height={260} />}
    </ChartCard>
  );
}
