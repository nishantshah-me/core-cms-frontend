'use client';

import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { Refresh as RefreshIcon } from '@mui/icons-material';

import { DashboardContent } from 'src/layouts/dashboard';

import {
  getGrowth,
  getFunnel,
  getOverview,
  getCohorts,
  getAdoption,
  getEngagement,
  getDistribution,
} from 'src/auth/services/adminReportsService';

import { useReport } from 'src/sections/admin/use-report';
import { PageHeader } from 'src/sections/admin/page-header';
import { ReportError } from 'src/sections/admin/report-error';
import { RangeFilter } from 'src/sections/admin/range-filter';

import { GrowthTab } from './growth-tab';
import { AdoptionTab } from './adoption-tab';
import { RetentionTab } from './retention-tab';
import { EngagementTab } from './engagement-tab';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'growth', label: 'Growth and revenue' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'adoption', label: 'Module adoption' },
  { value: 'retention', label: 'Retention and funnel' },
];

export function AnalyticsView() {
  const [tab, setTab] = useState('growth');
  const [days, setDays] = useState(90);
  const [months, setMonths] = useState(6);
  const [chosenCurrency, setCurrency] = useState(null);

  // Only what the open tab needs is requested.
  const overview = useReport(() => getOverview(days), days, { enabled: tab === 'growth' });
  const growth = useReport(() => getGrowth(days), days, { enabled: tab === 'growth' });
  const distribution = useReport(() => getDistribution(), 'distribution', {
    enabled: tab === 'growth',
  });
  const funnel = useReport(() => getFunnel(days), days, {
    enabled: tab === 'growth' || tab === 'retention',
  });
  const engagement = useReport(() => getEngagement(days), days, { enabled: tab === 'engagement' });
  const adoption = useReport(() => getAdoption(days), days, { enabled: tab === 'adoption' });
  const cohorts = useReport(() => getCohorts(months), months, { enabled: tab === 'retention' });

  const currencies = overview.data?.currencies?.length
    ? overview.data.currencies
    : growth.data?.currencies?.length
      ? growth.data.currencies
      : ['INR'];
  const currency =
    chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0];

  const active = { growth, engagement, adoption, retention: cohorts }[tab];
  const error = active.error || (tab === 'growth' ? overview.error : '');
  const reload = () =>
    [overview, growth, distribution, funnel, engagement, adoption, cohorts].forEach((report) =>
      report.reload()
    );

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Analytics"
        subtitle="Growth, revenue, how the product is used, and whether customers stay."
        actions={
          <>
            {tab !== 'retention' && <RangeFilter value={days} onChange={setDays} />}
            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={reload} aria-label="Refresh">
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </>
        }
      />

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.vars.palette.divider}` }}
      >
        {TABS.map((item) => (
          <Tab key={item.value} value={item.value} label={item.label} />
        ))}
      </Tabs>

      <ReportError error={error} onRetry={reload} />

      <Box>
        {tab === 'growth' && (
          <GrowthTab
            growth={growth}
            distribution={distribution}
            funnel={funnel}
            currencies={currencies}
            currency={currency}
            onCurrency={setCurrency}
          />
        )}
        {tab === 'engagement' && <EngagementTab engagement={engagement} />}
        {tab === 'adoption' && <AdoptionTab adoption={adoption} />}
        {tab === 'retention' && (
          <RetentionTab cohorts={cohorts} funnel={funnel} months={months} onMonths={setMonths} />
        )}
      </Box>
    </DashboardContent>
  );
}
