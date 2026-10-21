'use client';

import dayjs from 'dayjs';

import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { HBarList, ChartCard, CohortGrid } from 'src/components/chart';

import { fPercent } from 'src/utils/admin-format';

import { FunnelCard } from 'src/sections/admin/report-cards';

// ----------------------------------------------------------------------

/** Do the workspaces we win keep using the product, and do they pay? Cohorts are grouped by the month a workspace was created. */
export function RetentionTab({ cohorts, funnel, months, onMonths }) {
  const { data, loading } = cohorts;
  const list = data?.cohorts ?? [];

  const rows = list.map((cohort) => ({
    key: cohort.cohort,
    label: dayjs(cohort.cohort).format('MMM YYYY'),
    size: cohort.size,
    values: cohort.retention,
  }));
  const columns = Array.from({ length: data?.months ?? months }, (_, index) =>
    index === 0 ? 'Month 0' : `+${index}`
  );

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, xl: 8 }}>
        <ChartCard
          title="Activity retention"
          subheader="Share of each cohort with at least one sign-in, by months since the workspace was created"
          loading={loading}
          action={
            <ToggleButtonGroup
              exclusive
              size="small"
              value={months}
              onChange={(_, next) => next && onMonths(next)}
              aria-label="Cohort length"
            >
              <ToggleButton value={6} sx={{ px: 1.25 }}>
                6 months
              </ToggleButton>
              <ToggleButton value={12} sx={{ px: 1.25 }}>
                12 months
              </ToggleButton>
            </ToggleButtonGroup>
          }
          empty={
            data && list.every((cohort) => cohort.size === 0)
              ? 'No workspaces were created in these months.'
              : undefined
          }
        >
          {data ? (
            <CohortGrid rows={rows} columns={columns} />
          ) : (
            <Skeleton variant="rounded" height={260} />
          )}
          <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
            Month 0 is the month the workspace was created. Months that have not happened yet are
            blank, not zero.
          </Typography>
        </ChartCard>
      </Grid>

      <Grid size={{ xs: 12, xl: 4 }}>
        <ChartCard
          title="Paying by cohort"
          subheader="Workspaces from each month that are paying today"
          loading={loading}
          table={{
            columns: [
              { key: 'label', label: 'Cohort' },
              { key: 'paying', label: 'Paying', align: 'right' },
              { key: 'size', label: 'Workspaces', align: 'right' },
              { key: 'value', label: 'Share', align: 'right', format: (v) => fPercent(v) },
            ],
            rows: list.map((cohort) => ({
              key: cohort.cohort,
              label: dayjs(cohort.cohort).format('MMM YYYY'),
              paying: cohort.paying,
              size: cohort.size,
              value: cohort.paying_pct ?? 0,
            })),
          }}
        >
          {data ? (
            <HBarList
              max={100}
              format={(v) => fPercent(v, 0)}
              items={list.map((cohort) => ({
                key: cohort.cohort,
                label: dayjs(cohort.cohort).format('MMM YYYY'),
                value: cohort.paying_pct ?? 0,
                caption: `${cohort.paying} of ${cohort.size}`,
              }))}
            />
          ) : (
            <Skeleton variant="rounded" height={200} />
          )}
        </ChartCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <FunnelCard funnel={funnel.data} loading={funnel.loading} />
      </Grid>
    </Grid>
  );
}
