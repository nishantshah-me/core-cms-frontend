import axios from 'axios';

import { paths } from 'src/routes/paths';
import { endpoints } from 'src/api/endpoints';

import { CONFIG } from 'src/global-config';

import { clearSession, getAccessToken, getRefreshToken } from 'src/auth/services/session';
import { isAuthRejection, refreshSession } from 'src/auth/services/tokenRefresh';

const axiosInstance = axios.create({
  timeout: 50000,
});

// The admin token must only ever reach the HRMS API; other hosts (e.g. Supabase) never see it.
function isApiRequest(config) {
  return (config?.url ?? '').startsWith(`${CONFIG.apiUrl}/`);
}

// Sign-in steps, refresh and logout answer 401 for their own reasons (bad password, wrong code, expired
// MFA token, revoked refresh token). Callers show that; it must not trigger a refresh or a redirect.
const AUTH_FLOW_ENDPOINTS = [
  endpoints.auth.signIn,
  endpoints.auth.mfaSetup,
  endpoints.auth.mfaConfirm,
  endpoints.auth.mfaVerify,
  endpoints.auth.refresh,
  endpoints.auth.logout,
];

function isAuthFlowRequest(config) {
  const url = config?.url ?? '';
  return AUTH_FLOW_ENDPOINTS.some((path) => url.endsWith(path));
}

function bearerOf(config) {
  const header = config?.headers?.get?.('Authorization') ?? config?.headers?.Authorization;
  return typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : undefined;
}

function redirectToSignIn() {
  clearSession();

  if (typeof window === 'undefined') return;

  const { pathname, search } = window.location;
  if (pathname.startsWith(paths.auth.jwt.signIn)) return;

  const returnTo = encodeURIComponent(`${pathname}${search}`);
  window.location.assign(`${paths.auth.jwt.signIn}?returnTo=${returnTo}`);
}

// Request interceptor → Attach Bearer token (HRMS API only)
axiosInstance.interceptors.request.use(
  (config) => {
    if (isApiRequest(config)) {
      const accessToken = getAccessToken();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor → an expired access token (30 min) is swapped for a new one and the request is
// retried once; if the session itself is dead the user goes back to sign-in.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status === 401 && isApiRequest(config) && !isAuthFlowRequest(config)) {
      if (config._retried || !getRefreshToken()) {
        redirectToSignIn();
        return Promise.reject(error);
      }

      config._retried = true;

      let accessToken;
      try {
        accessToken = await refreshSession(bearerOf(config));
      } catch (refreshError) {
        // Only a rejected credential ends the session; a network blip or 5xx keeps it for next time.
        if (isAuthRejection(refreshError)) redirectToSignIn();
        return Promise.reject(error);
      }

      config.headers.Authorization = `Bearer ${accessToken}`;
      return axiosInstance(config);
    }

    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
