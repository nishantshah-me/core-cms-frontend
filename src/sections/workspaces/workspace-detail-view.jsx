'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import {
  Refresh as RefreshIcon,
  MoreTime as ExtendIcon,
  VerifiedOutlined as VerifiedIcon,
} from '@mui/icons-material';

import { paths } from 'src/routes/paths';

import { Label } from 'src/components/label';
import { DashboardContent } from 'src/layouts/dashboard';

import { fAgo, fInt, fWhen, fMoney } from 'src/utils/admin-format';

import { getWorkspace } from 'src/auth/services/adminReportsService';

import { useReport } from 'src/sections/admin/use-report';
import { StatTile } from 'src/sections/admin/stat-tile';
import { PageHeader } from 'src/sections/admin/page-header';
import { ReportError } from 'src/sections/admin/report-error';
import { SubscriptionStatusLabel } from 'src/sections/admin/status-labels';
import { OwnerSupportDialog, useOwnerSupport } from 'src/sections/owner/owner-support-actions';

import {
  OwnerCard,
  SeatsCard,
  ModulesCard,
  ActivityCard,
  PaymentsCard,
  CheckoutsCard,
  CompaniesCard,
  SubscriptionCard,
  WorkspaceAuditCard,
} from './workspace-cards';
import { ExtendTrialDialog } from './extend-trial-dialog';

// ----------------------------------------------------------------------

/** Trials can be extended while they run or after they lapse, for workspaces that have never paid. */
const canExtendTrial = ({ subscription }) =>
  (subscription.status === 'trialing' || subscription.status === 'free') &&
  !subscription.razorpay_subscription_id;

export function WorkspaceDetailView() {
  const params = useSearchParams();
  const workspaceId = params.get('workspace_id');

  const report = useReport(() => getWorkspace(workspaceId), workspaceId, {
    enabled: Boolean(workspaceId),
  });
  const workspace = report.data;

  const [extending, setExtending] = useState(false);
  const support = useOwnerSupport({ onDone: report.reload });

  const trail = [
    { label: 'Workspaces', href: paths.dashboard.workspaces },
    { label: workspace?.name ?? 'Workspace' },
  ];

  if (!workspaceId) {
    return (
      <DashboardContent maxWidth="xl">
        <PageHeader title="Workspace" trail={trail} />
        <Alert severity="warning">
          No workspace was selected. Pick one from the Workspaces list.
        </Alert>
      </DashboardContent>
    );
  }

  const status = workspace?.subscription.status;

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title={workspace?.name ?? 'Workspace'}
        subtitle={
          workspace && (
            <Typography component="span" variant="body2">
              {workspace.subdomain} · created {fWhen(workspace.created_at)}
            </Typography>
          )
        }
        trail={trail}
        actions={
          <>
            {workspace && (
              <>
                <SubscriptionStatusLabel status={status} />
                <Label
                  color={workspace.is_verified ? 'success' : 'default'}
                  startIcon={workspace.is_verified ? <VerifiedIcon /> : undefined}
                >
                  {workspace.is_verified ? 'Verified' : 'Not verified'}
                </Label>
              </>
            )}
            {workspace && canExtendTrial(workspace) && (
              <Button
                variant="contained"
                startIcon={<ExtendIcon />}
                onClick={() => setExtending(true)}
              >
                Extend trial
              </Button>
            )}
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={report.reload}
              disabled={report.loading}
            >
              Refresh
            </Button>
          </>
        }
      />

      <ReportError error={report.error} onRetry={report.reload} />

      {!workspace && !report.error && <Skeleton variant="rounded" height={480} />}

      {workspace && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatTile
                label="Seats in use"
                value={fInt(workspace.seats.used)}
                hint={
                  workspace.seats.purchased
                    ? `${fInt(workspace.seats.purchased)} bought`
                    : `${fInt(workspace.seats.people_ever)} people ever added`
                }
                tone={
                  workspace.subscription.seats &&
                  workspace.seats.used > workspace.subscription.seats
                    ? 'error'
                    : 'default'
                }
                loading={report.loading}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatTile
                label="Active people, 30 days"
                value={fInt(workspace.activity.active_users_30d)}
                hint={`${fInt(workspace.activity.logins_30d.reduce((sum, day) => sum + day.logins, 0))} logins`}
                loading={report.loading}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatTile
                label="Last active"
                value={fAgo(workspace.activity.last_active_at, 'Never')}
                hint={`${fInt(workspace.companies.length)} ${workspace.companies.length === 1 ? 'company' : 'companies'}`}
                loading={report.loading}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatTile
                label="Monthly revenue"
                value={
                  workspace.mrr_minor
                    ? fMoney(workspace.mrr_minor, workspace.subscription.currency)
                    : '—'
                }
                hint={
                  workspace.mrr_minor
                    ? `${workspace.subscription.plan_name} · ${workspace.subscription.interval === 'year' ? 'billed yearly' : 'billed monthly'}`
                    : workspace.subscription.plan_name
                }
                tone={status === 'past_due' ? 'error' : 'default'}
                loading={report.loading}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <SubscriptionCard workspace={workspace} />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <OwnerCard workspace={workspace} support={support} />
            </Grid>

            <Grid size={{ xs: 12, lg: 8 }}>
              <ActivityCard workspace={workspace} />
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <SeatsCard workspace={workspace} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CompaniesCard workspace={workspace} />
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <ModulesCard workspace={workspace} />
            </Grid>
            <Grid size={{ xs: 12, lg: 7 }}>
              <PaymentsCard workspace={workspace} />
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <CheckoutsCard workspace={workspace} />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <WorkspaceAuditCard workspace={workspace} />
            </Grid>
          </Grid>

          <ExtendTrialDialog
            workspace={workspace}
            open={extending}
            onClose={() => setExtending(false)}
            onExtended={report.reload}
          />
          <OwnerSupportDialog support={support} />
        </>
      )}
    </DashboardContent>
  );
}
