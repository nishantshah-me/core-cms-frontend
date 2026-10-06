'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as DeactivateIcon,
  LockOpen as ActivateIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircleOutline as ApproveIcon,
  HighlightOff as RejectIcon,
} from '@mui/icons-material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { LogoLoader } from 'src/components/loading-screen/LogoLoader';

import { getOwner, getErrorMessage } from 'src/auth/services/adminOwnerService';

import { fOwnerDate, pluralize } from 'src/sections/owner/owner-utils';
import { OwnerStatusLabel } from 'src/sections/owner/owner-status-label';
import { OwnerActionDialog, useOwnerActions } from 'src/sections/owner/owner-actions';

// ----------------------------------------------------------------------

const SUBSCRIPTION_COLOR = {
  trialing: 'info',
  active: 'success',
  past_due: 'error',
  free: 'default',
  grandfathered: 'secondary',
};

// ----------------------------------------------------------------------

export default function OwnerDetailPage() {
  return (
    <Suspense fallback={<LogoLoader sx={{ height: '80vh' }} />}>
      <OwnerDetailView />
    </Suspense>
  );
}

function OwnerDetailView() {
  const router = useRouter();
  const ownerId = useSearchParams().get('owner_id');

  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(Boolean(ownerId));
  const [error, setError] = useState(ownerId ? '' : 'No owner specified.');

  const load = useCallback(async () => {
    if (!ownerId) return;

    setError('');
    try {
      setOwner(await getOwner(ownerId));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load this owner.'));
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  const actions = useOwnerActions({
    // A deleted owner is gone from the console, so there is nothing left to show.
    onDone: (action) => (action === 'delete' ? router.push(paths.dashboard.owners) : load()),
  });

  if (loading) {
    return <LogoLoader sx={{ height: '80vh' }} />;
  }

  if (!owner) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Owner not found.'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(paths.dashboard.owners)}>
          Back to owners
        </Button>
      </Container>
    );
  }

  const seatsInUse = owner.workspaces.reduce((sum, workspace) => sum + workspace.seats_used, 0);
  const isPending = owner.signup_status === 'pending';
  const isRejected = owner.signup_status === 'rejected';
  const isInactive = owner.is_active === false;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} color="inherit" href={paths.dashboard.root} underline="hover">
          Dashboard
        </Link>
        <Link
          component={RouterLink}
          color="inherit"
          href={paths.dashboard.owners}
          underline="hover"
        >
          Owners
        </Link>
        <Typography color="text.primary">{owner.name || owner.email}</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          mb: 3,
          gap: 2,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <IconButton
            onClick={() => router.push(paths.dashboard.owners)}
            aria-label="Back to owners"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">{owner.name || owner.email}</Typography>
          <OwnerStatusLabel owner={owner} />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<EditIcon />}
            onClick={() => router.push(paths.dashboard.ownerEdit(owner.id))}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={isInactive ? <ActivateIcon /> : <DeactivateIcon />}
            onClick={() => actions.open(isInactive ? 'activate' : 'deactivate', owner)}
          >
            {isInactive ? 'Reactivate' : 'Deactivate'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => actions.open('delete', owner)}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      {(isPending || isRejected) && (
        <Alert
          severity={isPending ? 'warning' : 'error'}
          sx={{ mb: 3 }}
          action={
            <Stack direction="row" spacing={1}>
              {isPending && (
                <Button
                  color="error"
                  size="small"
                  startIcon={<RejectIcon />}
                  onClick={() => actions.open('reject', owner)}
                >
                  Reject
                </Button>
              )}
              <Button
                color={isPending ? 'warning' : 'error'}
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                onClick={() => actions.open('approve', owner)}
              >
                Approve
              </Button>
            </Stack>
          }
        >
          {isPending
            ? 'This signup is waiting for your review. They cannot sign in until it is approved.'
            : `This signup was rejected${owner.rejection_reason ? `: ${owner.rejection_reason}` : '.'}`}
        </Alert>
      )}

      <Box
        sx={{
          mb: 3,
          gap: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        }}
      >
        <StatCard label="Workspaces" value={owner.workspace_count} />
        <StatCard label="Companies" value={owner.company_count} />
        <StatCard label="Seats in use" value={seatsInUse} />
      </Box>

      <Box
        sx={{
          gap: 3,
          display: 'grid',
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h6">Workspaces</Typography>

          {owner.workspaces.length === 0 ? (
            <Card>
              <CardContent sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                  No workspaces yet
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
                  {isPending
                    ? 'They can create one once their signup is approved.'
                    : 'This owner has not created a workspace.'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            owner.workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))
          )}
        </Stack>

        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Owner details
              </Typography>
              <Stack spacing={2} divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />}>
                <DetailRow label="Email" value={owner.email} />
                <DetailRow label="Phone" value={owner.phone} />
                <DetailRow label="Username" value={owner.username} />
                <DetailRow label="Signed up" value={fOwnerDate(owner.created_at)} />
                <DetailRow label="Account" value={isInactive ? 'Inactive' : 'Active'} />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Signup review
              </Typography>
              <Stack spacing={2} divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />}>
                <DetailRow label="Status" value={<OwnerStatusLabel owner={owner} />} />
                {!isPending && (
                  <DetailRow
                    label={isRejected ? 'Rejected on' : 'Approved on'}
                    value={fOwnerDate(owner.approved_at)}
                  />
                )}
                {!isPending && owner.approved_by && (
                  <DetailRow
                    label="Reviewed by"
                    value={owner.approved_by_name || 'Platform admin'}
                  />
                )}
                {isRejected && <DetailRow label="Reason" value={owner.rejection_reason} />}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <OwnerActionDialog actions={actions} />
    </Container>
  );
}

// ----------------------------------------------------------------------

function StatCard({ label, value }) {
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h3">{value}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
    </Card>
  );
}

function DetailRow({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      {typeof value === 'string' || value == null ? (
        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
          {value || '—'}
        </Typography>
      ) : (
        value
      )}
    </Box>
  );
}

function SubscriptionSummary({ workspace }) {
  const { subscription, seats_used: seatsUsed } = workspace;

  if (!subscription) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        No subscription · {pluralize(seatsUsed, 'seat')} in use
      </Typography>
    );
  }

  const seatText = subscription.seats
    ? `${seatsUsed} of ${pluralize(subscription.seats, 'seat')} in use`
    : `${pluralize(seatsUsed, 'seat')} in use`;

  const details = [
    subscription.plan_key && `${subscription.plan_key} plan`,
    subscription.interval && `billed per ${subscription.interval}`,
    seatText,
    subscription.status === 'trialing' &&
      subscription.trial_ends_at &&
      `trial ends ${fOwnerDate(subscription.trial_ends_at)}`,
    subscription.status !== 'trialing' &&
      subscription.current_period_end &&
      `${subscription.cancel_at_period_end ? 'ends' : 'renews'} ${fOwnerDate(subscription.current_period_end)}`,
  ].filter(Boolean);

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
      <Label color={SUBSCRIPTION_COLOR[subscription.status] ?? 'default'}>
        {subscription.status.replace('_', ' ')}
      </Label>
      {subscription.cancel_at_period_end && <Label color="warning">Cancelling</Label>}
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {details.join(' · ')}
      </Typography>
    </Stack>
  );
}

function WorkspaceCard({ workspace }) {
  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            gap: 1,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h6">{workspace.name || 'Untitled workspace'}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {workspace.subdomain || 'No subdomain'} · created {fOwnerDate(workspace.created_at)}
            </Typography>
          </Box>
          <Label color={workspace.is_verified ? 'success' : 'default'}>
            {workspace.is_verified ? 'Verified' : 'Unverified'}
          </Label>
        </Box>

        <Box sx={{ mt: 2 }}>
          <SubscriptionSummary workspace={workspace} />
        </Box>
      </CardContent>

      <Divider />

      {workspace.companies.length === 0 ? (
        <CardContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            No companies in this workspace.
          </Typography>
        </CardContent>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="right">Active members</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspace.companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{company.name}</Typography>
                    {company.registered_name && company.registered_name !== company.name && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {company.registered_name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{company.industry_type || '—'}</TableCell>
                  <TableCell>{company.employee_count_range || '—'}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{company.email || '—'}</Typography>
                    {company.phone && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {company.phone}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{company.active_members}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}
