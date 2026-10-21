'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { DashboardContent } from 'src/layouts/dashboard';

import { PageHeader } from 'src/sections/admin/page-header';

import { EventsTab } from './events-tab';
import { PaymentsTab } from './payments-tab';

// ----------------------------------------------------------------------

export function PaymentsView() {
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') === 'events' ? 'events' : 'payments');

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Payments"
        subtitle="Money collected through Razorpay, and the events it sends us. Amounts stay in their own currency."
        trail={[{ label: 'Payments' }]}
      />

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        sx={{ mb: 3, boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.vars.palette.divider}` }}
      >
        <Tab value="payments" label="Payments" />
        <Tab value="events" label="Razorpay events" />
      </Tabs>

      {tab === 'payments' ? (
        <PaymentsTab
          initial={{
            status: params.get('status') ?? undefined,
            workspaceId: params.get('workspace_id') ?? undefined,
          }}
        />
      ) : (
        <EventsTab initial={{ state: params.get('state') ?? undefined }} />
      )}
    </DashboardContent>
  );
}
