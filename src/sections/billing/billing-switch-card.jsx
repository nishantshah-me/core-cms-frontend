'use client';

import toast from 'react-hot-toast';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';

import { Label } from 'src/components/label';

import { getErrorMessage, updateBillingSettings } from 'src/auth/services/adminBillingService';

import { fWhen, pluralize, paidWorkspaceCount } from './billing-utils';

// ----------------------------------------------------------------------

const STATUS_LABELS = [
  ['trialing', 'Trialing', 'info'],
  ['active', 'Paying', 'success'],
  ['past_due', 'Past due', 'error'],
  ['free', 'Free', 'default'],
  ['grandfathered', 'Grandfathered', 'secondary'],
];

// ----------------------------------------------------------------------

/** The master switch, plus the checklist that decides whether it can be turned on. */
export function BillingSwitchCard({ data, onChange }) {
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const { settings, readiness, subscriptions_by_status: byStatus } = data;
  const enabled = settings.billing_enabled.value;
  const blocked = !enabled && !readiness.ready;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      onChange(await updateBillingSettings({ billing_enabled: !enabled }));
      toast.success(enabled ? 'Billing switched off' : 'Billing switched on');
      setConfirming(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const updatedBy = settings.updated_by?.name || settings.updated_by?.email;

  return (
    <Card>
      <CardHeader
        title="Billing"
        subheader="One switch for the whole platform: seat limits, trials and the plans and checkout screens customers see."
        action={
          <Label color={enabled ? 'success' : 'default'} sx={{ mt: 0.5 }}>
            {enabled ? 'On' : 'Off'}
          </Label>
        }
      />

      <CardContent>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Tooltip
              title={blocked ? 'Finish the required items in the checklist below first.' : ''}
              placement="top-start"
            >
              <Box component="span">
                <Switch
                  checked={enabled}
                  disabled={blocked || saving}
                  onChange={() => setConfirming(true)}
                  slotProps={{ input: { 'aria-label': 'Billing enabled' } }}
                />
              </Box>
            </Tooltip>
            <Typography variant="subtitle1">
              {enabled ? 'Billing is on' : 'Billing is off'}
            </Typography>
            <Label color={settings.billing_enabled.source === 'admin' ? 'info' : 'default'}>
              {settings.billing_enabled.source === 'admin'
                ? 'Set here'
                : 'Server default (environment)'}
            </Label>
          </Stack>

          {settings.updated_at && (
            <Typography variant="caption" color="text.secondary">
              Last changed {fWhen(settings.updated_at)}
              {updatedBy ? ` by ${updatedBy}` : ''}
            </Typography>
          )}

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {STATUS_LABELS.filter(([key]) => byStatus[key]).map(([key, text, color]) => (
              <Label key={key} color={color}>
                {`${text}: ${byStatus[key]}`}
              </Label>
            ))}
            {Object.keys(byStatus).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No workspaces have a billing record yet.
              </Typography>
            )}
          </Stack>

          <ReadinessList readiness={readiness} />
        </Stack>
      </CardContent>

      <ConfirmDialog
        open={confirming}
        enabling={!enabled}
        data={data}
        saving={saving}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirm}
        paid={paidWorkspaceCount(byStatus)}
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

function ReadinessList({ readiness }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {readiness.ready ? 'Ready to take payments' : 'Needed before billing can be switched on'}
      </Typography>

      <Stack spacing={1}>
        {readiness.checks.map((check) => {
          let icon = <CheckCircleIcon fontSize="small" color="success" />;
          if (!check.ok) {
            icon =
              check.severity === 'error' ? (
                <CancelIcon fontSize="small" color="error" />
              ) : (
                <WarningIcon fontSize="small" color="warning" />
              );
          }

          return (
            <Stack key={check.key} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ pt: '1px', display: 'flex' }}>{icon}</Box>
              <Box>
                <Typography variant="body2">{check.label}</Typography>
                {check.detail && (
                  <Typography variant="caption" color="text.secondary">
                    {check.detail}
                  </Typography>
                )}
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

function ConfirmDialog({ open, enabling, data, saving, paid, onClose, onConfirm }) {
  const { settings, plans, subscriptions_by_status: byStatus } = data;
  const freeSeats = plans.find((plan) => plan.key === 'free')?.max_seats;
  const trialDays = settings.trial_days.value;
  const grandfathered = byStatus.grandfathered ?? 0;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{enabling ? 'Switch billing on?' : 'Switch billing off?'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          {enabling ? (
            <Typography variant="body2" component="div">
              This takes effect for everyone straight away:
              <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, listStyle: 'disc' }}>
                <li>New workspaces start a {trialDays}-day free trial, no card needed.</li>
                <li>
                  Once a trial ends, a workspace without a paid plan is limited to{' '}
                  {freeSeats ? pluralize(freeSeats, 'seat') : 'the Free plan seat limit'}.
                </li>
                {grandfathered > 0 && (
                  <li>
                    The {pluralize(grandfathered, 'existing workspace')} on record stay uncapped
                    (grandfathered).
                  </li>
                )}
                <li>Customers see the plans and can pay with Razorpay.</li>
              </Box>
            </Typography>
          ) : (
            <Typography variant="body2" component="div">
              This takes effect for everyone straight away:
              <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, listStyle: 'disc' }}>
                <li>Seat limits and trial clocks stop applying.</li>
                <li>The plans, upgrade and checkout screens disappear for customers.</li>
              </Box>
            </Typography>
          )}

          {!enabling && paid > 0 && (
            <Alert severity="warning">
              {pluralize(paid, 'workspace')} currently pay for a plan. While billing is off,
              Razorpay payment and cancellation events are ignored, so their records can fall
              behind. Switch billing off only for a short pause.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color={enabling ? 'primary' : 'warning'}
          onClick={onConfirm}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {enabling ? 'Switch on' : 'Switch off'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
