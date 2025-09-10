// src/auth/services/authService.js
import { apiClient } from 'src/api/apiClient';
import { endpoints } from 'src/api/endpoints';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Call API to login.
 * Stores token and user data in localStorage.
 */
export async function signInWithPassword({ username, password }) {
  const payload = await apiClient({
    method: 'POST',
    url: `https://api-dev.hexafoldtech.com${endpoints.employee.login}`,
    data: { username, password },
    headers: { 'Content-Type': 'application/json' },
  });

  // Expected payload shape (from your example):
  // { data: { ...user... }, token: 'eyJ...' }
  if (!payload || !payload.token) {
    throw new Error('Login failed: no token returned');
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, payload.token);
    // save user info if available
    if (payload.data) {
      localStorage.setItem(USER_KEY, JSON.stringify(payload.data));
    }
  }

  return payload;
}

/** Clear storage and optionally do other cleanup */
export function signOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
