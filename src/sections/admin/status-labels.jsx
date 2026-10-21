import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

/** One place that decides what each state is called and which colour it wears, so tables, tabs and charts agree. */
export const SUBSCRIPTION_STATUS_META = {
  active: { label: 'Paying', color: 'success', chart: 'var(--chart-good)' },
  past_due: { label: 'Past due', color: 'error', chart: 'var(--chart-critical)' },
  trialing: { label: 'Trial', color: 'info', chart: 'var(--chart-1)' },
  free: { label: 'Free', color: 'default', chart: 'var(--chart-neutral)' },
  grandfathered: { label: 'Grandfathered', color: 'secondary', chart: 'var(--chart-7)' },
};

export const PAYMENT_STATUS_META = {
  captured: { label: 'Paid', color: 'success', chart: 'var(--chart-good)' },
  failed: { label: 'Failed', color: 'error', chart: 'var(--chart-critical)' },
  refunded: { label: 'Refunded', color: 'secondary', chart: 'var(--chart-7)' },
};

export const WEBHOOK_STATE_META = {
  processed: { label: 'Processed', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
  stuck: { label: 'Stuck', color: 'warning' },
  pending: { label: 'Pending', color: 'default' },
};

function MetaLabel({ meta, value, ...other }) {
  const entry = meta[value] ?? { label: value ?? '—', color: 'default' };
  return (
    <Label color={entry.color} {...other}>
      {entry.label}
    </Label>
  );
}

export const SubscriptionStatusLabel = ({ status, ...other }) => (
  <MetaLabel meta={SUBSCRIPTION_STATUS_META} value={status} {...other} />
);

export const PaymentStatusLabel = ({ status, ...other }) => (
  <MetaLabel meta={PAYMENT_STATUS_META} value={status} {...other} />
);

export const WebhookStateLabel = ({ state, ...other }) => (
  <MetaLabel meta={WEBHOOK_STATE_META} value={state} {...other} />
);
