'use client';

import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { getErrorMessage, updateBillingSettings } from 'src/auth/services/adminBillingService';

import { CURRENCY_LABELS } from './billing-utils';

// ----------------------------------------------------------------------

const TRIAL_MIN = 1;
const TRIAL_MAX = 90;

// ----------------------------------------------------------------------

/** Currencies customers may pay in, and how long the no-card trial lasts. */
export function BillingSettingsCard({ data, onChange }) {
  const { settings, supported_currencies: supported } = data;
  const savedCurrencies = settings.enabled_currencies.value;
  const savedTrial = settings.trial_days.value;
  const currenciesKey = savedCurrencies.join(',');

  const [currencies, setCurrencies] = useState(savedCurrencies);
  const [trial, setTrial] = useState(String(savedTrial));
  const [saving, setSaving] = useState(false);

  // Start over from the server's values whenever they change (after a save, a reset or a reload).
  useEffect(() => {
    setCurrencies(currenciesKey ? currenciesKey.split(',') : []);
  }, [currenciesKey]);

  useEffect(() => {
    setTrial(String(savedTrial));
  }, [savedTrial]);

  const trialDays = /^\d+$/.test(trial) ? Number(trial) : null;
  const trialInvalid = trialDays === null || trialDays < TRIAL_MIN || trialDays > TRIAL_MAX;
  const currenciesChanged = currencies.join(',') !== savedCurrencies.join(',');
  const trialChanged = trialDays !== savedTrial;
  const dirty = currenciesChanged || trialChanged;

  const toggleCurrency = (code) =>
    // Keep the supported order, so the first enabled currency (the default shown to customers) is stable.
    setCurrencies((current) =>
      supported.filter((item) => (item === code ? !current.includes(code) : current.includes(item)))
    );

  const save = async (changes, message) => {
    setSaving(true);
    try {
      onChange(await updateBillingSettings(changes));
      toast.success(message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    const changes = {};
    if (currenciesChanged) changes.enabled_currencies = currencies;
    if (trialChanged) changes.trial_days = trialDays;
    save(changes, 'Settings saved');
  };

  return (
    <Card>
      <CardHeader
        title="Currencies and trial"
        subheader="These apply as soon as you save. A currency can only be offered once its prices exist in Razorpay."
      />

      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2">Currencies customers can pay in</Typography>
            <FormGroup row>
              {supported.map((code) => (
                <FormControlLabel
                  key={code}
                  label={CURRENCY_LABELS[code] ?? code}
                  control={
                    <Checkbox
                      checked={currencies.includes(code)}
                      onChange={() => toggleCurrency(code)}
                    />
                  }
                />
              ))}
            </FormGroup>
            <Typography variant="caption" color="text.secondary">
              {settings.enabled_currencies.source === 'environment'
                ? 'Using the server default.'
                : `Server default: ${settings.enabled_currencies.environment_value.join(', ') || 'none'}.`}{' '}
              The first enabled currency is the default customers see.
              {settings.enabled_currencies.source === 'admin' && (
                <Button
                  size="small"
                  sx={{ ml: 1 }}
                  disabled={saving}
                  onClick={() =>
                    save({ enabled_currencies: null }, 'Currencies reset to the server default')
                  }
                >
                  Use server default
                </Button>
              )}
            </Typography>
          </Box>

          <Box>
            <TextField
              label="Free trial length (days)"
              value={trial}
              onChange={(event) => setTrial(event.target.value.trim())}
              error={trialInvalid}
              helperText={
                trialInvalid
                  ? `Enter a whole number from ${TRIAL_MIN} to ${TRIAL_MAX}.`
                  : 'Starts when a new signup is approved. Trials already running keep their end date.'
              }
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              sx={{ width: { xs: 1, sm: 320 } }}
            />
            {settings.trial_days.source === 'admin' && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                Server default: {settings.trial_days.environment_value} days.
                <Button
                  size="small"
                  sx={{ ml: 1 }}
                  disabled={saving}
                  onClick={() =>
                    save({ trial_days: null }, 'Trial length reset to the server default')
                  }
                >
                  Use server default
                </Button>
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!dirty || trialInvalid || saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Save changes
        </Button>
        {dirty && !saving && (
          <Button
            color="inherit"
            onClick={() => {
              setCurrencies(savedCurrencies);
              setTrial(String(savedTrial));
            }}
          >
            Discard
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
