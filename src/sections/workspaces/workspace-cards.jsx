'use client';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import {
  ExpandMore as ExpandIcon,
  OpenInNew as OpenIcon,
  Logout as SignOutIcon,
  LockReset as ResetPasswordIcon,
  PhonelinkLock as TwoFactorIcon,
} from '@mui/icons-material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { CustomPopover } from 'src/components/custom-popover';
import { UsageMeter, ChartCard, AreaChart, HBarList } from 'src/components/chart';

import { fAgo, fInt, fWhen, fMoney, fWhenTime } from 'src/utils/admin-format';

import { MiniTable } from 'src/sections/admin/mini-table';
import { CopyText } from 'src/sections/admin/copy-text';
import { fAction, CATEGORY_COLORS } from 'src/sections/admin/audit-utils';
import { DescriptionList } from 'src/sections/admin/description-list';
import { PaymentStatusLabel, SubscriptionStatusLabel } from 'src/sections/admin/status-labels';

// ----------------------------------------------------------------------

const cardHeaderSlots = { title: { variant: 'subtitle1' }, subheader: { variant: 'caption' } };

function intervalText(subscription) {
  if (!subscription.interval) return null;
  return `${subscription.interval === 'year' ? 'Yearly' : 'Monthly'}${subscription.currency ? ` · ${subscription.currency}` : ''}`;
}

// ── Subscription ─────────────────────────────────────────────────────────

export function SubscriptionCard({ workspace, onChangePlan }) {
  const { subscription } = workspace;
  const lapsed = subscription.stored_status && subscription.stored_status !== subscription.status;
  const trialDays = subscription.trial_days_left;
  const paid = subscription.status === 'active' || subscription.status === 'past_due';

  return (
    <Card sx={{ height: 1 }}>
      <CardHeader
        title="Subscription"
        subheader="What this workspace is on and what it pays"
        action={
          onChangePlan ? (
            <Button size="small" variant="outlined" onClick={onChangePlan}>
              Change plan
            </Button>
          ) : undefined
        }
        slotProps={cardHeaderSlots}
        sx={{ pb: 1 }}
      />
      <CardContent>
        {lapsed && (
          <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'warning.dark' }}>
            The trial ended, so it reads as Free. The stored row still says &ldquo;
            {subscription.stored_status}&rdquo; until the daily job updates it.
          </Typography>
        )}
        <DescriptionList
          items={[
            { label: 'Status', value: <SubscriptionStatusLabel status={subscription.status} /> },
            { label: 'Plan', value: subscription.plan_name },
            { label: 'Billing', value: intervalText(subscription), hidden: !paid },
            {
              label: 'Seats bought',
              value: subscription.seats === null ? null : fInt(subscription.seats),
              hidden: !paid,
            },
            {
              label: 'Contracted MRR',
              value: workspace.mrr_minor
                ? fMoney(workspace.mrr_minor, subscription.currency, { exact: true })
                : null,
              hidden: !paid,
            },
            {
              label: 'Current period',
              value: subscription.current_period_end
                ? `${fWhen(subscription.current_period_start)} → ${fWhen(subscription.current_period_end)}`
                : null,
              hidden: !paid,
            },
            {
              label: 'Trial ends',
              value: subscription.trial_ends_at
                ? `${fWhen(subscription.trial_ends_at)} (${trialDays === 0 ? 'today' : `${trialDays} d left`})`
                : null,
              hidden: subscription.status !== 'trialing',
            },
            {
              label: 'Cancellation',
              value: <Label color="warning">Ends {fWhen(subscription.current_period_end)}</Label>,
              hidden: !subscription.cancel_at_period_end,
            },
            {
              label: 'Scheduled change',
              value: subscription.pending_change
                ? JSON.stringify(subscription.pending_change)
                : null,
              hidden: !subscription.pending_change,
            },
            {
              label: 'Razorpay customer',
              value: <CopyText value={subscription.razorpay_customer_id} label="Customer id" />,
              hidden: !subscription.razorpay_customer_id,
            },
            {
              label: 'Razorpay subscription',
              value: (
                <CopyText value={subscription.razorpay_subscription_id} label="Subscription id" />
              ),
              hidden: !subscription.razorpay_subscription_id,
            },
            {
              label: 'Last Razorpay event',
              value: fAgo(subscription.last_event_at),
              hidden: !subscription.last_event_at,
            },
            {
              label: 'Row created',
              value: fWhen(subscription.created_at),
              hidden: !subscription.created_at,
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

// ── Owner ────────────────────────────────────────────────────────────────

export function OwnerCard({ workspace, support }) {
  const { owner } = workspace;
  const popover = usePopover();

  if (!owner) {
    return (
      <Card sx={{ height: 1 }}>
        <CardHeader title="Owner" slotProps={cardHeaderSlots} />
        <CardContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This workspace has no owner on record.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const run = (action) => () => {
    popover.onClose();
    support.open(action, owner);
  };

  return (
    <Card sx={{ height: 1 }}>
      <CardHeader
        title="Owner"
        subheader="The person who signed up and pays"
        slotProps={cardHeaderSlots}
        action={
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            endIcon={<ExpandIcon />}
            onClick={popover.onOpen}
          >
            Support
          </Button>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        <DescriptionList
          items={[
            { label: 'Name', value: owner.name },
            {
              label: 'Email',
              value: owner.email && (
                <Link href={`mailto:${owner.email}`} underline="hover">
                  {owner.email}
                </Link>
              ),
            },
            { label: 'Phone', value: owner.phone },
            {
              label: 'Account',
              value: (
                <Stack direction="row" spacing={0.5}>
                  <Label
                    color={
                      owner.signup_status === 'approved'
                        ? 'success'
                        : owner.signup_status === 'rejected'
                          ? 'error'
                          : 'warning'
                    }
                  >
                    {owner.signup_status}
                  </Label>
                  {!owner.is_active && <Label>Inactive</Label>}
                </Stack>
              ),
            },
            {
              label: 'Two-factor',
              value: (
                <Label color={owner.two_factor_enabled ? 'success' : 'default'}>
                  {owner.two_factor_enabled ? 'On' : 'Off'}
                </Label>
              ),
            },
            {
              label: 'Last sign-in',
              value: owner.last_login_at
                ? `${fAgo(owner.last_login_at)} · ${fWhenTime(owner.last_login_at)}`
                : 'Never',
            },
            { label: 'Signed up', value: fWhen(owner.created_at) },
          ]}
        />

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Button
            size="small"
            component={RouterLink}
            href={paths.dashboard.ownerDetails(owner.id)}
            endIcon={<OpenIcon fontSize="small" />}
          >
            Owner profile
          </Button>
          <Button
            size="small"
            component={RouterLink}
            href={`${paths.dashboard.workspaces}?owner_id=${encodeURIComponent(owner.id)}`}
          >
            All their workspaces
          </Button>
        </Stack>
      </CardContent>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'top-right' } }}
      >
        <MenuList>
          <MenuItem onClick={run('reset_password')}>
            <ResetPasswordIcon fontSize="small" sx={{ mr: 1 }} />
            Reset password
          </MenuItem>
          <MenuItem onClick={run('sign_out')}>
            <SignOutIcon fontSize="small" sx={{ mr: 1 }} />
            Sign out everywhere
          </MenuItem>
          <MenuItem
            onClick={run('reset_2fa')}
            disabled={!owner.two_factor_enabled}
            sx={{ color: 'error.main' }}
          >
            <TwoFactorIcon fontSize="small" sx={{ mr: 1 }} />
            Reset two-factor
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </Card>
  );
}

// ── Seats ────────────────────────────────────────────────────────────────

export function SeatsCard({ workspace }) {
  const { seats, billing_enabled: billingOn, subscription } = workspace;
  const limit = seats.limit ?? subscription.seats;

  return (
    <Card sx={{ height: 1 }}>
      <CardHeader
        title="Seats"
        subheader="People who can sign in and are counted for billing"
        slotProps={cardHeaderSlots}
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Typography variant="h3" sx={{ mb: 0.5 }}>
          {fInt(seats.used)}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {limit
            ? `of ${fInt(limit)} ${seats.purchased ? 'bought' : 'allowed'}`
            : billingOn
              ? 'no seat limit on this plan'
              : 'billing is off, so nothing is capped'}
        </Typography>
        <UsageMeter value={seats.used} limit={limit ?? null} label="Seats used" dense />
        <DescriptionList
          sx={{ mt: 3 }}
          items={[
            {
              label: 'Bought',
              value: seats.purchased === null ? null : fInt(seats.purchased),
              hidden: seats.purchased === null,
            },
            { label: 'Ever added', value: fInt(seats.people_ever) },
            { label: 'Not counted', value: `${fInt(seats.inactive)} deactivated or removed` },
          ]}
        />
        {limit && seats.used > limit && (
          <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'error.main' }}>
            {fInt(seats.used - limit)} more people than seats. Nobody is locked out, but new people
            can&apos;t be added until seats are bought.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ── Activity ─────────────────────────────────────────────────────────────

export function ActivityCard({ workspace }) {
  const { activity } = workspace;
  const days = activity.logins_30d;
  const categories = days.map((day) => ({
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
  const total = days.reduce((sum, day) => sum + day.logins, 0);

  return (
    <ChartCard
      title="Sign-ins, last 30 days"
      subheader={`${fInt(total)} logins · ${fInt(activity.active_users_30d)} people · last active ${fAgo(activity.last_active_at, 'never')}`}
      empty={
        total === 0
          ? 'Nobody from this workspace has signed in during the last 30 days.'
          : undefined
      }
      table={{
        columns: [
          { key: 'title', label: 'Day' },
          { key: 'logins', label: 'Logins', align: 'right' },
          { key: 'active_users', label: 'People', align: 'right' },
        ],
        rows: days.map((day, index) => ({ ...day, key: day.date, title: categories[index].title })),
      }}
    >
      <AreaChart
        categories={categories}
        ariaLabel="Logins and active people per day"
        series={[
          { key: 'logins', label: 'Logins', values: days.map((day) => day.logins) },
          { key: 'people', label: 'Active people', values: days.map((day) => day.active_users) },
        ]}
        format={fInt}
        height={220}
      />
    </ChartCard>
  );
}

// ── Companies ────────────────────────────────────────────────────────────

export function CompaniesCard({ workspace }) {
  return (
    <Card>
      <CardHeader
        title={`Companies (${workspace.companies.length})`}
        subheader="Each company has its own people, roles and settings; seats are shared across them"
        slotProps={cardHeaderSlots}
        sx={{ pb: 1 }}
      />
      <TableContainer>
        <Table size="small" sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Industry</TableCell>
              <TableCell>Size</TableCell>
              <TableCell align="right">Active people</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Founded</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workspace.companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No companies yet.
                </TableCell>
              </TableRow>
            )}
            {workspace.companies.map((company) => (
              <TableRow key={company.id} hover>
                <TableCell sx={{ maxWidth: 240 }}>
                  <Box sx={{ gap: 0.75, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle2" noWrap>
                      {company.name}
                    </Typography>
                    {company.is_default && <Label color="info">Default</Label>}
                  </Box>
                  {company.registered_name && company.registered_name !== company.name && (
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ display: 'block', color: 'text.secondary' }}
                    >
                      {company.registered_name}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{company.industry_type ?? '—'}</TableCell>
                <TableCell>
                  {company.employee_count_range ? `${company.employee_count_range} people` : '—'}
                </TableCell>
                <TableCell align="right">{fInt(company.active_members)}</TableCell>
                <TableCell sx={{ maxWidth: 220 }}>
                  <Typography variant="body2" noWrap>
                    {company.email ?? '—'}
                  </Typography>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ display: 'block', color: 'text.secondary' }}
                  >
                    {company.phone ?? company.website ?? ''}
                  </Typography>
                </TableCell>
                <TableCell>{fWhen(company.founding_date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// ── Module usage ─────────────────────────────────────────────────────────

export function ModulesCard({ workspace }) {
  const modules = [...workspace.modules].sort(
    (a, b) => b.records_30d - a.records_30d || b.records_total - a.records_total
  );
  const used = modules.filter((module) => module.records_total > 0).length;

  return (
    <ChartCard
      title="Product usage"
      subheader={`${used} of ${modules.length} modules used · records created in the last 30 days`}
      table={{
        columns: [
          { key: 'label', label: 'Module' },
          { key: 'records_30d', label: 'Last 30 days', align: 'right', format: fInt },
          { key: 'records_total', label: 'All time', align: 'right', format: fInt },
          {
            key: 'last_activity_at',
            label: 'Last activity',
            align: 'right',
            format: (v) => fAgo(v),
          },
        ],
        rows: modules.map((module) => ({ ...module, key: module.key })),
      }}
    >
      <HBarList
        items={modules.map((module) => ({
          key: module.key,
          label: module.label,
          value: module.records_30d,
          caption: `${fInt(module.records_total)} total`,
        }))}
      />
    </ChartCard>
  );
}

// ── Payments and checkouts ───────────────────────────────────────────────

export function PaymentsCard({ workspace }) {
  const { lifetime, recent } = workspace.payments;
  const currencies = Object.keys(lifetime);

  return (
    <Card sx={{ height: 1 }}>
      <CardHeader
        title="Payments"
        subheader="Lifetime totals and the latest ten"
        slotProps={cardHeaderSlots}
        action={
          <Button
            size="small"
            component={RouterLink}
            href={`${paths.dashboard.payments}?workspace_id=${workspace.id}`}
          >
            All payments
          </Button>
        }
        sx={{ pb: 1 }}
      />
      {currencies.length > 0 && (
        <Stack direction="row" spacing={3} sx={{ px: 3, pb: 2, flexWrap: 'wrap', rowGap: 1.5 }}>
          {currencies.map((currency) => (
            <Box key={currency}>
              <Typography variant="h5">
                {fMoney(lifetime[currency].captured_minor, currency, { exact: true })}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {lifetime[currency].payments} paid
                {lifetime[currency].failed ? ` · ${lifetime[currency].failed} failed` : ''}
                {lifetime[currency].refunded_minor
                  ? ` · ${fMoney(lifetime[currency].refunded_minor, currency)} refunded`
                  : ''}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Method</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recent.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No payments yet.
                </TableCell>
              </TableRow>
            )}
            {recent.map((payment) => (
              <TableRow key={payment.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {fWhen(payment.paid_at ?? payment.created_at)}
                  {payment.invoice_url && (
                    <Link
                      href={payment.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="caption"
                      sx={{ ml: 1 }}
                    >
                      invoice
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  <PaymentStatusLabel status={payment.status} />
                  {payment.failure_reason && (
                    <Typography
                      variant="caption"
                      sx={{ mt: 0.5, display: 'block', color: 'error.main' }}
                    >
                      {payment.failure_reason}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{payment.method ?? '—'}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fMoney(payment.amount_minor, payment.currency, { exact: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

const CHECKOUT_COLORS = {
  activated: 'success',
  failed: 'error',
  authenticated: 'info',
  created: 'default',
};

export function CheckoutsCard({ workspace }) {
  return (
    <MiniTable
      title="Checkout attempts"
      subheader="Razorpay subscriptions started for this workspace"
      loading={false}
      rows={workspace.checkouts}
      empty="No checkout has been started"
      columns={[
        { key: 'when', label: 'Started', render: (row) => fWhen(row.created_at) },
        {
          key: 'plan',
          label: 'Plan',
          render: (row) => `${row.plan_name} · ${row.interval === 'year' ? 'yearly' : 'monthly'}`,
        },
        { key: 'seats', label: 'Seats', align: 'right', render: (row) => fInt(row.seats) },
        {
          key: 'kind',
          label: 'Type',
          render: (row) => (row.kind === 'replace' ? 'Change' : 'New'),
        },
        {
          key: 'status',
          label: 'Status',
          render: (row) => (
            <Label color={CHECKOUT_COLORS[row.status] ?? 'default'}>{row.status}</Label>
          ),
        },
      ]}
    />
  );
}

export function WorkspaceAuditCard({ workspace }) {
  return (
    <MiniTable
      title="Admin history"
      subheader="What platform admins have done to this workspace or its owner"
      loading={false}
      rows={workspace.audit}
      empty="Nothing yet"
      columns={[
        {
          key: 'action',
          label: 'Action',
          render: (row) => (
            <Label color={CATEGORY_COLORS[row.action.split('.')[0]] ?? 'default'}>
              {fAction(row.action)}
            </Label>
          ),
        },
        { key: 'admin', label: 'By', render: (row) => row.admin ?? 'System' },
        { key: 'when', label: 'When', align: 'right', render: (row) => fAgo(row.created_at) },
      ]}
    />
  );
}
