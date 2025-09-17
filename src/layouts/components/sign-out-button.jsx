'use client';

import { useCallback } from 'react';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

// ----------------------------------------------------------------------

export function SignOutButton({ onClose, sx, ...other }) {
  const router = useRouter();

  const handleLogout = useCallback(() => {
    // Remove token from localStorage
    localStorage.removeItem('token');

    // Optional: also clear user info if stored
    localStorage.removeItem('user');

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
