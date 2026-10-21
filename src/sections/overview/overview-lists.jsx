import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';

import { fAgo, fMoney, daysUntil, fInt } from 'src/utils/admin-format';

import { MiniTable } from 'src/sections/admin/mini-table';
import { OwnerStatusLabel } from 'src/sections/owner/owner-status-label';
import { fAction, CATEGORY_COLORS, describeAction } from 'src/sections/admin/audit-utils';
import { PaymentStatusLabel, SubscriptionStatusLabel } from 'src/sections/admin/status-labels';

// ----------------------------------------------------------------------

const WorkspaceLink = ({ workspace }) => (
  <Stack sx={{ minWidth: 0 }}>
    <Link
      component={RouterLink}
      href={paths.dashboard.workspaceDetails(workspace.id)}
      color="inherit"
      underline="hover"
      variant="subtitle2"
      noWrap
    >
      {workspace.name || `Workspace ${workspace.id}`}
    </Link>
    {workspace.subdomain && (
      <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
        {workspace.subdomain}
      </Typography>
    )}
  </Stack>
);

export function TopWorkspacesCard({ report }) {
  return (
    <MiniTable
      title="Largest workspaces"
      subheader="By active seats"
      href={`${paths.dashboard.workspaces}`}
      loading={report.loading}
      rows={report.rows}
      empty="No workspaces yet"
      columns={[
        { key: 'name', label: 'Workspace', render: (row) => <WorkspaceLink workspace={row} /> },
        {
          key: 'plan',
          label: 'Plan',
          render: (row) => <SubscriptionStatusLabel status={row.subscription.status} />,
        },
        { key: 'seats', label: 'Seats', align: 'right', render: (row) => fInt(row.seats_used) },
        {
          key: 'mrr',
          label: 'MRR',
          align: 'right',
          render: (row) =>
            row.mrr_minor
              ? fMoney(row.mrr_minor, row.subscription.currency, { compact: true })
              : '—',
        },
      ]}
    />
  );
}

export function RecentSignupsCard({ report }) {
  return (
    <MiniTable
      title="Latest signups"
      subheader="Newest owners first"
      href={paths.dashboard.owners}
      loading={report.loading}
      rows={report.rows}
      empty="No signups yet"
      columns={[
        {
          key: 'name',
          label: 'Owner',
          render: (row) => (
            <Stack sx={{ minWidth: 0 }}>
              <Link
                component={RouterLink}
                href={paths.dashboard.ownerDetails(row.id)}
                color="inherit"
                underline="hover"
                variant="subtitle2"
                noWrap
              >
                {row.name || row.email}
              </Link>
              <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
                {row.email}
              </Typography>
            </Stack>
          ),
        },
        { key: 'status', label: 'Status', render: (row) => <OwnerStatusLabel owner={row} /> },
        { key: 'when', label: 'Signed up', align: 'right', render: (row) => fAgo(row.created_at) },
      ]}
    />
  );
}

function attentionDetail(row) {
  const { subscription } = row;
  if (subscription.status === 'past_due') return { text: 'Payment failing', tone: 'error' };

  const days = daysUntil(subscription.trial_ends_at);
  if (days !== null)
    return { text: days <= 0 ? 'Trial ends today' : `Trial ends in ${days} d`, tone: 'warning' };

  return { text: '—', tone: 'default' };
}

export function NeedsAttentionCard({ rows, loading }) {
  return (
    <MiniTable
      title="Follow up"
      subheader="Past-due subscriptions and trials about to end"
      href={paths.dashboard.subscriptions}
      loading={loading}
      rows={rows}
      empty="Nobody to chase right now"
      columns={[
        {
          key: 'name',
          label: 'Workspace',
          render: (row) => <WorkspaceLink workspace={row.workspace} />,
        },
        {
          key: 'issue',
          label: 'Issue',
          render: (row) => {
            const detail = attentionDetail(row);
            return <Label color={detail.tone}>{detail.text}</Label>;
          },
        },
        { key: 'owner', label: 'Owner', render: (row) => row.owner?.email ?? '—' },
        {
          key: 'seats',
          label: 'Seats',
          align: 'right',
          render: (row) => fInt(row.seats_used),
        },
      ]}
    />
  );
}

export function RecentPaymentsCard({ report }) {
  return (
    <MiniTable
      title="Latest payments"
      href={paths.dashboard.payments}
      loading={report.loading}
      rows={report.rows}
      empty="No payments yet"
      columns={[
        {
          key: 'workspace',
          label: 'Workspace',
          render: (row) => <WorkspaceLink workspace={row.workspace} />,
        },
        {
          key: 'status',
          label: 'Status',
          render: (row) => <PaymentStatusLabel status={row.status} />,
        },
        {
          key: 'amount',
          label: 'Amount',
          align: 'right',
          render: (row) => fMoney(row.amount_minor, row.currency, { exact: true }),
        },
        {
          key: 'when',
          label: 'When',
          align: 'right',
          render: (row) => fAgo(row.paid_at ?? row.created_at),
        },
      ]}
    />
  );
}

export function RecentActivityCard({ report }) {
  return (
    <MiniTable
      title="Recent admin activity"
      subheader="Changes made in this console"
      href={paths.dashboard.auditLogs}
      loading={report.loading}
      rows={report.rows}
      empty="No activity yet"
      columns={[
        {
          key: 'action',
          label: 'Action',
          maxWidth: 280,
          render: (row) => (
            <Label color={CATEGORY_COLORS[row.category] ?? 'default'} title={row.action}>
              {fAction(row.action)}
            </Label>
          ),
        },
        {
          key: 'target',
          label: 'Target',
          render: (row) => row.target_label ?? row.target_id ?? describeAction(row.action).area,
        },
        { key: 'admin', label: 'By', render: (row) => row.admin?.name ?? 'System' },
        { key: 'when', label: 'When', align: 'right', render: (row) => fAgo(row.created_at) },
      ]}
    />
  );
}
