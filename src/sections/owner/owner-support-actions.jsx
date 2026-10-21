'use client';

import toast from 'react-hot-toast';
import { useState, useCallback } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { CopyText } from 'src/sections/admin/copy-text';

import {
  signOutOwner,
  getErrorMessage,
  resetOwnerPassword,
  resetOwnerTwoFactor,
} from 'src/auth/services/adminReportsService';

import { pluralize } from './owner-utils';

// ----------------------------------------------------------------------

// Support actions for an owner who is locked out. Each one signs the owner out everywhere and is written to the
// audit log by the backend.
export const SUPPORT_ACTIONS = {
  reset_password: {
    title: 'Reset password',
    confirmLabel: 'Reset password',
    color: 'warning',
    run: (owner) => resetOwnerPassword(owner.id),
    describe: (name) =>
      `Replace ${name}'s password with a one-time temporary one and sign them out everywhere. They will be made to choose a new password when they sign in.`,
  },
  sign_out: {
    title: 'Sign out everywhere',
    confirmLabel: 'Sign out',
    color: 'warning',
    run: (owner) => signOutOwner(owner.id),
    describe: (name) =>
      `End every session ${name} has open, on any device. Their password and two-factor settings are not changed.`,
    success: (result) => `${pluralize(result.sessions_revoked, 'session')} ended`,
  },
  reset_2fa: {
    title: 'Reset two-factor authentication',
    confirmLabel: 'Reset 2FA',
    color: 'error',
    run: (owner) => resetOwnerTwoFactor(owner.id),
    describe: (name) =>
      `Switch off two-factor authentication for ${name} and sign them out everywhere. Use this only when they have lost both their authenticator and their recovery codes; they can enrol again from their profile.`,
    success: (result) =>
      result.was_enabled
        ? 'Two-factor authentication reset'
        : 'Two-factor authentication was not enabled',
  },
};

/** State for the reset password / sign out / reset 2FA flows. Open one with `open(action, owner)`. */
export function useOwnerSupport({ onDone } = {}) {
  const [request, setRequest] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const open = useCallback((action, owner) => {
    setTemporaryPassword('');
    setRequest({ action, owner });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (loading) return;
    setIsOpen(false);
    // The password is shown once: forget it as soon as the dialog goes.
    setTemporaryPassword('');
  }, [loading]);

  const confirm = useCallback(async () => {
    if (!request) return;

    const config = SUPPORT_ACTIONS[request.action];
    setLoading(true);
    try {
      const result = await config.run(request.owner);

      if (request.action === 'reset_password') {
        setTemporaryPassword(result.temporary_password);
        toast.success('Password reset');
      } else {
        toast.success(config.success(result));
        setIsOpen(false);
      }
      await onDone?.(request.action, request.owner);
    } catch (error) {
      toast.error(getErrorMessage(error, `Could not ${config.title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }, [request, onDone]);

  return { request, isOpen, loading, temporaryPassword, open, close, confirm };
}

// ----------------------------------------------------------------------

export function OwnerSupportDialog({ support }) {
  const { request, isOpen, loading, temporaryPassword, close, confirm } = support;

  const config = request ? SUPPORT_ACTIONS[request.action] : null;
  const name = request?.owner?.name || request?.owner?.email || 'this owner';

  return (
    <Dialog open={isOpen} onClose={close} maxWidth="xs" fullWidth>
      {config && (
        <>
          <DialogTitle>{temporaryPassword ? 'Temporary password' : config.title}</DialogTitle>

          <DialogContent>
            {temporaryPassword ? (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This is the only time it is shown. Pass it to {name} over a secure channel.
                </Alert>
                <CopyText value={temporaryPassword} label="Temporary password" />
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                  They are signed out everywhere and must choose a new password at their next
                  sign-in.
                </Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {config.describe(name)}
              </Typography>
            )}
          </DialogContent>

          <DialogActions>
            {temporaryPassword ? (
              <Button variant="contained" onClick={close}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="outlined" color="inherit" onClick={close} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color={config.color}
                  onClick={confirm}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {config.confirmLabel}
                </Button>
              </>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
