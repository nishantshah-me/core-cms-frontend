// Kept free of axios/apiClient imports so axiosInstance can read the tokens without an import cycle.

export const ACCESS_TOKEN_KEY = 'admin_access_token';
export const REFRESH_TOKEN_KEY = 'admin_refresh_token';

// Written by the old Supabase sign-in; removed on sign-out so a stale Supabase credential isn't left behind.
const LEGACY_SUPABASE_KEYS = ['access_token', 'refresh_token', 'user_profile'];

function read(key) {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export const getAccessToken = () => read(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => read(REFRESH_TOKEN_KEY);

// Refresh token first: other tabs react to the access-token event and then read both.
export function setTokens({ access_token: accessToken, refresh_token: refreshToken }) {
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  try {
    [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, ...LEGACY_SUPABASE_KEYS].forEach((key) =>
      localStorage.removeItem(key)
    );
  } catch {
    // storage unavailable (e.g. blocked); nothing to clear
  }
}
