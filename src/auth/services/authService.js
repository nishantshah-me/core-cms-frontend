import { apiClient } from 'src/api/apiClient';
import { endpoints } from 'src/api/endpoints';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_PROFILE_KEY = 'user_profile';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ----------------- LOGIN -----------------
export async function signInWithPassword({ username, password }) {
  const url = `${SUPABASE_URL}/auth/v1${endpoints.auth.signIn}`;

  const payload = await apiClient({
    method: 'POST',
    url,
    data: { email: username, password },
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!payload?.access_token) throw new Error('Login failed: no access token returned');

  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(payload.user));
  }

  return payload;
}

// ----------------- REFRESH TOKEN -----------------
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error('No refresh token found');

  const url = `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`;

  const response = await apiClient({
    method: 'POST',
    url,
    data: { refresh_token: refreshToken },
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (response?.access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(response.user));
    return response.access_token;
  }

  throw new Error('Failed to refresh token');
}

// ----------------- SIGN OUT -----------------
export function signOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
  }
}

// export async function signOut() {
//   try {
//     const url = `${SUPABASE_URL}/auth/v1/logout`;
//     const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

//     await fetch(url, {
//       method: 'POST',
//       headers: {
//         apikey: SUPABASE_ANON_KEY,
//         Authorization: `Bearer ${refreshToken}`, // Supabase requires refresh token here
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ refresh_token: refreshToken }),
//     });
//   } catch (error) {
//     console.error('Error logging out from Supabase:', error);
//   } finally {
//     // Always clear local storage (client-side logout)
//     if (typeof window !== 'undefined') {
//       localStorage.removeItem(ACCESS_TOKEN_KEY);
//       localStorage.removeItem(REFRESH_TOKEN_KEY);
//       localStorage.removeItem(USER_PROFILE_KEY);
//     }
//   }
// }
