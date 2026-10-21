'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Switch from '@mui/material/Switch';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import TableContainer from '@mui/material/TableContainer';
import {
  Refresh as RefreshIcon,
  CheckCircle as OkIcon,
  ErrorOutline as ErrorIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { HBarList, ChartCard } from 'src/components/chart';
import { DashboardContent } from 'src/layouts/dashboard';

import { fInt, fAgo, fBytes, fWhenTime, fUptime } from 'src/utils/admin-format';

import { getSystemStatus } from 'src/auth/services/adminReportsService';

import { useReport } from 'src/sections/admin/use-report';
import { PageHeader } from 'src/sections/admin/page-header';
import { ReportError } from 'src/sections/admin/report-error';
import { DescriptionList } from 'src/sections/admin/description-list';

// ----------------------------------------------------------------------

const AUTO_REFRESH_MS = 30000;
const headerSlots = { title: { variant: 'subtitle1' }, subheader: { variant: 'caption' } };

function CheckIcon({ check }) {
  if (check.ok) return <OkIcon sx={{ color: 'success.main' }} fontSize="small" />;
  return check.severity === 'error' ? (
    <ErrorIcon sx={{ color: 'error.main' }} fontSize="small" />
  ) : (
    <WarningIcon sx={{ color: 'warning.main' }} fontSize="small" />
  );
}

/** Whether the platform is healthy, and every reason it might not be, without ever showing a secret. */
export function SystemView() {
  const report = useReport(() => getSystemStatus(), 'system');
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return undefined;
    const timer = setInterval(report.reload, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
    // `report.reload` is stable; re-subscribing is only needed when the switch flips.
  }, [auto, report.reload]);

  const status = report.data;
  const failing = status?.checks.filter((check) => !check.ok) ?? [];
  const critical = failing.filter((check) => check.severity === 'error');
  // Failing checks first, errors before warnings.
  const checks = status
    ? [...status.checks].sort(
        (a, b) =>
          Number(a.ok) - Number(b.ok) ||
          (a.severity === 'error' ? -1 : 1) - (b.severity === 'error' ? -1 : 1)
      )
    : [];

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="System health"
        subtitle="Database, background jobs, billing and configuration. Secrets are reported only as set or not set."
        trail={[{ label: 'System health' }]}
        actions={
          <>
            {report.updatedAt && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Checked {fAgo(report.updatedAt.toISOString())}
              </Typography>
            )}
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={auto}
                  onChange={(event) => setAuto(event.target.checked)}
                />
              }
              label={<Typography variant="body2">Auto-refresh (30 s)</Typography>}
            />
            <IconButton onClick={report.reload} disabled={report.loading} aria-label="Check again">
              <RefreshIcon />
            </IconButton>
          </>
        }
      />

      <ReportError error={report.error} onRetry={report.reload} />

      {!status && !report.error && <Skeleton variant="rounded" height={420} />}

      {status && (
        <>
          <Alert
            severity={critical.length ? 'error' : failing.length ? 'warning' : 'success'}
            sx={{ mb: 3 }}
          >
            {critical.length
              ? `${critical.length} critical ${critical.length === 1 ? 'problem needs' : 'problems need'} attention.`
              : failing.length
                ? `Running, with ${failing.length} ${failing.length === 1 ? 'thing' : 'things'} worth a look.`
                : 'Everything checked is healthy.'}
          </Alert>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card sx={{ height: 1 }}>
                <CardHeader
                  title="Checks"
                  subheader={`${status.checks.length - failing.length} of ${status.checks.length} passing`}
                  slotProps={headerSlots}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ pt: 1 }}>
                  <Stack spacing={1.5}>
                    {checks.map((check) => (
                      <Box
                        key={check.key}
                        sx={{ gap: 1.5, display: 'flex', alignItems: 'flex-start' }}
                      >
                        <CheckIcon check={check} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2">{check.label}</Typography>
                          {check.detail && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                color: check.ok
                                  ? 'text.secondary'
                                  : check.severity === 'error'
                                    ? 'error.main'
                                    : 'warning.dark',
                              }}
                            >
                              {check.detail}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Stack spacing={3}>
                <Card>
                  <CardHeader
                    title="API"
                    subheader="The process answering this request"
                    slotProps={headerSlots}
                    sx={{ pb: 1 }}
                  />
                  <CardContent>
                    <DescriptionList
                      items={[
                        { label: 'Uptime', value: fUptime(status.api.uptime_seconds) },
                        { label: 'Started', value: fWhenTime(status.api.started_at) },
                        { label: 'Python', value: status.api.python },
                        {
                          label: 'Release',
                          value: status.api.release ?? 'Not a Heroku release',
                          hidden: false,
                        },
                        { label: 'Commit', value: status.api.commit, hidden: !status.api.commit },
                        { label: 'Dyno', value: status.api.dyno, hidden: !status.api.dyno },
                        {
                          label: 'Debug mode',
                          value: (
                            <Label color={status.api.debug ? 'warning' : 'success'}>
                              {status.api.debug ? 'On' : 'Off'}
                            </Label>
                          ),
                        },
                      ]}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader
                    title="Database"
                    slotProps={headerSlots}
                    sx={{ pb: 1 }}
                    action={
                      <Label color={status.database.ok ? 'success' : 'error'}>
                        {status.database.ok ? 'Reachable' : 'Down'}
                      </Label>
                    }
                  />
                  <CardContent>
                    <DescriptionList
                      items={[
                        { label: 'Engine', value: status.database.dialect },
                        {
                          label: 'Round trip',
                          value:
                            status.database.latency_ms === null
                              ? null
                              : `${status.database.latency_ms} ms`,
                        },
                        {
                          label: 'Size',
                          value:
                            status.database.size_bytes === null
                              ? null
                              : fBytes(status.database.size_bytes),
                          hidden: status.database.size_bytes === null,
                        },
                        {
                          label: 'Connections',
                          value: status.database.connections,
                          hidden: status.database.connections === null,
                        },
                      ]}
                    />
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Card sx={{ height: 1 }}>
                <CardHeader
                  title="Billing"
                  slotProps={headerSlots}
                  action={
                    <Label color={status.billing.enabled ? 'success' : 'default'}>
                      {status.billing.enabled ? 'On' : 'Off'}
                    </Label>
                  }
                  sx={{ pb: 1 }}
                />
                <CardContent>
                  <DescriptionList
                    items={[
                      { label: 'Currencies', value: status.billing.currencies.join(', ') || '—' },
                      { label: 'Trial length', value: `${status.billing.trial_days} days` },
                      {
                        label: 'Razorpay keys',
                        value: status.billing.razorpay.configured ? (
                          <Label
                            color={status.billing.razorpay.mode === 'live' ? 'warning' : 'info'}
                          >
                            {status.billing.razorpay.mode} · {status.billing.razorpay.key_id_hint}
                          </Label>
                        ) : (
                          <Label color="default">Not set</Label>
                        ),
                      },
                      {
                        label: 'Webhook secret',
                        value: (
                          <Label
                            color={
                              status.billing.razorpay.webhook_secret_configured
                                ? 'success'
                                : 'default'
                            }
                          >
                            {status.billing.razorpay.webhook_secret_configured ? 'Set' : 'Not set'}
                          </Label>
                        ),
                      },
                    ]}
                  />
                  <Link
                    component={RouterLink}
                    href={paths.dashboard.billing}
                    variant="body2"
                    underline="hover"
                    sx={{ mt: 2, display: 'inline-block' }}
                  >
                    Open billing setup
                  </Link>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Card sx={{ height: 1 }}>
                <CardHeader
                  title="Razorpay events"
                  subheader="Webhooks received by this API"
                  slotProps={headerSlots}
                  sx={{ pb: 1 }}
                />
                <CardContent>
                  <DescriptionList
                    items={[
                      {
                        label: 'Last received',
                        value: status.webhooks.last_received_at
                          ? `${fAgo(status.webhooks.last_received_at)} · ${fWhenTime(status.webhooks.last_received_at)}`
                          : 'None yet',
                      },
                      { label: 'Received, 24 h', value: fInt(status.webhooks.received_24h) },
                      {
                        label: 'Failed, 24 h',
                        value: (
                          <Label color={status.webhooks.errors_24h ? 'error' : 'success'}>
                            {status.webhooks.errors_24h}
                          </Label>
                        ),
                      },
                      {
                        label: 'Stuck',
                        value: (
                          <Label color={status.webhooks.stuck ? 'warning' : 'success'}>
                            {status.webhooks.stuck}
                          </Label>
                        ),
                      },
                    ]}
                  />
                  <Link
                    component={RouterLink}
                    href={`${paths.dashboard.payments}?tab=events`}
                    variant="body2"
                    underline="hover"
                    sx={{ mt: 2, display: 'inline-block' }}
                  >
                    Inspect events
                  </Link>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <ChartCard
                title="Table sizes"
                subheader="Rows, from the planner's estimate on PostgreSQL"
              >
                <HBarList
                  items={[...status.tables]
                    .sort((a, b) => b.rows - a.rows)
                    .map((table) => ({
                      key: table.table,
                      label: table.table,
                      value: table.rows,
                      caption: table.approximate ? 'approx.' : undefined,
                    }))}
                />
              </ChartCard>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Card>
                <CardHeader
                  title="Scheduled jobs"
                  subheader={
                    status.scheduler.running
                      ? `${status.scheduler.jobs.length} jobs, scheduler running`
                      : 'The scheduler is not running on this process'
                  }
                  slotProps={headerSlots}
                  action={
                    <Label color={status.scheduler.running ? 'success' : 'error'}>
                      {status.scheduler.running ? 'Running' : 'Stopped'}
                    </Label>
                  }
                  sx={{ pb: 1 }}
                />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Job</TableCell>
                        <TableCell>Schedule</TableCell>
                        <TableCell align="right">Next run</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {status.scheduler.jobs.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            align="center"
                            sx={{ py: 4, color: 'text.secondary' }}
                          >
                            No jobs are scheduled.
                          </TableCell>
                        </TableRow>
                      )}
                      {status.scheduler.jobs.map((job) => (
                        <TableRow key={job.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">{job.name}</Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
                            >
                              {job.id}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 12.5 }}>
                            {job.trigger}
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            {job.next_run_time ? (
                              <>
                                <Typography variant="body2">{fAgo(job.next_run_time)}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {fWhenTime(job.next_run_time)}
                                </Typography>
                              </>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </DashboardContent>
  );
}
