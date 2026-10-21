'use client';

import toast from 'react-hot-toast';
import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { Label } from 'src/components/label';
import { DashboardContent } from 'src/layouts/dashboard';

import { fAgo, fWhen, fWhenTime, describeAgent } from 'src/utils/admin-format';

import {
  getTeam,
  getErrorMessage,
  revokeAdminSession,
} from 'src/auth/services/adminReportsService';

import { useReport } from 'src/sections/admin/use-report';
import { PageHeader } from 'src/sections/admin/page-header';
import { TableState } from 'src/sections/admin/table-state';
import { ReportError } from 'src/sections/admin/report-error';

// ----------------------------------------------------------------------

const headerSlots = { title: { variant: 'subtitle1' }, subheader: { variant: 'caption' } };

/** Who can sign in to this console and from where. A session can be ended from here, e.g. when a laptop is lost. */
export function TeamView() {
  const report = useReport(() => getTeam(), 'team');
  const [target, setTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const admins = report.data?.admins ?? [];
  const sessions = report.data?.sessions ?? [];
  const waiting = report.loading && !report.data;

  const revoke = async () => {
    setRevoking(true);
    try {
      await revokeAdminSession(target.id);
      toast.success('Session ended');
      setTarget(null);
      await report.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not end the session.'));
    } finally {
      setRevoking(false);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Admin team"
        subtitle="People who can sign in to this console, and the sessions they have open. Sign-in needs a password and an authenticator code."
        trail={[{ label: 'Admin team' }]}
      />

      <ReportError error={report.error} onRetry={report.reload} />

      <Stack spacing={3}>
        <Card>
          <CardHeader
            title="Admins"
            subheader="New accounts are created from the command line, never from the web"
            slotProps={headerSlots}
            sx={{ pb: 1 }}
          />
          <TableContainer
            sx={{ opacity: report.loading && !waiting ? 0.55 : 1, transition: 'opacity 160ms' }}
          >
            <Table sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Admin</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Two-factor</TableCell>
                  <TableCell>Last sign-in</TableCell>
                  <TableCell>Password changed</TableCell>
                  <TableCell align="right">Open sessions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableState
                  colSpan={6}
                  loading={waiting}
                  empty={!report.loading && admins.length === 0}
                  title="No admins"
                />
                {admins.map((admin) => (
                  <TableRow key={admin.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{admin.name ?? admin.email}</Typography>
                      <Typography
                        variant="caption"
                        sx={{ display: 'block', color: 'text.secondary' }}
                      >
                        {admin.email} · {admin.role.replace('_', ' ')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Label color={admin.is_active ? 'success' : 'default'}>
                          {admin.is_active ? 'Active' : 'Disabled'}
                        </Label>
                        {admin.locked && (
                          <Label color="error">Locked until {fWhenTime(admin.locked_until)}</Label>
                        )}
                        {admin.failed_login_count > 0 && (
                          <Label color="warning">{admin.failed_login_count} failed tries</Label>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Label color={admin.totp_enabled ? 'success' : 'warning'}>
                        {admin.totp_enabled ? 'Enrolled' : 'Not set up'}
                      </Label>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {admin.last_login_at ? fAgo(admin.last_login_at) : 'Never'}
                      {admin.last_login_ip && (
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', color: 'text.secondary' }}
                        >
                          from {admin.last_login_ip}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{fWhen(admin.password_changed_at, 'Never')}</TableCell>
                    <TableCell align="right">{admin.active_sessions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card>
          <CardHeader
            title="Open sessions"
            subheader="Refresh tokens that are still valid. Ending one signs that device out immediately."
            slotProps={headerSlots}
            sx={{ pb: 1 }}
          />
          <TableContainer
            sx={{ opacity: report.loading && !waiting ? 0.55 : 1, transition: 'opacity 160ms' }}
          >
            <Table sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Admin</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Signed in</TableCell>
                  <TableCell>Last used</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell width={110} />
                </TableRow>
              </TableHead>
              <TableBody>
                <TableState
                  colSpan={7}
                  loading={waiting}
                  empty={!report.loading && sessions.length === 0}
                  title="No open sessions"
                />
                {sessions.map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>
                      <Typography variant="body2">{session.admin.name}</Typography>
                      {session.current && <Label color="info">This session</Label>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{describeAgent(session.user_agent)}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12.5 }}>
                      {session.ip ?? '—'}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {fWhenTime(session.created_at)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {fAgo(session.last_used_at)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fWhen(session.expires_at)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" color="error" onClick={() => setTarget(session)}>
                        End session
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Stack>

      <Dialog
        open={Boolean(target)}
        onClose={revoking ? undefined : () => setTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>End this session?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {target &&
              `${target.admin.name} will be signed out on ${describeAgent(target.user_agent)}${target.ip ? ` (${target.ip})` : ''}. They can sign in again with their password and authenticator code.`}
          </Typography>
          {target?.current && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This is your own session: you will be sent back to the sign-in page.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setTarget(null)}
            disabled={revoking}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={revoke}
            disabled={revoking}
            startIcon={revoking ? <CircularProgress size={16} color="inherit" /> : null}
          >
            End session
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
