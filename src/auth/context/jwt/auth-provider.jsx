'use client';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import { fetchCurrentAdmin } from 'src/auth/services/authService';
import { isAuthRejection, refreshSession } from 'src/auth/services/tokenRefresh';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from 'src/auth/services/session';

import { isValidToken } from './utils';
import { AuthContext } from '../auth-context';

// ----------------------------------------------------------------------

/**
 * Back-office session: the user is only "authenticated" while the server confirms the session
 * (GET /admin/auth/me). An expired access token is refreshed first; if that fails the user is signed out.
 */

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    const accessToken = getAccessToken();

    try {
      if (!accessToken || !isValidToken(accessToken)) {
        if (!getRefreshToken()) {
          clearSession();
          setState({ user: null, loading: false });
          return;
        }

        await refreshSession(accessToken);
      }

      const admin = await fetchCurrentAdmin();

      setState({
        user: {
          id: admin.id,
          email: admin.email,
          displayName: admin.name || admin.email,
          photoURL: null,
          // The template's nav filtering keys off `role`; the backend's own role is kept alongside.
          role: 'admin',
          adminRole: admin.role,
          lastLoginAt: admin.last_login_at,
          accessToken: getAccessToken(),
        },
        loading: false,
      });
    } catch (error) {
      // A rejected credential means the session is over. Anything else (server down, network) keeps the
      // tokens so a reload can retry, but the user is not treated as signed in meanwhile.
      if (isAuthRejection(error)) {
        clearSession();
      } else {
        console.error('Could not verify admin session', error);
      }

      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sign-in / sign-out / token refresh in another tab changes the stored tokens; follow it.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === null || event.key === ACCESS_TOKEN_KEY || event.key === REFRESH_TOKEN_KEY) {
        checkUserSession();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [checkUserSession]);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
