'use client';

import { useState, useEffect, useCallback } from 'react';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { LogoLoader } from 'src/components/loading-screen/LogoLoader';

import { getBilling, getErrorMessage } from 'src/auth/services/adminBillingService';

import { BillingPlansCard } from './billing-plans-card';
import { BillingSwitchCard } from './billing-switch-card';
import { BillingSettingsCard } from './billing-settings-card';
import { BillingRazorpayCard } from './billing-razorpay-card';

// ----------------------------------------------------------------------

export function BillingView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await getBilling());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load the billing configuration.'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} color="inherit" href={paths.dashboard.root} underline="hover">
          Dashboard
        </Link>
        <Typography color="text.primary">Billing</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 3 }}>
        Billing
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={load}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!data && !error && <LogoLoader sx={{ height: '60vh' }} />}

      {data && (
        // Every mutation answers with the refreshed overview, which replaces the page state as is.
        <Stack spacing={3}>
          <BillingSwitchCard data={data} onChange={setData} />
          <BillingSettingsCard data={data} onChange={setData} />
          <BillingPlansCard data={data} onChange={setData} />
          <BillingRazorpayCard data={data} onSynced={load} />
        </Stack>
      )}
    </Container>
  );
}
