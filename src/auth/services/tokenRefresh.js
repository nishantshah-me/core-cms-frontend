import axios from 'axios';

import { endpoints } from 'src/api/endpoints';

import { CONFIG } from 'src/global-config';

import { isValidToken } from 'src/auth/context/jwt/utils';

import { setTokens, clearSession, getAccessToken, getRefreshToken } from './session';

// ----------------------------------------------------------------------

// Uses plain axios (not axiosInstance) so a failing refresh can never recurse through the interceptors.

/** The server said the credential itself is bad (as opposed to a network blip or a 5xx). */
export function isAuthRejection(error) {
  const status = error?.response?.status;
  return status === 400 || status === 401 || status === 403;
}

/** Raw refresh call: returns the new token pair WITHOUT storing it (signOut must not recreate a session). */
export async function exchangeRefreshToken(refreshToken) {
  const { data } = await axios.post(
    `${CONFIG.apiUrl}${endpoints.auth.refresh}`,
    { refresh_token: refreshToken },
    { timeout: 50000 }
  );
  return data;
}

async function rotateTokens(staleAccessToken) {
  // Another tab may have rotated the tokens while we waited for the lock; use what it stored.
  const current = getAccessToken();
  if (current && current !== staleAccessToken && isValidToken(current)) {
    return current;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw Object.assign(new Error('No refresh token'), { response: { status: 401 } });
  }

  try {
    const data = await exchangeRefreshToken(refreshToken);
    setTokens(data);
    return data.access_token;
  } catch (error) {
    if (isAuthRejection(error)) clearSession();
    throw error;
  }
}

// Refresh tokens rotate and the backend revokes the whole session if an old one is replayed, so two
// refreshes must never run with the same token: one in flight per tab, one at a time across tabs.
let inFlight = null;

function withCrossTabLock(task) {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('admin-session-refresh', task);
  }
  return task();
}

/**
 * Exchanges the refresh token for new tokens (stored) and resolves with the new access token.
 * @param staleAccessToken the access token that just failed/expired, so a refresh already done by
 * another tab is reused instead of repeated.
 */
export function refreshSession(staleAccessToken) {
  if (!inFlight) {
    inFlight = withCrossTabLock(() => rotateTokens(staleAccessToken)).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
