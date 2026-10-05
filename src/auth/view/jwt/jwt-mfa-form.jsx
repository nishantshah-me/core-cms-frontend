/* eslint-disable perfectionist/sort-imports */

'use client';

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { QRCodeSVG } from 'qrcode.react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Form, Field } from 'src/components/hook-form';

import { getApiErrorMessage } from 'src/auth/utils';
import { verifyMfa, confirmMfaSetup } from 'src/auth/services/authService';

import { FormHead } from '../../components/form-head';

// ----------------------------------------------------------------------

// Backend wording for a wrong authenticator code (app/api/admin/service.py INVALID_MFA_CODE). Any other
// 401 on these steps means the 5-minute mfa_token has expired, so the user has to start over.
const INVALID_CODE_MESSAGE = 'Invalid authentication code';

export const MfaCodeSchema = z.object({
  code: z.string().regex(/^\s*\d{3}\s?\d{3}\s*$/, { message: 'Enter the 6-digit code' }),
});

// ----------------------------------------------------------------------

/**
 * Second sign-in step.
 * mode "setup":  first login, shows the QR code / key to enrol an authenticator, then confirms the code.
 * mode "verify": every later login, just asks for the current code.
 */
export function JwtMfaForm({ mode, mfaToken, setup, onSuccess, onRestart }) {
  const [errorMessage, setErrorMessage] = useState(null);

  const methods = useForm({
    resolver: zodResolver(MfaCodeSchema),
    defaultValues: { code: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage(null);

    const submit = mode === 'setup' ? confirmMfaSetup : verifyMfa;

    try {
      await submit({ mfaToken, code: data.code.replace(/\s/g, '') });
      await onSuccess();
    } catch (error) {
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;

      if (status === 401 && detail !== INVALID_CODE_MESSAGE) {
        onRestart('Your sign-in session expired. Please sign in again.');
        return;
      }

      console.error('MFA error', error);
      setErrorMessage(getApiErrorMessage(error, 'Verification failed. Please try again.'));
      reset({ code: '' });
    }
  });

  const renderSetup = () => (
    <Box sx={{ mb: 3, gap: 1.5, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
      {/* White backing so the code stays scannable in dark mode. */}
      <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'common.white', lineHeight: 0 }}>
        <QRCodeSVG value={setup.otpauth_uri} size={176} />
      </Box>

      <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
        Can’t scan? Enter this key in your authenticator app:
      </Typography>

      <Typography
        variant="subtitle2"
        sx={{ fontFamily: 'monospace', wordBreak: 'break-all', userSelect: 'all' }}
      >
        {setup.secret}
      </Typography>
    </Box>
  );

  return (
    <>
      <FormHead
        title={mode === 'setup' ? 'Set up two-factor authentication' : 'Two-factor authentication'}
        description={
          mode === 'setup'
            ? 'Scan the QR code with Google Authenticator (or any authenticator app), then enter the 6-digit code it shows.'
            : 'Enter the 6-digit code from your authenticator app.'
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {mode === 'setup' && renderSetup()}

      <Form methods={methods} onSubmit={onSubmit}>
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
          <Field.Text
            name="code"
            label="Authentication code"
            autoFocus
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 7 },
            }}
          />

          <Button
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Verify and sign in'}
          </Button>

          <Button fullWidth color="inherit" size="large" onClick={() => onRestart()}>
            Use a different account
          </Button>
        </Box>
      </Form>
    </>
  );
}
