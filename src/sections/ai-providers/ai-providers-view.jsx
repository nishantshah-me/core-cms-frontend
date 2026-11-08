'use client';

import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useState, useEffect, useCallback } from 'react';

import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { LogoLoader } from 'src/components/loading-screen/LogoLoader';

import {
  getAiProviders,
  testAiProvider,
  getErrorMessage,
  removeAiProvider,
} from 'src/auth/services/adminAiProviderService';

import { AiProviderDialog } from './ai-provider-dialog';

// ----------------------------------------------------------------------

const SOURCE = {
  database: { label: 'Saved here', color: 'success' },
  environment: { label: 'Server setting', color: 'info' },
  none: { label: 'Not set', color: 'default' },
};

export function AiProvidersView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(''); // "<provider>:test" | "<provider>:remove"

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await getAiProviders());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load the AI providers.'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const test = async (provider) => {
    setBusy(`${provider.id}:test`);
    try {
      const result = await testAiProvider(provider.id);
      (result.ok ? toast.success : toast.error)(result.message);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not test the key.'));
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    const provider = removing;
    setBusy(`${provider.id}:remove`);
    try {
      setData(await removeAiProvider(provider.id));
      toast.success(`${provider.label}: saved key removed`);
      setRemoving(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove the key.'));
    } finally {
      setBusy('');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} color="inherit" href={paths.dashboard.root} underline="hover">
          Dashboard
        </Link>
        <Typography color="text.primary">AI providers</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 3 }}>
        AI providers
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={load}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!data && !error && <LogoLoader sx={{ height: '60vh' }} />}

      {data && (
        <Stack spacing={3}>
          {!data.encryption_ready && (
            <Alert severity="error">
              The server has no SECRET_KEY, so it cannot encrypt keys and saving one will fail. Set
              SECRET_KEY on the server first.
            </Alert>
          )}

          <Card>
            <CardHeader
              title="Officeous’s own keys"
              subheader={
                <>
                  These run <strong>Write with AI</strong> on the Blogs page. A key saved here
                  replaces the same provider’s server setting (the Heroku config var); remove it to
                  go back to that setting. Keys are stored encrypted and are never shown again, only
                  the last four characters. Companies add their own keys in Company Preferences, so
                  nothing here is used for them. Most providers have a free tier. &ldquo;Auto&rdquo;
                  tries them in this order: {data.order.join(', ')}.
                </>
              }
            />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Provider</TableCell>
                    <TableCell>Key</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Last changed</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.providers.map((provider) => {
                    const source = SOURCE[provider.source];
                    return (
                      <TableRow key={provider.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{provider.label}</Typography>
                          {provider.base_url && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              component="div"
                              noWrap
                            >
                              {provider.base_url}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Label color={source.color}>{source.label}</Label>
                            {provider.key_hint && (
                              <Typography variant="body2" color="text.secondary">
                                {provider.key_hint}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>{provider.model || '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {provider.updated_at
                            ? `${dayjs(provider.updated_at).format('D MMM YYYY')}${provider.updated_by ? ` by ${provider.updated_by}` : ''}`
                            : '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Button size="small" onClick={() => setEditing(provider)}>
                            {provider.source === 'database' ? 'Update' : 'Set key'}
                          </Button>
                          {provider.configured && (
                            <Button
                              size="small"
                              color="inherit"
                              onClick={() => test(provider)}
                              disabled={busy !== ''}
                            >
                              {busy === `${provider.id}:test` ? 'Testing…' : 'Test'}
                            </Button>
                          )}
                          {provider.source === 'database' && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => setRemoving(provider)}
                              disabled={busy !== ''}
                            >
                              Remove
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      )}

      <AiProviderDialog
        provider={editing}
        onClose={() => setEditing(null)}
        onSaved={(overview, message) => {
          setData(overview);
          setEditing(null);
          toast.success(message);
        }}
      />

      <Dialog open={Boolean(removing)} onClose={() => setRemoving(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove the saved key?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {removing &&
              `${removing.label} will stop using the key saved here. If the server has its own setting for it, that one is used again; otherwise ${removing.label} is switched off.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setRemoving(null)} disabled={busy !== ''}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={remove} disabled={busy !== ''}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
