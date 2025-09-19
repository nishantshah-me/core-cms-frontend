'use client';

import { useCallback } from 'react';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { signOut } from 'src/auth/services/authService';

// ----------------------------------------------------------------------

export function SignOutButton({ onClose, sx, ...other }) {
  const router = useRouter();

  const handleLogout = useCallback(() => {
    signOut();

    onClose?.();

    // Redirect to login page
    router.push(paths.auth.jwt.signIn);
  }, [onClose, router]);

  return (
    <Button
      fullWidth
      variant="soft"
      size="large"
      color="error"
      onClick={handleLogout}
      sx={sx}
      {...other}
    >
      Logout
    </Button>
  );
}
