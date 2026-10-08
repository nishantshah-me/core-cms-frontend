'use client';

import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { Label } from 'src/components/label';

import { getErrorMessage, syncRazorpayPlans } from 'src/auth/services/adminBillingService';

import { INTERVALS, fMoney, pluralize } from './billing-utils';

// ----------------------------------------------------------------------

const INTERVAL_LABEL = Object.fromEntries(INTERVALS.map(({ value, label }) => [value, label]));

// ----------------------------------------------------------------------

/** Razorpay connection status (read-only: keys live in the server environment) and plan sync. */
export function BillingRazorpayCard({ data, onSynced }) {
  const [sync, setSync] = useState(null); // null | { force: boolean }

  const { razorpay, plans } = data;
  const unsynced = plans
    .filter((plan) => plan.is_active && !plan.is_free)
    .flatMap((plan) => plan.prices)
    .filter((price) => price.is_active && !price.synced).length;

  return (
    <Card>
      <CardHeader
        title="Razorpay"
        subheader="Payments run through Razorpay. The API keys stay in the server environment and are never shown or edited here."
      />

      <CardContent>
        <Stack spacing={2.5}>
          <Stack spacing={1.25}>
            <StatusLine label="API keys">
              {razorpay.configured ? (
                <>
                  <Label color={razorpay.mode === 'live' ? 'error' : 'info'}>
                    {razorpay.mode === 'live' ? 'Live' : 'Test'} mode
                  </Label>
                  {razorpay.key_id_hint && (
                    <Typography variant="body2" color="text.secondary">
                      key ending {razorpay.key_id_hint.replace('…', '')}
                    </Typography>
                  )}
                </>
              ) : (
                <Label color="warning">Not set</Label>
              )}
            </StatusLine>
            <StatusLine label="Webhook secret">
              <Label color={razorpay.webhook_secret_configured ? 'success' : 'warning'}>
                {razorpay.webhook_secret_configured ? 'Set' : 'Not set'}
              </Label>
            </StatusLine>
            <StatusLine label="Webhook URL">
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {`<API origin>${razorpay.webhook_path}`}
              </Typography>
            </StatusLine>
          </Stack>

          {(!razorpay.configured || !razorpay.webhook_secret_configured) && (
            <Alert severity="info">
              Set <code>RAZORPAY_KEY_ID</code>, <code>RAZORPAY_KEY_SECRET</code> and{' '}
              <code>RAZORPAY_WEBHOOK_SECRET</code> in the server environment, then add a webhook in
              the Razorpay dashboard that points at the URL above and uses the same secret.
            </Alert>
          )}

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}
          >
            <Button
              variant="contained"
              disabled={!razorpay.configured}
              onClick={() => setSync({ force: false })}
            >
              Sync with Razorpay
            </Button>
            <Typography variant="body2" color="text.secondary">
              {unsynced > 0
                ? `${pluralize(unsynced, 'price')} not created in Razorpay yet.`
                : 'Every offered price exists in Razorpay.'}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              color="warning"
              size="small"
              disabled={!razorpay.configured}
              onClick={() => setSync({ force: true })}
            >
              Recreate all plans…
            </Button>
          </Stack>
        </Stack>
      </CardContent>

      <SyncDialog
        key={sync ? `${sync.force}` : 'closed'}
        open={Boolean(sync)}
        force={Boolean(sync?.force)}
        mode={razorpay.mode}
        onClose={() => setSync(null)}
        onDone={onSynced}
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

function StatusLine({ label, children }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Typography variant="body2" sx={{ width: 120, flexShrink: 0 }} color="text.secondary">
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

// ----------------------------------------------------------------------

/** Shows what a sync would do (a dry run), then does it on confirmation. */
function SyncDialog({ open, force, mode, onClose, onDone }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [liveAck, setLiveAck] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    syncRazorpayPlans({ dryRun: true, force })
      .then((result) => !cancelled && setPreview(result))
      .catch((err) => !cancelled && setError(getErrorMessage(err)));

    return () => {
      cancelled = true;
    };
  }, [open, force]);

  const live = mode === 'live';
  const toCreate = preview?.created ?? [];
  const loading = !preview && !error;

  const handleConfirm = async () => {
    setRunning(true);
    setError('');
    try {
      const result = await syncRazorpayPlans({ force, confirmLive: liveAck });
      onDone();
      if (result.error) {
        setError(
          `${pluralize(result.created.length, 'plan')} created before Razorpay refused: ${result.error}`
        );
      } else {
        toast.success(`${pluralize(result.created.length, 'plan')} created in Razorpay`);
        onClose();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onClose={running ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{force ? 'Recreate all Razorpay plans?' : 'Sync with Razorpay'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          {loading && (
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Checking what needs to be created…</Typography>
            </Stack>
          )}

          {force && (
            <Alert severity="warning">
              This creates a new Razorpay plan for every offered price, even ones that already have
              one. Use it after switching from test keys to live keys. Subscriptions already running
              keep their current plan.
            </Alert>
          )}

          {preview && toCreate.length === 0 && (
            <Alert severity="success">
              Nothing to do: every offered price already exists in Razorpay.
            </Alert>
          )}

          {toCreate.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Will create {pluralize(toCreate.length, 'Razorpay plan')} ({preview.mode} mode)
              </Typography>
              <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5, listStyle: 'disc' }}>
                {toCreate.map((item) => (
                  <Typography
                    key={`${item.plan_key}-${item.interval}-${item.currency}`}
                    component="li"
                    variant="body2"
                  >
                    {item.plan_name} · {INTERVAL_LABEL[item.interval] ?? item.interval} ·{' '}
                    {fMoney(item.unit_amount_minor, item.currency)} per seat
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}

          {toCreate.length > 0 && live && (
            <Alert severity="error">
              These are live keys, so this creates live plans in your Razorpay account.
              <FormControlLabel
                sx={{ display: 'block', mt: 0.5 }}
                label="I understand"
                control={
                  <Checkbox
                    size="small"
                    checked={liveAck}
                    onChange={(event) => setLiveAck(event.target.checked)}
                  />
                }
              />
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={running} color="inherit">
          {preview && toCreate.length === 0 ? 'Close' : 'Cancel'}
        </Button>
        {toCreate.length > 0 && (
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={running || (live && !liveAck)}
            startIcon={running ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Create {pluralize(toCreate.length, 'plan')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
