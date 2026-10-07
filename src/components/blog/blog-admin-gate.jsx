'use client';

import { useMemo, useState, useEffect, useSyncExternalStore } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import {
  adminLogin,
  adminMfaSetup,
  adminMfaVerify,
  adminMfaConfirm,
  describeApiError,
  parseAdminSession,
  subscribeAdminSession,
  getAdminSessionSnapshot,
} from 'src/auth/services/platformAdminService';

// ----------------------------------------------------------------------

const SERVER_SNAPSHOT = () => null;

/**
 * Shows `children` only while there is a platform-admin session; otherwise the sign-in
 * form. This is a convenience for the UI: the API enforces the same thing on every call.
 */
export function BlogAdminGate({ children }) {
  const raw = useSyncExternalStore(subscribeAdminSession, getAdminSessionSnapshot, SERVER_SNAPSHOT);
  const session = useMemo(() => parseAdminSession(raw), [raw]);

  // The session only exists in the browser, so don't flash the sign-in form at someone who
  // is already signed in while the first client render catches up.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  return session ? children : <BlogAdminSignIn />;
}

// ----------------------------------------------------------------------

export function BlogAdminSignIn() {
  const [step, setStep] = useState('credentials'); // credentials | setup | verify
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [enrolment, setEnrolment] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const backToStart = (message) => {
    setStep('credentials');
    setCode('');
    setMfaToken('');
    setEnrolment(null);
    setError(message || '');
  };

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      const { message, status } = describeApiError(err, 'Sign-in failed. Please try again.');
      // The five-minute window between the password and the code ran out.
      if (step !== 'credentials' && status === 401) backToStart('That sign-in expired. Please start again.');
      else setError(message);
    } finally {
      setBusy(false);
    }
  };

  const submitCredentials = (event) => {
    event.preventDefault();
    run(async () => {
      const result = await adminLogin({ email: email.trim(), password });
      setMfaToken(result.mfa_token);
      if (result.mfa_setup_required) {
        // Asked once: every call to /mfa/setup replaces the secret.
        setEnrolment(await adminMfaSetup(result.mfa_token));
        setStep('setup');
      } else {
        setStep('verify');
      }
      setPassword('');
    });
  };

  const submitCode = (event) => {
    event.preventDefault();
    const digits = code.replace(/\s+/g, '');
    run(() => (step === 'setup' ? adminMfaConfirm(mfaToken, digits) : adminMfaVerify(mfaToken, digits)));
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(enrolment.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy. Select the key and copy it manually.');
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 4, md: 10 }, px: 2 }}>
      <Card sx={{ width: 1, maxWidth: 440, p: { xs: 3, md: 4 } }}>
        <Stack spacing={0.5} sx={{ mb: 3 }}>
          <Typography variant="h5">Blog admin sign in</Typography>
          <Typography variant="body2" color="text.secondary">
            Publishing to the website needs your Officeous platform admin account, which is separate
            from this dashboard’s login.
          </Typography>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {error}
          </Alert>
        )}

        {step === 'credentials' && (
          <Box component="form" onSubmit={submitCredentials} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                fullWidth
              />
              <Button type="submit" variant="contained" size="large" disabled={busy || !email || !password}>
                {busy ? 'Checking…' : 'Continue'}
              </Button>
            </Stack>
          </Box>
        )}

        {step !== 'credentials' && (
          <Box component="form" onSubmit={submitCode} noValidate>
            <Stack spacing={2}>
              {step === 'setup' && enrolment && (
                <Stack spacing={1.5}>
                  <Alert severity="info">
                    First sign-in: add this account to an authenticator app (Google Authenticator, 1Password,
                    Authy…), then enter the 6-digit code it shows.
                  </Alert>
                  <TextField
                    label="Setup key"
                    value={enrolment.secret}
                    slotProps={{
                      input: {
                        readOnly: true,
                        sx: { fontFamily: 'monospace', letterSpacing: 1 },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton aria-label="Copy setup key" onClick={copySecret} edge="end">
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    helperText={copied ? 'Copied' : 'Choose “Enter a setup key” in your app and paste this.'}
                    fullWidth
                  />
                  <Link href={enrolment.otpauth_uri} variant="body2" underline="always">
                    On your phone? Open in your authenticator app
                  </Link>
                </Stack>
              )}

              <TextField
                label="Authentication code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, '').slice(0, 7))}
                autoComplete="one-time-code"
                autoFocus
                required
                fullWidth
                slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9 ]*', maxLength: 7 } }}
                helperText="The 6-digit code from your authenticator app"
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={busy || code.replace(/\s+/g, '').length !== 6}
              >
                {busy ? 'Verifying…' : step === 'setup' ? 'Finish setup & sign in' : 'Sign in'}
              </Button>
              <Button variant="text" onClick={() => backToStart('')} disabled={busy}>
                Use a different account
              </Button>
            </Stack>
          </Box>
        )}
      </Card>
    </Box>
  );
}
