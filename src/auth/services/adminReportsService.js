import { apiClient } from 'src/api/apiClient';
import { endpoints } from 'src/api/endpoints';

import { CONFIG } from 'src/global-config';

// The platform reports in the admin console: analytics, the workspace directory, subscriptions, payments, the audit
// log, system status and the admin team. The admin Bearer token is attached by the axios interceptor
// (src/api/axiosInstance.js); responses are the backend's snake_case shapes, passed through unchanged. Every list
// takes `{ skip, limit }` and answers `{ total, skip, limit, data, ... }`.

export { getErrorMessage } from 'src/auth/services/adminOwnerService';

const url = (path) => `${CONFIG.apiUrl}${path}`;

/** Drops empty filters so the query string only carries what is actually set. */
function clean(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all'
    )
  );
}

const get = (path, params) => apiClient({ url: url(path), params: clean(params) });

// ── Analytics ────────────────────────────────────────────────────────────

/** Headline numbers for the last `days` days against the `days` before them, revenue by currency, what needs attention. */
export const getOverview = (days = 30) => get(endpoints.analytics.overview, { days });

/** One point per day / week / month: owners, workspaces, people, trials_started, new_paid, churned, revenue{currency}. */
export const getGrowth = (days = 90, bucket) => get(endpoints.analytics.growth, { days, bucket });

/** Workspaces by subscription status, plan, interval, currency, industry, company size and team size. */
export const getDistribution = () => get(endpoints.analytics.distribution);

/** Logins, active users and workspaces per day, DAU/WAU/MAU, a weekday x hour heatmap in the viewer's timezone. */
export const getEngagement = (days = 30) =>
  get(endpoints.analytics.engagement, {
    days,
    tz_offset_minutes: typeof window === 'undefined' ? 0 : -new Date().getTimezoneOffset(),
  });

export const getAdoption = (days = 30) => get(endpoints.analytics.adoption, { days });

export const getCohorts = (months = 6) => get(endpoints.analytics.cohorts, { months });

export const getFunnel = (days = 90) => get(endpoints.analytics.funnel, { days });

// ── Workspaces and companies ─────────────────────────────────────────────

/**
 * @param {{ search?: string, subscriptionStatus?: string, plan?: string, ownerId?: string,
 *   sort?: 'created'|'name'|'seats'|'mrr'|'trial_ends'|'renews', order?: 'asc'|'desc', skip?: number, limit?: number }} options
 */
export const listWorkspaces = ({ subscriptionStatus, ownerId, ...rest } = {}) =>
  get(endpoints.workspaces.list, {
    ...rest,
    subscription_status: subscriptionStatus,
    owner_id: ownerId,
  });

export const getWorkspace = (id) => get(endpoints.workspaces.details(id));

/** Adds trial days (1-90) to a workspace that has not paid; answers the refreshed workspace. */
export const extendTrial = (id, days) =>
  apiClient({ method: 'POST', url: url(endpoints.workspaces.extendTrial(id)), data: { days } });

export const listCompanies = ({ workspaceId, ...rest } = {}) =>
  get(endpoints.companies.list, { ...rest, workspace_id: workspaceId });

// ── Revenue ──────────────────────────────────────────────────────────────

/**
 * @param {{ search?: string, subscriptionStatus?: string, plan?: string, interval?: 'month'|'year', currency?: string,
 *   attention?: 'past_due'|'trial_ending'|'trial_lapsed'|'cancelling'|'over_seats', sort?: string, order?: 'asc'|'desc',
 *   skip?: number, limit?: number }} options
 */
export const listSubscriptions = ({ subscriptionStatus, ...rest } = {}) =>
  get(endpoints.subscriptions.list, { ...rest, subscription_status: subscriptionStatus });

/** `start` / `end` are 'YYYY-MM-DD' days, both inclusive. */
export const listPayments = ({ paymentStatus, workspaceId, ...rest } = {}) =>
  get(endpoints.payments.list, {
    ...rest,
    payment_status: paymentStatus,
    workspace_id: workspaceId,
  });

/** `state`: processed | failed | stuck | pending. */
export const listWebhooks = (options = {}) => get(endpoints.webhooks.list, options);

// ── Platform ─────────────────────────────────────────────────────────────

/** Filters: search, action, category (owner, billing, auth...), adminId, targetType, start, end (YYYY-MM-DD). */
export const listAuditLogs = ({ adminId, targetType, ...rest } = {}) =>
  get(endpoints.auditLogs.list, { ...rest, admin_id: adminId, target_type: targetType });

export const getSystemStatus = () => get(endpoints.system.status);

export const getTeam = () => get(endpoints.team.list);

export const revokeAdminSession = (id) =>
  apiClient({ method: 'DELETE', url: url(endpoints.team.session(id)) });

// ── Owner support actions ────────────────────────────────────────────────

/** Sets a one-time temporary password (returned once) and signs the owner out everywhere. */
export const resetOwnerPassword = (ownerId) =>
  apiClient({ method: 'POST', url: url(endpoints.owners.resetPassword(ownerId)) });

export const signOutOwner = (ownerId) =>
  apiClient({ method: 'POST', url: url(endpoints.owners.signOut(ownerId)) });

export const resetOwnerTwoFactor = (ownerId) =>
  apiClient({ method: 'POST', url: url(endpoints.owners.resetTwoFactor(ownerId)) });
