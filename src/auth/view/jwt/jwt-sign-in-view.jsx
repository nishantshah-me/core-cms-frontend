/* eslint-disable perfectionist/sort-imports */

'use client';

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter, useSearchParams } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { CONFIG } from 'src/global-config';

import { useAuthContext } from '../../hooks';

import { FormHead } from '../../components/form-head';
import { JwtMfaForm } from './jwt-mfa-form';

import { loginWithPassword, startMfaSetup } from 'src/auth/services/authService';
import { getApiErrorMessage, getSafeReturnTo } from 'src/auth/utils';

// ----------------------------------------------------------------------

export const SignInSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

// ----------------------------------------------------------------------

/**
 * Back-office sign-in: password, then an authenticator code (first login enrols the authenticator).
 * The short-lived mfa_token between the two steps is held in component state only, never in storage.
 */
export function JwtSignInView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkUserSession } = useAuthContext();

  // null while entering credentials; { mode: 'setup' | 'verify', mfaToken, setup? } for the second step.
  const [mfa, setMfa] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage(null);
    try {
      const login = await loginWithPassword({ email: data.email.trim(), password: data.password });

      if (login.mfa_setup_required) {
        // Requested here, once, rather than in an effect: every call issues a new secret.
        const setup = await startMfaSetup(login.mfa_token);
        setMfa({ mode: 'setup', mfaToken: login.mfa_token, setup });
      } else {
        setMfa({ mode: 'verify', mfaToken: login.mfa_token });
      }

      setValue('password', '');
    } catch (error) {
      console.error('Login error', error);
      setErrorMessage(getApiErrorMessage(error, 'Login failed. Please try again.'));
    }
  });

  const handleMfaSuccess = async () => {
    // Re-verifies the new session against /admin/auth/me and flips the auth context to authenticated.
    await checkUserSession();

    router.replace(getSafeReturnTo(searchParams.get('returnTo'), CONFIG.auth.redirectPath));
  };

  const handleRestart = (message) => {
    setMfa(null);
    setErrorMessage(message ?? null);
  };

  if (mfa) {
    return (
      <JwtMfaForm
        mode={mfa.mode}
        mfaToken={mfa.mfaToken}
        setup={mfa.setup}
        onSuccess={handleMfaSuccess}
        onRestart={handleRestart}
      />
    );
  }

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="email"
        label="Email address"
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { autoComplete: 'username' } }}
      />

      <Field.Text
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { autoComplete: 'current-password' },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
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
        {isSubmitting ? 'Signing in...' : 'Continue'}
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title="Back office sign in"
        description="Access is limited to platform administrators."
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>
    </>
  );
}
