'use client';

import { useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import {
  saveAiProvider,
  fieldErrors,
  getErrorMessage,
} from 'src/auth/services/adminAiProviderService';

// ----------------------------------------------------------------------

/**
 * Sets or replaces Officeous's key for one provider. The key is write-only: the field is always empty, and leaving it
 * empty keeps the saved key (so the model can change without typing it again). Only fields that changed are sent.
 */
export function AiProviderDialog({ provider, onClose, onSaved }) {
  const isCustom = provider?.id === 'custom';
  const hasSavedKey = provider?.source === 'database';

  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [label, setLabel] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!provider) return;
    setApiKey('');
    setModel(provider.model || '');
    setBaseUrl(provider.base_url || '');
    setLabel(provider.id === 'custom' ? provider.label || '' : '');
    setErrors({});
    setMessage('');
  }, [provider]);

  if (!provider) return null;

  const changes = {};
  if (apiKey.trim()) changes.api_key = apiKey.trim();
  if (model.trim() !== (provider.model || '')) changes.model = model.trim();
  if (isCustom && baseUrl.trim() !== (provider.base_url || '')) changes.base_url = baseUrl.trim();
  if (isCustom && label.trim() !== (provider.label || '')) changes.label = label.trim();
  const needsKey = !hasSavedKey && !apiKey.trim();
  const canSave = Object.keys(changes).length > 0 && !needsKey && !saving;

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage('');
    try {
      onSaved(await saveAiProvider(provider.id, changes), `${provider.label} saved`);
    } catch (err) {
      const found = fieldErrors(err);
      setErrors(found);
      if (Object.keys(found).length === 0) setMessage(getErrorMessage(err, 'Could not save.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      component="form"
      onSubmit={submit}
    >
      <DialogTitle>
        {hasSavedKey ? `Update ${provider.label}` : `Set up ${provider.label}`}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {provider.source === 'environment' && (
            <Alert severity="info">
              This provider currently uses a server setting (key ending{' '}
              {provider.key_hint?.replace('••••', '')}). Saving a key here replaces it; removing it
              later brings the server setting back.
            </Alert>
          )}

          <TextField
            label={hasSavedKey ? 'New API key (leave empty to keep the current one)' : 'API key'}
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            error={Boolean(errors.api_key)}
            helperText={
              errors.api_key ||
              (hasSavedKey
                ? `Current key ends ${provider.key_hint?.replace('••••', '')}. Keys are stored encrypted and never shown again.`
                : 'Stored encrypted and never shown again.')
            }
            required={!hasSavedKey}
            fullWidth
          />

          <TextField
            label="Model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            error={Boolean(errors.model)}
            helperText={
              errors.model ||
              `Used unless a different one is picked when writing.${provider.default_model ? ` Default: ${provider.default_model}.` : ''} Leave empty for the default.`
            }
            fullWidth
          />

          {isCustom && (
            <>
              <TextField
                label="Base URL"
                placeholder="https://models.github.ai/inference"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                error={Boolean(errors.base_url)}
                helperText={
                  errors.base_url ||
                  'The part before /chat/completions of an OpenAI-compatible service. https only.'
                }
                required={!hasSavedKey}
                fullWidth
              />
              <TextField
                label="Name"
                placeholder="GitHub Models"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                error={Boolean(errors.label)}
                helperText={errors.label || 'How it is called in the pickers.'}
                fullWidth
              />
            </>
          )}

          {message && <Alert severity="error">{message}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
