import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

// The API returns naive UTC timestamps (no "Z"); without one, dayjs would read them as local time.
const HAS_TIMEZONE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

export function fOwnerDate(value) {
  if (!value) return '—';

  const input = typeof value === 'string' && !HAS_TIMEZONE.test(value) ? `${value}Z` : value;
  return fDate(input);
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export const SIGNUP_STATUS_META = {
  pending: { label: 'Pending', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
};
