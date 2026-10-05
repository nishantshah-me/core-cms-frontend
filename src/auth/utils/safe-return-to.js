import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

// Any origin works as a base: the check is only whether the value still resolves to it.
const BASE = 'http://return-to.local';

/**
 * Validates a `?returnTo=` value before it is used as a redirect target, so a crafted sign-in link
 * can't bounce a freshly signed-in admin to another site (`//evil.com`, `/\evil.com`, `/<TAB>/evil.com`).
 * Returns a same-origin relative URL, or `fallback`.
 */
export function getSafeReturnTo(value, fallback) {
  if (typeof value !== 'string' || !value.startsWith('/')) return fallback;

  try {
    // Resolved with the same URL parser the browser uses, so whitespace tricks can't slip through.
    const url = new URL(value, BASE);

    if (url.origin !== BASE) return fallback;
    // Returning to the sign-in page itself would loop (GuestGuard sends authenticated users back out).
    if (url.pathname.startsWith(paths.auth.jwt.signIn)) return fallback;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
