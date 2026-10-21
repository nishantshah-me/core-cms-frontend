'use client';

import Grid from '@mui/material/Grid';

import {
  PlansCard,
  FunnelCard,
  GrowthCard,
  RevenueCard,
  IndustryCard,
  TeamSizeCard,
  ConversionCard,
  CompanySizeCard,
  SubscriptionMixCard,
} from 'src/sections/admin/report-cards';

// ----------------------------------------------------------------------

/** Who signed up, who paid, who left, and what the customer base looks like. */
export function GrowthTab({ growth, distribution, funnel, currencies, currency, onCurrency }) {
  return (
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
          onCurrency={onCurrency}
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

      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <IndustryCard distribution={distribution.data} loading={distribution.loading} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <CompanySizeCard distribution={distribution.data} loading={distribution.loading} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <TeamSizeCard distribution={distribution.data} loading={distribution.loading} />
      </Grid>
    </Grid>
  );
}
