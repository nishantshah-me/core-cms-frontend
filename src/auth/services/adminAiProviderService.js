import { apiClient } from 'src/api/apiClient';
import { endpoints } from 'src/api/endpoints';

import { CONFIG } from 'src/global-config';

// Officeous's own AI provider keys (backend app/api/admin/ai_provider_endpoints.py). The admin Bearer token is
// attached by the axios interceptor. A key is WRITE-ONLY: it is sent once to set or replace it and is never returned;
// reads carry only `source` ("database" saved here, "environment" a server setting, "none") and `key_hint` (the last
// four characters). Every change answers with the refreshed overview, so the page can swap it in as is.

export { getErrorMessage } from 'src/auth/services/adminOwnerService';

const url = (path) => `${CONFIG.apiUrl}${path}`;

/**
 * @returns {Promise<{
 *   providers: Array<{ id, label, source, configured, key_hint, model, default_model, base_url, updated_at, updated_by }>,
 *   order: string[], encryption_ready: boolean,
 * }>}
 */
export function getAiProviders() {
  return apiClient({ url: url(endpoints.aiProviders.root) });
}

/** Only the fields present change. `api_key` sets or replaces the key; leave it out to keep the saved one. */
export function saveAiProvider(providerId, changes) {
  return apiClient({
    method: 'PUT',
    url: url(endpoints.aiProviders.provider(providerId)),
    data: changes,
  });
}

/** Removes the key saved here; the provider then falls back to its server setting, if there is one. */
export function removeAiProvider(providerId) {
  return apiClient({ method: 'DELETE', url: url(endpoints.aiProviders.provider(providerId)) });
}

/** Asks the provider for its model list with the key in use -> { ok, message, models_found } */
export function testAiProvider(providerId) {
  return apiClient({ method: 'POST', url: url(endpoints.aiProviders.test(providerId)) });
}

/** FastAPI validation errors as { <field>: message }, so a form can show each under its input. */
export function fieldErrors(error) {
  const out = {};
  if (Array.isArray(error?.detail)) {
    error.detail.forEach((issue) => {
      const field = Array.isArray(issue?.loc) ? issue.loc.slice(1).join('.') : '';
      if (field && !out[field]) out[field] = String(issue?.msg ?? '').replace(/^Value error, /, '');
    });
  }
  return out;
}
