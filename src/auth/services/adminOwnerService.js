import { apiClient } from 'src/api/apiClient';
import { endpoints } from 'src/api/endpoints';

import { CONFIG } from 'src/global-config';

// Workspace owners in the admin console. The admin Bearer token is attached by the axios interceptor
// (src/api/axiosInstance.js); responses are the backend's snake_case shapes, passed through unchanged.

const url = (path) => `${CONFIG.apiUrl}${path}`;

/**
 * A readable message from whatever apiClient threw: FastAPI's `{ detail: string }`, a 422's
 * `{ detail: [{ loc, msg }] }`, a plain string, or an Error.
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const detail = error?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((issue) => {
        const field = Array.isArray(issue?.loc) ? issue.loc.slice(1).join('.') : '';
        const message = String(issue?.msg ?? '').replace(/^Value error, /, '');
        return field ? `${field}: ${message}` : message;
      })
      .join('; ');
  }

  if (typeof error === 'string' && error) return error;

  return error?.message || fallback;
}

/**
 * @param {Object} options
 * @param {string} [options.search] name, email or phone
 * @param {'all'|'pending'|'approved'|'rejected'} [options.signupStatus]
 * @param {boolean} [options.isActive]
 * @param {number|string} [options.month] month the owner signed up (1-12)
 * @param {number|string} [options.year]
 * @param {number} [options.skip]
 * @param {number} [options.limit]
 * @returns {Promise<{ total, skip, limit, counts: { all, pending, approved, rejected }, data: Object[] }>}
 */
export async function listOwners({
  search,
  signupStatus,
  isActive,
  month,
  year,
  skip = 0,
  limit = 10,
} = {}) {
  const params = { skip, limit };

  if (search?.trim()) params.search = search.trim();
  if (signupStatus && signupStatus !== 'all') params.signup_status = signupStatus;
  if (typeof isActive === 'boolean') params.is_active = isActive;
  if (month) params.month = month;
  if (year) params.year = year;

  return apiClient({ method: 'GET', url: url(endpoints.owners.list), params });
}

/** The owner with their workspaces (subscription, seats) and each workspace's companies. */
export async function getOwner(ownerId) {
  return apiClient({ method: 'GET', url: url(endpoints.owners.details(ownerId)) });
}

/**
 * Adds an already-approved owner.
 * @param {{ first_name: string, last_name?: string, email: string, phone?: string }} data
 * @returns {Promise<{ owner: Object, temporary_password: string }>} the password is only returned once
 */
export async function createOwner(data) {
  return apiClient({ method: 'POST', url: url(endpoints.owners.list), data });
}

/** Only the fields passed are changed. */
export async function updateOwner(ownerId, data) {
  return apiClient({ method: 'PATCH', url: url(endpoints.owners.details(ownerId)), data });
}

/** Soft delete: the owner can no longer sign in; their workspaces and companies are kept. */
export async function deleteOwner(ownerId) {
  return apiClient({ method: 'DELETE', url: url(endpoints.owners.details(ownerId)) });
}

/** Approves a signup: emails the owner and starts their trial. */
export async function approveOwner(ownerId) {
  return apiClient({ method: 'POST', url: url(endpoints.owners.approve(ownerId)) });
}

/** Rejects a signup; the reason is optional and is included in the email to the owner. */
export async function rejectOwner(ownerId, reason) {
  return apiClient({
    method: 'POST',
    url: url(endpoints.owners.reject(ownerId)),
    data: reason?.trim() ? { reason: reason.trim() } : {},
  });
}
