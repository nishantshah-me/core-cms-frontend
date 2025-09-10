/* eslint-disable perfectionist/sort-imports */

'use client';

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';
import { CONFIG } from 'src/global-config';

import { useAuthContext } from '../../hooks';

import { FormHead } from '../../components/form-head';

import { signInWithPassword } from 'src/auth/services/authService';

// ----------------------------------------------------------------------

export const SignInSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z
    .string()
    .min(1, { message: 'Password is required!' })
    .min(6, { message: 'Password must be at least 6 characters!' }),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();
  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const defaultValues = {
    username: 'nishant',
    password: 'Nishant@123',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage(null);
    try {
      // call backend login
      await signInWithPassword({ username: data.username, password: data.password });

      // optional: tell your auth context to re-check session (if implemented)
      await checkUserSession?.();

      // redirect after successful login
      router.push(CONFIG.auth.redirectPath);
    } catch (error) {
      console.error('Login error', error);
      const msg = error?.message || error?.detail || JSON.stringify(error);
      setErrorMessage(msg || 'Login failed');
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text name="username" label="Username" slotProps={{ inputLabel: { shrink: true } }} />

      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Link
          component={RouterLink}
          href="#"
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          Forgot password?
        </Link>

        <Field.Text
          name="password"
          label="Password"
          placeholder="6+ characters"
          type={showPassword ? 'text' : 'password'} // toggle input type
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                    <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    {/* toggle between eye open / closed */}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title="Sign in to your account"
        description={
          <>
            {`Don’t have an account? `}
            <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2">
              Get started
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Use <strong>{defaultValues.username}</strong> with password{' '}
        <strong>{defaultValues.password}</strong>
      </Alert>

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
