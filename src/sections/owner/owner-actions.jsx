'use client';

import toast from 'react-hot-toast';
import { useState, useCallback } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import {
  deleteOwner,
  updateOwner,
  rejectOwner,
  approveOwner,
  getErrorMessage,
} from 'src/auth/services/adminOwnerService';

import { pluralize } from './owner-utils';

// ----------------------------------------------------------------------

const REASON_MAX_LENGTH = 500;

// How each action reads in the dialog, and what it calls. `owner` carries workspace_count / company_count
// (present on both list rows and the detail response).
const ACTIONS = {
  approve: {
    title: 'Approve signup',
    confirmLabel: 'Approve',
    color: 'success',
    success: 'Owner approved',
    run: (owner) => approveOwner(owner.id),
    describe: (name) => `Approve ${name}? They will be emailed and can sign in straight away.`,
  },
  reject: {
    title: 'Reject signup',
    confirmLabel: 'Reject',
    color: 'error',
    success: 'Signup rejected',
    run: (owner, reason) => rejectOwner(owner.id, reason),
    describe: (name) =>
      `Reject ${name}'s signup? They will not be able to sign in, and will be emailed the outcome.`,
  },
  deactivate: {
    title: 'Deactivate owner',
    confirmLabel: 'Deactivate',
    color: 'warning',
    success: 'Owner deactivated',
    run: (owner) => updateOwner(owner.id, { is_active: false }),
    describe: (name) =>
      `${name} will no longer be able to sign in. Their workspaces and data are kept, and you can reactivate them at any time.`,
  },
  activate: {
    title: 'Reactivate owner',
    confirmLabel: 'Reactivate',
    color: 'primary',
    success: 'Owner reactivated',
    run: (owner) => updateOwner(owner.id, { is_active: true }),
    describe: (name) => `${name} will be able to sign in again.`,
  },
  delete: {
    title: 'Delete owner',
    confirmLabel: 'Delete',
    color: 'error',
    success: 'Owner deleted',
    run: (owner) => deleteOwner(owner.id),
    describe: (name) =>
      `Delete ${name}? They will be removed from the owners list and can no longer sign in.`,
  },
};

/**
 * State for the approve / reject / deactivate / reactivate / delete flows. Open one with
 * `open(action, owner)`, render `<OwnerActionDialog actions={...} />`, and `onDone(action, owner)` runs
 * after the API call succeeds so the page can reload (or leave, after a delete).
 */
export function useOwnerActions({ onDone } = {}) {
  const [request, setRequest] = useState(null); // { action, owner }; kept after closing so the dialog fades out intact
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const open = useCallback((action, owner) => {
    setReason('');
    setRequest({ action, owner });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (!loading) setIsOpen(false);
  }, [loading]);

  const confirm = useCallback(async () => {
    if (!request) return;

    const { action, owner } = request;
    const config = ACTIONS[action];

    setLoading(true);
    try {
      await config.run(owner, reason);
      toast.success(config.success);
      setIsOpen(false);
      await onDone?.(action, owner);
    } catch (error) {
      toast.error(getErrorMessage(error, `Could not ${action} this owner.`));
    } finally {
      setLoading(false);
    }
  }, [request, reason, onDone]);

  return { request, isOpen, reason, setReason, loading, open, close, confirm };
}

// ----------------------------------------------------------------------

export function OwnerActionDialog({ actions }) {
  const { request, isOpen, reason, setReason, loading, close, confirm } = actions;

  const config = request ? ACTIONS[request.action] : null;
  const owner = request?.owner;
  const name = owner?.name || owner?.email || 'this owner';

  return (
    <Dialog open={isOpen} onClose={close} maxWidth="xs" fullWidth>
      {config && (
        <>
          <DialogTitle>{config.title}</DialogTitle>

          <DialogContent>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {config.describe(name)}
            </Typography>

            {request.action === 'reject' && (
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Reason (optional)"
                placeholder="Included in the email to the owner"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                slotProps={{ htmlInput: { maxLength: REASON_MAX_LENGTH } }}
                sx={{ mt: 2.5 }}
              />
            )}

            {request.action === 'delete' && owner.workspace_count > 0 && (
              <Alert severity="warning" sx={{ mt: 2.5 }}>
                They own {pluralize(owner.workspace_count, 'workspace')} with{' '}
                {pluralize(owner.company_count, 'company', 'companies')}. These are not deleted.
              </Alert>
            )}
          </DialogContent>

          <DialogActions>
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
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
