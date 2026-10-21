'use client';

import toast from 'react-hot-toast';
import { useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { fWhen } from 'src/utils/admin-format';

import { extendTrial, getErrorMessage } from 'src/auth/services/adminReportsService';

// ----------------------------------------------------------------------

const PRESETS = [7, 14, 30];
const MAX_DAYS = 90;

/** Gives a workspace that has not paid more trial days. The server refuses paid, grandfathered and formerly paid ones. */
export function ExtendTrialDialog({ workspace, open, onClose, onExtended }) {
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(false);

  const valid = Number.isInteger(days) && days >= 1 && days <= MAX_DAYS;
  const { subscription } = workspace;
  const running = subscription.status === 'trialing' && subscription.trial_ends_at;

  const submit = async () => {
    setLoading(true);
    try {
      const updated = await extendTrial(workspace.id, days);
      toast.success(`Trial extended by ${days} days`);
      onExtended(updated);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not extend the trial.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Extend trial</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2.5, color: 'text.secondary' }}>
          {running
            ? `${workspace.name}'s trial ends on ${fWhen(subscription.trial_ends_at)}. The extra days are added to that date.`
            : `${workspace.name}'s trial has ended. The extra days start today and the workspace goes back on the trial plan.`}
        </Typography>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={PRESETS.includes(days) ? days : null}
          onChange={(_, next) => next && setDays(next)}
          sx={{ mb: 2 }}
        >
          {PRESETS.map((preset) => (
            <ToggleButton key={preset} value={preset} sx={{ px: 2 }}>
              {preset} days
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <TextField
          fullWidth
          size="small"
          type="number"
          label="Days to add"
          value={Number.isNaN(days) ? '' : days}
          onChange={(event) => setDays(parseInt(event.target.value, 10))}
          error={!valid}
          helperText={valid ? ' ' : `Enter a whole number from 1 to ${MAX_DAYS}`}
          slotProps={{ htmlInput: { min: 1, max: MAX_DAYS } }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={!valid || loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Extend trial
        </Button>
      </DialogActions>
    </Dialog>
  );
}
