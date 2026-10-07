import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------
// The blog admin API (/api/v1/admin/blogs) is protected by the backend's *platform admin*
// identity: password + a TOTP code (POST /admin/auth/*), not the Supabase login the rest
// of this CMS uses. Supabase tokens can't authorise these calls, and nothing here can
// widen what a signed-in blog admin may do: the backend enforces every permission.
//
// The session lives in sessionStorage (this tab only, gone when it closes) rather than
// localStorage, because this token can publish to the public website.
// ----------------------------------------------------------------------

const STORAGE_KEY = 'platform_admin_session';
export const ADMIN_SESSION_EVENT = 'platform-admin-session-changed';
// Refresh a little before expiry so a request never goes out with a token that dies in flight.
const REFRESH_MARGIN_MS = 30_000;

const hasStorage = () => typeof window !== 'undefined' && !!window.sessionStorage;

const emit = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
};

/** The raw stored string: a stable snapshot for useSyncExternalStore. */
export function getAdminSessionSnapshot() {
  try {
    return hasStorage() ? window.sessionStorage.getItem(STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

export function parseAdminSession(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const getAdminSession = () => parseAdminSession(getAdminSessionSnapshot());

export function subscribeAdminSession(callback) {
  window.addEventListener(ADMIN_SESSION_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(ADMIN_SESSION_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function saveSession(tokens) {
  const session = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    admin: tokens.admin,
  };
  if (hasStorage()) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emit();
  return session;
}

export function clearAdminSession() {
  if (hasStorage()) window.sessionStorage.removeItem(STORAGE_KEY);
  emit();
}

// ----------------------------------------------------------------------
// Sign in: password -> (first time only: enrol authenticator) -> code
// ----------------------------------------------------------------------

const http = axios.create({ baseURL: CONFIG.backendUrl, timeout: 30_000 });

const post = (path, data, config) => http.post(`/admin/auth${path}`, data, config).then((r) => r.data);

/** -> { mfa_token, mfa_setup_required, mfa_required, expires_in } */
export const adminLogin = ({ email, password }) => post('/login', { email, password });

/** First login only -> { otpauth_uri, secret, issuer, account_name }. Each call mints a new secret. */
export const adminMfaSetup = (mfaToken) => post('/mfa/setup', { mfa_token: mfaToken });

/** Enrols the authenticator with its first code, then signs in. */
export const adminMfaConfirm = (mfaToken, code) =>
  post('/mfa/confirm', { mfa_token: mfaToken, code }).then((tokens) => saveSession(tokens).admin);

/** Every later login. */
export const adminMfaVerify = (mfaToken, code) =>
  post('/mfa/verify', { mfa_token: mfaToken, code }).then((tokens) => saveSession(tokens).admin);

export async function adminSignOut() {
  const session = getAdminSession();
  try {
    if (session) {
      await http.post('/admin/auth/logout', null, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
    }
  } catch {
    // Already expired or unreachable: either way, this browser is done with the session.
  } finally {
    clearAdminSession();
  }
}

// ----------------------------------------------------------------------
// Authenticated client
// ----------------------------------------------------------------------

let refreshing = null;

/**
 * Exchanges the refresh token for a new pair. The backend rotates refresh tokens and
 * treats a replayed one as theft (it revokes the whole session), so concurrent callers
 * must share one in-flight refresh rather than each sending the same token.
 */
export function refreshAdminSession() {
  if (!refreshing) {
    const session = getAdminSession();
    if (!session?.refreshToken) return Promise.reject(new Error('Not signed in'));

    refreshing = http
      .post('/admin/auth/refresh', { refresh_token: session.refreshToken })
      .then((response) => saveSession(response.data).accessToken)
      .catch((error) => {
        clearAdminSession();
        throw error;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export const adminApi = axios.create({ baseURL: `${CONFIG.backendUrl}/api/v1/admin`, timeout: 60_000 });

adminApi.interceptors.request.use(async (config) => {
  let session = getAdminSession();
  if (!session) {
    const error = new Error('Your admin session has ended. Sign in again.');
    error.code = 'ADMIN_SESSION_ENDED';
    throw error;
  }
  if (session.expiresAt - Date.now() < REFRESH_MARGIN_MS) {
    await refreshAdminSession();
    session = getAdminSession();
  }
  config.headers.Authorization = `Bearer ${session.accessToken}`;
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // One silent retry with a fresh token; if that fails the session is cleared and the
    // gate returns the user to the sign-in form.
    if (error.response?.status === 401 && original && !original._retried && getAdminSession()) {
      original._retried = true;
      try {
        original.headers.Authorization = `Bearer ${await refreshAdminSession()}`;
        return await adminApi(original);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------

const cleanMessage = (message) => String(message || '').replace(/^Value error,\s*/i, '');

/**
 * Turns whatever the backend (or the network) threw into
 * { status, message, fieldErrors: { <field>: message }, suggestedSlug }.
 * FastAPI reports validation as [{ loc: ['body', 'field'], msg }], rule failures the same
 * way, and conflicts/other errors as a string or { message, field, suggested_slug }.
 */
export function describeApiError(error, fallback = 'Something went wrong. Please try again.') {
  const status = error?.response?.status ?? null;
  const detail = error?.response?.data?.detail;
  const result = { status, message: fallback, fieldErrors: {}, suggestedSlug: null };

  if (error?.code === 'ADMIN_SESSION_ENDED') {
    result.message = error.message;
  } else if (!error?.response) {
    result.message = error?.code === 'ECONNABORTED'
      ? 'The request timed out. Please try again.'
      : 'Cannot reach the server. Check your connection and try again.';
  } else if (Array.isArray(detail)) {
    detail.forEach((item) => {
      const field = Array.isArray(item.loc) ? item.loc.filter((part) => part !== 'body').join('.') : '';
      const message = cleanMessage(item.msg);
      if (field && !result.fieldErrors[field]) result.fieldErrors[field] = message;
    });
    result.message = cleanMessage(detail[0]?.msg) || fallback;
  } else if (detail && typeof detail === 'object') {
    result.message = detail.message || fallback;
    if (detail.field) result.fieldErrors[detail.field] = result.message;
    result.suggestedSlug = detail.suggested_slug || null;
  } else if (typeof detail === 'string') {
    result.message = detail;
  } else if (status === 403) {
    result.message = 'You don’t have permission to do that.';
  }
  return result;
}
