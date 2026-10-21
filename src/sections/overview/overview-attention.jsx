import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ArrowForward as ArrowIcon } from '@mui/icons-material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { pluralize } from 'src/utils/admin-format';

// ----------------------------------------------------------------------

function items(attention) {
  return [
    {
      key: 'signups',
      severity: 'warning',
      count: attention.pending_signups,
      text: (n) => `${pluralize(n, 'signup')} waiting for your review`,
      href: `${paths.dashboard.owners}?status=pending`,
      action: 'Review',
    },
    {
      key: 'past_due',
      severity: 'error',
      count: attention.past_due,
      text: (n) => `${pluralize(n, 'subscription')} past due`,
      href: `${paths.dashboard.subscriptions}?attention=past_due`,
      action: 'See who',
    },
    {
      key: 'failed',
      severity: 'error',
      count: attention.failed_payments_7d,
      text: (n) => `${pluralize(n, 'payment')} failed in the last 7 days`,
      href: `${paths.dashboard.payments}?status=failed`,
      action: 'Open payments',
    },
    {
      key: 'trials',
      severity: 'info',
      count: attention.trials_ending_soon,
      text: (n) => `${pluralize(n, 'trial')} ending within a week`,
      href: `${paths.dashboard.subscriptions}?attention=trial_ending`,
      action: 'Follow up',
    },
    {
      key: 'webhooks',
      severity: 'error',
      count: attention.webhook_errors_24h + attention.webhooks_stuck,
      text: (n) => `${pluralize(n, 'Razorpay event')} failed or stuck`,
      href: `${paths.dashboard.payments}?tab=events`,
      action: 'Inspect',
    },
    {
      key: 'prices',
      severity: 'warning',
      count: attention.unsynced_prices,
      text: (n) => `${pluralize(n, 'price')} not yet created in Razorpay`,
      href: paths.dashboard.billing,
      action: 'Sync plans',
    },
  ].filter((item) => item.count > 0);
}

/** What needs an operator right now, each with the screen that fixes it. Quiet when nothing does. */
export function OverviewAttention({ attention }) {
  const rows = items(attention);

  if (rows.length === 0) {
    return (
      <Alert severity="success" sx={{ mb: 3 }}>
        All clear: no signups waiting, no failed payments, nothing past due.
      </Alert>
    );
  }

  return (
    <Stack spacing={1} sx={{ mb: 3 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
        Needs attention
      </Typography>
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
        {rows.map((item) => (
          <Alert
            key={item.key}
            severity={item.severity}
            icon={false}
            variant="outlined"
            sx={{ py: 0, alignItems: 'center', '& .MuiAlert-message': { py: 0.75 } }}
            action={
              <Button
                size="small"
                color="inherit"
                component={RouterLink}
                href={item.href}
                endIcon={<ArrowIcon fontSize="small" />}
              >
                {item.action}
              </Button>
            }
          >
            {item.text(item.count)}
          </Alert>
        ))}
      </Stack>
    </Stack>
  );
}
