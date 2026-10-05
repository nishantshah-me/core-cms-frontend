import axiosInstance from 'src/api/axiosInstance';
import { endpoints } from 'src/api/endpoints';

import { CONFIG } from 'src/global-config';

import { isValidToken } from 'src/auth/context/jwt/utils';

import { exchangeRefreshToken } from './tokenRefresh';
import { setTokens, clearSession, getAccessToken, getRefreshToken } from './session';

const url = (path) => `${CONFIG.apiUrl}${path}`;

function storeSession(data) {
  if (!data?.access_token || !data?.refresh_token) {
    throw new Error('Login failed: no tokens returned');
  }
  setTokens(data);
  return data;
}

// ----------------- LOGIN (2 steps) -----------------

/**
 * Step 1. A correct password only yields a short-lived `mfa_token` (valid ~5 minutes) plus which MFA
 * step comes next: `mfa_setup_required` (first login: enrol an authenticator) or `mfa_required`.
 */
export async function loginWithPassword({ email, password }) {
  const { data } = await axiosInstance.post(url(endpoints.auth.signIn), { email, password });
  return data;
}

/** First login only: returns `otpauth_uri` (render as a QR code) and `secret` (manual entry). Each call issues a new secret. */
export async function startMfaSetup(mfaToken) {
  const { data } = await axiosInstance.post(url(endpoints.auth.mfaSetup), { mfa_token: mfaToken });
  return data;
}

/** Step 2 for a first login: confirms the authenticator and signs in (tokens are stored). */
export async function confirmMfaSetup({ mfaToken, code }) {
  const { data } = await axiosInstance.post(url(endpoints.auth.mfaConfirm), {
    mfa_token: mfaToken,
    code,
  });
  return storeSession(data);
}

/** Step 2 for every later login: checks the authenticator code and signs in (tokens are stored). */
export async function verifyMfa({ mfaToken, code }) {
  const { data } = await axiosInstance.post(url(endpoints.auth.mfaVerify), {
    mfa_token: mfaToken,
    code,
  });
  return storeSession(data);
}

// ----------------- CURRENT ADMIN -----------------
// Resolves only while the session is live on the server (401 otherwise, after one refresh attempt).
export async function fetchCurrentAdmin() {
  const { data } = await axiosInstance.get(url(endpoints.auth.me));
  return data;
}

// ----------------- SIGN OUT -----------------
export async function signOut() {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  // Local sign-out is immediate and never waits on the network.
  clearSession();

  if (!accessToken && !refreshToken) return;

  try {
    let bearer = accessToken;

    if (!bearer || !isValidToken(bearer)) {
      // An expired access token can't authenticate the logout call, and the refresh token is about to be
      // discarded for good: trade it in for a fresh access token so the server-side session really ends.
      if (!refreshToken) return;
      bearer = (await exchangeRefreshToken(refreshToken)).access_token;
    }

    await axiosInstance.post(url(endpoints.auth.logout), null, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
  } catch {
    // Best effort: the local tokens are already gone, and the server session lapses on its own.
  }
}
