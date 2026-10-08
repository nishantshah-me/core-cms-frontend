import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

// Both supported currencies have 2 decimals (paise / cents), so minor = major * 100.
const MINOR_UNITS = 100;

export const CURRENCY_LABELS = { INR: 'Indian rupee (INR)', USD: 'US dollar (USD)' };

export const INTERVALS = [
  { value: 'month', label: 'Monthly', perSeat: 'per seat / month' },
  { value: 'year', label: 'Yearly', perSeat: 'per seat / year' },
];

/** 49900 -> "499.00", the text shown in the amount field. */
export function minorToInput(minor) {
  return typeof minor === 'number' ? (minor / MINOR_UNITS).toFixed(2) : '';
}

/** "499" / "499.5" / "499.50" -> 49900 / 49950 / 49950; null for anything that is not a positive amount. */
export function inputToMinor(text) {
  const value = String(text ?? '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;

  const minor = Math.round(Number(value) * MINOR_UNITS);
  return minor > 0 ? minor : null;
}

export function fMoney(minor, currency) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(
    minor / MINOR_UNITS
  );
}

// The API returns naive UTC timestamps (no "Z"); without one, dayjs would read them as local time.
const HAS_TIMEZONE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

export function fWhen(value) {
  if (!value) return '—';

  return fDate(typeof value === 'string' && !HAS_TIMEZONE.test(value) ? `${value}Z` : value);
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Number of workspaces paying today, i.e. the ones a switch-off would stop tracking. */
export function paidWorkspaceCount(subscriptionsByStatus = {}) {
  return (subscriptionsByStatus.active ?? 0) + (subscriptionsByStatus.past_due ?? 0);
}
