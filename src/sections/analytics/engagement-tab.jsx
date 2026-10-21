'use client';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import {
  Login as LoginIcon,
  Today as TodayIcon,
  Group as PeopleIcon,
  Security as SecurityIcon,
  DateRange as WeekIcon,
  Autorenew as StickyIcon,
  CalendarMonth as MonthIcon,
  Workspaces as WorkspaceIcon,
} from '@mui/icons-material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { HBarList, ChartCard, DonutChart, HourHeatmap, seriesColor } from 'src/components/chart';

import { fInt, fPercent } from 'src/utils/admin-format';

import { StatTile } from 'src/sections/admin/stat-tile';
import { EngagementCard } from 'src/sections/admin/report-cards';

// ----------------------------------------------------------------------

/** "UTC+5:30": the viewer's offset, which the heatmap is shifted to. */
function utcOffsetLabel() {
  const offset = -new Date().getTimezoneOffset();
  const abs = Math.abs(offset);
  const minutes = abs % 60 ? `:${String(abs % 60).padStart(2, '0')}` : '';

  return `UTC${offset < 0 ? '−' : '+'}${Math.floor(abs / 60)}${minutes}`;
}

const toSlices = (items, offset = 0) =>
  (items ?? []).map((item, index) => ({
    key: item.key,
    label: item.label,
    value: item.count,
    color:
      item.key === 'Other' || item.key === 'Unknown'
        ? 'var(--chart-neutral)'
        : seriesColor(index + offset),
  }));

function BreakdownCard({ title, subheader, items, loading, unit }) {
  const slices = toSlices(items);

  return (
    <ChartCard
      title={title}
      subheader={subheader}
      loading={loading}
      table={{
        columns: [
          { key: 'label', label: title },
          { key: 'value', label: unit, align: 'right' },
        ],
        rows: slices,
      }}
    >
      <DonutChart slices={slices} caption={unit} size={148} thickness={20} />
    </ChartCard>
  );
}

/** How the product is actually used: who signs in, when, from what, and where. */
export function EngagementTab({ engagement }) {
  const { data, loading } = engagement;
  const totals = data?.totals;

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Active today"
            value={fInt(totals?.dau)}
            hint="people in the last 24 hours"
            icon={<TodayIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Active this week"
            value={fInt(totals?.wau)}
            hint="people in the last 7 days"
            icon={<WeekIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Active this month"
            value={fInt(totals?.mau)}
            hint="people in the last 30 days"
            icon={<MonthIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Stickiness"
            value={totals?.stickiness == null ? '—' : fPercent(totals.stickiness, 0)}
            hint="of monthly people came back today"
            icon={<StickyIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label={data ? `Logins, ${data.days} days` : 'Logins'}
            value={fInt(totals?.logins)}
            icon={<LoginIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Active people"
            value={fInt(totals?.active_users)}
            hint="signed in at least once"
            icon={<PeopleIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Active workspaces"
            value={fInt(totals?.active_workspaces)}
            hint="with a sign-in in the range"
            icon={<WorkspaceIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile
            label="Logins from VPN / proxy"
            value={fInt(totals?.suspicious_logins)}
            hint="flagged by network lookup"
            tone={totals?.suspicious_logins ? 'warning' : 'default'}
            icon={<SecurityIcon />}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <EngagementCard engagement={data} loading={loading} />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard
            title="When people sign in"
            subheader={`Logins by weekday and hour, in your timezone (${utcOffsetLabel()})`}
            loading={loading}
            empty={
              data && data.heatmap.every((cell) => cell.count === 0)
                ? 'No logins in this range.'
                : undefined
            }
          >
            {data && <HourHeatmap cells={data.heatmap} />}
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ChartCard
            title="Most active workspaces"
            subheader="By logins in the range"
            loading={loading}
          >
            <HBarList
              items={(data?.top_workspaces ?? []).map((row) => ({
                key: String(row.workspace_id),
                label: row.name || `Workspace ${row.workspace_id}`,
                value: row.logins,
                caption: `${row.active_users} people`,
                href: paths.dashboard.workspaceDetails(row.workspace_id),
              }))}
              empty="No activity in this range"
            />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <BreakdownCard
            title="Devices"
            subheader="Logins by device type"
            items={data?.devices}
            loading={loading}
            unit="Logins"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <BreakdownCard
            title="Browsers"
            subheader="Logins by browser"
            items={data?.browsers}
            loading={loading}
            unit="Logins"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <BreakdownCard
            title="Operating systems"
            subheader="Logins by system"
            items={data?.systems}
            loading={loading}
            unit="Logins"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <ChartCard title="Countries" subheader="Where logins come from" loading={loading}>
            <HBarList
              items={(data?.countries ?? []).map((row) => ({
                key: row.key,
                label: row.label,
                value: row.count,
              }))}
              empty="No logins in this range"
            />
          </ChartCard>
        </Grid>
      </Grid>

      <Typography variant="caption" sx={{ mt: 3, display: 'block', color: 'text.secondary' }}>
        Activity means a successful sign-in recorded in the login log. People in more than one
        workspace count for each of them.{' '}
        <Link component={RouterLink} href={paths.dashboard.workspaces} underline="hover">
          Browse workspaces
        </Link>
      </Typography>
    </>
  );
}
