import { apiClient } from 'src/api/apiClient';
import { endpoints } from 'src/api/endpoints';

import { CONFIG } from 'src/global-config';

// Billing configuration in the admin console. The admin Bearer token is attached by the axios interceptor
// (src/api/axiosInstance.js); responses are the backend's snake_case shapes, passed through unchanged.
// Every mutation except the Razorpay sync answers with the refreshed overview, so the page can swap it in
// without a second request.

export { getErrorMessage } from 'src/auth/services/adminOwnerService';

const url = (path) => `${CONFIG.apiUrl}${path}`;

/**
 * @returns {Promise<{
 *   settings: Object, supported_currencies: string[], razorpay: Object,
 *   readiness: { ready: boolean, checks: Object[] }, plans: Object[], subscriptions_by_status: Object,
 * }>}
 */
export function getBilling() {
  return apiClient({ url: url(endpoints.billing.root) });
}

/**
 * @param {Object} changes only what changed: `billing_enabled`, `enabled_currencies` (['INR', 'USD']),
 *   `trial_days`. An explicit `null` removes the override so the server environment applies again.
 */
export function updateBillingSettings(changes) {
  return apiClient({ method: 'PATCH', url: url(endpoints.billing.settings), data: changes });
}

/** @param {Object} changes any of `name`, `max_seats` (null = unlimited), `sort_order`, `is_active`. */
export function updateBillingPlan(planKey, changes) {
  return apiClient({ method: 'PATCH', url: url(endpoints.billing.plan(planKey)), data: changes });
}

/**
 * Create or change one per-seat price.
 * @param {{ interval: 'month'|'year', currency: string, unitAmountMinor: number, isActive?: boolean }} price
 */
export function setBillingPrice(planKey, { interval, currency, unitAmountMinor, isActive }) {
  const data = { interval, currency, unit_amount_minor: unitAmountMinor };
  if (typeof isActive === 'boolean') data.is_active = isActive;

  return apiClient({ method: 'PUT', url: url(endpoints.billing.prices(planKey)), data });
}

/**
 * Create the Razorpay plans that prices still lack.
 * @param {{ dryRun?: boolean, force?: boolean, confirmLive?: boolean, currencies?: string[] }} [options]
 * @returns {Promise<{ mode, currencies, dry_run, created: Object[], skipped: Object[], error: string|null }>}
 */
export function syncRazorpayPlans({
  dryRun = false,
  force = false,
  confirmLive = false,
  currencies,
} = {}) {
  const data = { dry_run: dryRun, force, confirm_live: confirmLive };
  if (currencies?.length) data.currencies = currencies;

  return apiClient({ method: 'POST', url: url(endpoints.billing.razorpaySync), data });
}
