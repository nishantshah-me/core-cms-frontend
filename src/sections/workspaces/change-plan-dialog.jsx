'use client';

import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Label } from 'src/components/label';

import { getBilling } from 'src/auth/services/adminBillingService';
import {
  getWorkspace,
  changeWorkspacePlan,
  getErrorMessage,
} from 'src/auth/services/adminReportsService';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active (Paid / Enabled)', color: 'success' },
  { value: 'trialing', label: 'Trialing (Free Trial)', color: 'info' },
  { value: 'grandfathered', label: 'Grandfathered (Comped / Unlimited)', color: 'primary' },
  { value: 'free', label: 'Free Plan', color: 'default' },
  { value: 'past_due', label: 'Past Due (Payment Pending)', color: 'warning' },
];

const TRIAL_PRESETS = [7, 14, 30, 60];

const DEFAULT_PLANS = [
  { key: 'free', name: 'Free', description: 'Essential HR and attendance tools' },
  { key: 'starter', name: 'Starter', description: 'Full HR, time tracking, and asset management' },
  {
    key: 'business',
    name: 'Business',
    description: 'Enterprise HRMS, payroll, accounting and granular RBAC',
  },
];

/**
 * Dialog allowing an administrator to change or move the plan, status, seats, and billing parameters of a workspace.
 */
export function ChangePlanDialog({ workspace, open, onClose, onUpdated }) {
  const [activeWorkspace, setActiveWorkspace] = useState(workspace);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // If workspace is passed without full subscription details, fetch it
  useEffect(() => {
    setActiveWorkspace(workspace);
    if (open && workspace?.id && !workspace?.subscription) {
      setLoadingDetails(true);
      getWorkspace(workspace.id)
        .then((full) => {
          setActiveWorkspace(full);
        })
        .catch(() => {
          // Use workspace as is
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }, [open, workspace]);

  const currentSub = activeWorkspace?.subscription || {};
  const seatsUsed = activeWorkspace?.seats?.used ?? activeWorkspace?.seats_used ?? 0;

  const [availablePlans, setAvailablePlans] = useState(DEFAULT_PLANS);
  const [planKey, setPlanKey] = useState(currentSub.plan_key || 'free');
  const [status, setStatus] = useState(currentSub.status || 'free');
  const [seats, setSeats] = useState(currentSub.seats ? String(currentSub.seats) : '');
  const [interval, setInterval] = useState(currentSub.interval || 'month');
  const [currency, setCurrency] = useState(currentSub.currency || 'INR');
  const [trialDays, setTrialDays] = useState(14);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Load configured plans from the billing admin catalog if available
  useEffect(() => {
    let active = true;
    getBilling()
      .then((data) => {
        if (active && Array.isArray(data?.plans) && data.plans.length > 0) {
          setAvailablePlans(data.plans);
        }
      })
      .catch(() => {
        // Keep DEFAULT_PLANS fallback
      });
    return () => {
      active = false;
    };
  }, []);

  // Update initial form values when activeWorkspace changes
  useEffect(() => {
    if (activeWorkspace) {
      const sub = activeWorkspace.subscription || {};
      setPlanKey(sub.plan_key || 'free');
      setStatus(sub.status || 'free');
      setSeats(sub.seats ? String(sub.seats) : '');
      setInterval(sub.interval || 'month');
      setCurrency(sub.currency || 'INR');
      setTrialDays(14);
      setReason('');
    }
  }, [activeWorkspace]);

  if (!workspace) return null;

  const handlePlanChange = (newPlanKey) => {
    setPlanKey(newPlanKey);
    if (newPlanKey === 'free' && status !== 'grandfathered') {
      setStatus('free');
    } else if (newPlanKey !== 'free' && status === 'free') {
      setStatus('active');
    }
  };

  const isPaidOrActive = status === 'active' || status === 'past_due';
  const isTrial = status === 'trialing';

  const seatsNum = seats === '' ? null : Number(seats);
  const seatsInvalid = seats !== '' && (!Number.isInteger(seatsNum) || seatsNum < 1);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        plan_key: planKey,
        status,
        reason: reason.trim() || undefined,
      };

      if (isTrial) {
        payload.trial_days = Number(trialDays) || 14;
      }

      if (isPaidOrActive) {
        if (seatsNum !== null) payload.seats = seatsNum;
        payload.interval = interval;
        payload.currency = currency;
      }

      const targetId = activeWorkspace?.id || workspace?.id;
      const updated = await changeWorkspacePlan(targetId, payload);
      toast.success(`Plan updated to ${planKey.toUpperCase()} (${status})`);
      if (onUpdated) onUpdated(updated);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not change workspace plan.'));
    } finally {
      setSaving(false);
    }
  };

  const selectedPlanObj = availablePlans.find((p) => p.key === planKey);
  const displayWorkspace = activeWorkspace || workspace;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Workspace Plan</DialogTitle>

      <DialogContent dividers sx={{ maxHeight: '80vh' }}>
        {loadingDetails ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {/* Workspace summary info */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: (theme) => theme.palette.action.hover,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {displayWorkspace?.name || `Workspace ${displayWorkspace?.id}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {displayWorkspace?.subdomain ? `${displayWorkspace.subdomain} · ` : ''}Owner:{' '}
                {displayWorkspace?.owner?.name || displayWorkspace?.owner?.email || 'N/A'}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flexWrap: 'wrap', gap: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Current Plan:
                </Typography>
                <Label color="primary">
                  {currentSub.plan_name || currentSub.plan_key || 'Free'}
                </Label>
                <Label color={currentSub.status === 'active' ? 'success' : 'default'}>
                  {currentSub.status || 'free'}
                </Label>
                <Typography variant="caption" color="text.secondary">
                  ({seatsUsed} seat{seatsUsed === 1 ? '' : 's'} in use)
                </Typography>
              </Stack>
            </Paper>

            {/* Target Plan Selection */}
            <FormControl fullWidth size="small">
              <InputLabel id="target-plan-select-label">Target Plan</InputLabel>
              <Select
                labelId="target-plan-select-label"
                value={planKey}
                label="Target Plan"
                onChange={(e) => handlePlanChange(e.target.value)}
              >
                {availablePlans.map((plan) => (
                  <MenuItem key={plan.key} value={plan.key}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {plan.name}
                      </Typography>
                      {plan.highlight && (
                        <Label color="info" size="small">
                          {plan.highlight}
                        </Label>
                      )}
                      {plan.description && (
                        <Typography variant="caption" color="text.secondary">
                          — {plan.description}
                        </Typography>
                      )}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Subscription Status */}
            <FormControl fullWidth size="small">
              <InputLabel id="status-select-label">Subscription Status</InputLabel>
              <Select
                labelId="status-select-label"
                value={status}
                label="Subscription Status"
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Label color={opt.color} size="small">
                        {opt.value}
                      </Label>
                      <Typography variant="body2">{opt.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Conditional Options based on status */}
            {isTrial && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  Trial Duration:
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={TRIAL_PRESETS.includes(Number(trialDays)) ? Number(trialDays) : null}
                    onChange={(_, val) => val && setTrialDays(val)}
                  >
                    {TRIAL_PRESETS.map((days) => (
                      <ToggleButton key={days} value={days}>
                        {days} days
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                  <TextField
                    size="small"
                    type="number"
                    label="Custom days"
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                    sx={{ width: 130 }}
                    slotProps={{ htmlInput: { min: 1, max: 365 } }}
                  />
                </Stack>
              </Box>
            )}

            {isPaidOrActive && (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Seats Bought"
                  value={seats}
                  error={seatsInvalid}
                  helperText={
                    seatsInvalid
                      ? 'Enter a valid positive number'
                      : `Currently ${seatsUsed} seats in use by workspace members. Blank = default seat limit.`
                  }
                  onChange={(e) => setSeats(e.target.value.trim())}
                  placeholder={String(Math.max(5, seatsUsed))}
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                />

                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="billing-interval-label">Cadence</InputLabel>
                    <Select
                      labelId="billing-interval-label"
                      value={interval}
                      label="Cadence"
                      onChange={(e) => setInterval(e.target.value)}
                    >
                      <MenuItem value="month">Monthly</MenuItem>
                      <MenuItem value="year">Yearly</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel id="billing-currency-label">Currency</InputLabel>
                    <Select
                      labelId="billing-currency-label"
                      value={currency}
                      label="Currency"
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <MenuItem value="INR">INR (₹)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
            )}

            <Divider />

            {/* Reason / Admin Audit Note */}
            <TextField
              fullWidth
              size="small"
              label="Reason for Change (Audit Log)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Sales team manual onboarding, comped partner account, support resolution"
              helperText="Recorded in the permanent platform audit log."
            />

            {/* Visual Diff Preview */}
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: (theme) => theme.palette.background.neutral,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}
              >
                Summary of Change:
              </Typography>
              <Typography variant="body2">
                Plan:{' '}
                <strong>
                  {currentSub.plan_name || currentSub.plan_key || 'Free'} (
                  {currentSub.status || 'free'})
                </strong>{' '}
                →{' '}
                <strong style={{ color: '#16a34a' }}>
                  {selectedPlanObj?.name || planKey.toUpperCase()} ({status})
                </strong>
                {isPaidOrActive && seatsNum && ` with ${seatsNum} seats`}
              </Typography>
            </Paper>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || seatsInvalid}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Apply Plan Change
        </Button>
      </DialogActions>
    </Dialog>
  );
}
