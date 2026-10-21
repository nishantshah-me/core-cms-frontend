import dayjs from 'dayjs';

// ----------------------------------------------------------------------

// The API returns naive UTC timestamps ("2026-10-21T09:00:00", no "Z"); without one dayjs would read them as local
// time. Plain days ("2026-10-21", chart buckets) are calendar dates and stay as they are.
const HAS_TIMEZONE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;
const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function toDate(value) {
  if (!value) return null;

  const input =
    typeof value === 'string' && !DAY_ONLY.test(value) && !HAS_TIMEZONE.test(value)
      ? `${value}Z`
      : value;
  const date = dayjs(input);

  return date.isValid() ? date : null;
}

/** 21 Oct 2026 */
export function fWhen(value, empty = '—') {
  return toDate(value)?.format('DD MMM YYYY') ?? empty;
}

/** 21 Oct 2026, 3:34 pm */
export function fWhenTime(value, empty = '—') {
  return toDate(value)?.format('DD MMM YYYY, h:mm a') ?? empty;
}

/** "just now", "5 min ago", "3 h ago", "2 d ago", then the date. Future times read "in 3 d". */
export function fAgo(value, empty = '—') {
  const date = toDate(value);
  if (!date) return empty;

  const seconds = date.diff(dayjs(), 'second');
  const abs = Math.abs(seconds);
  const wrap = (text) => (seconds > 0 ? `in ${text}` : `${text} ago`);

  if (abs < 45) return seconds > 0 ? 'in a moment' : 'just now';
  if (abs < 3600) return wrap(`${Math.round(abs / 60)} min`);
  if (abs < 86400) return wrap(`${Math.round(abs / 3600)} h`);
  if (abs < 86400 * 30) return wrap(`${Math.round(abs / 86400)} d`);

  return fWhen(value);
}

/** Whole days from now to the date (negative once past); null without a date. */
export function daysUntil(value) {
  const date = toDate(value);
  return date ? Math.ceil(date.diff(dayjs(), 'hour') / 24) : null;
}

// ----------------------------------------------------------------------

const integer = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const fInt = (value) => (typeof value === 'number' ? integer.format(value) : '—');

/** 12,345 -> "12.3K" */
export const fCompact = (value) => (typeof value === 'number' ? compact.format(value) : '—');

/** 12.34 -> "12.3%" (`value` is already a percentage). */
export function fPercent(value, digits = 1) {
  if (typeof value !== 'number') return '—';
  return `${value.toFixed(digits).replace(/\.0+$/, '')}%`;
}

export const pluralize = (count, singular, plural = `${singular}s`) =>
  `${fInt(count)} ${count === 1 ? singular : plural}`;

// ----------------------------------------------------------------------

const MINOR_UNITS = 100;
const moneyFormats = new Map();

function moneyFormat(currency, options) {
  const key = `${currency}|${options.compact ? 'c' : 'f'}`;
  if (!moneyFormats.has(key)) {
    // Indian digit grouping (and lakh / crore when compact) for rupees, plain English for everything else.
    moneyFormats.set(
      key,
      new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency,
        ...(options.compact
          ? { notation: 'compact', maximumFractionDigits: 1 }
          : { maximumFractionDigits: 0 }),
      })
    );
  }
  return moneyFormats.get(key);
}

/** Minor units (paise / cents) as money. `compact` for tiles and axes: "₹5.9L", "$16.2K". */
export function fMoney(minor, currency = 'INR', { compact: short = false, exact = false } = {}) {
  if (typeof minor !== 'number') return '—';

  if (exact) {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
    }).format(minor / MINOR_UNITS);
  }

  return moneyFormat(currency, { compact: short })
    .format(minor / MINOR_UNITS)
    .replace(/\.0(?=\D|$)/, '');
}

// ----------------------------------------------------------------------

/**
 * How `current` compares with `previous`.
 * @returns {{ pct: number|null, diff: number, direction: 'up'|'down'|'flat'|'new' }} `new` when there was nothing before.
 */
export function deltaOf(current, previous) {
  const now = Number(current) || 0;
  const before = Number(previous) || 0;
  const diff = now - before;

  if (diff === 0) return { pct: 0, diff, direction: 'flat' };
  if (before === 0) return { pct: null, diff, direction: 'new' };

  return { pct: (diff / Math.abs(before)) * 100, diff, direction: diff > 0 ? 'up' : 'down' };
}

// ----------------------------------------------------------------------

export function fBytes(bytes) {
  if (typeof bytes !== 'number') return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/** 93784 -> "1d 2h" */
export function fUptime(seconds) {
  if (typeof seconds !== 'number') return '—';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Two-letter-style initials for avatars. */
export function initials(name = '') {
  return (
    String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || '?'
  );
}

/** The local calendar day as 'YYYY-MM-DD', `daysBack` days ago. */
export function dayString(daysBack = 0) {
  return dayjs().subtract(daysBack, 'day').format('YYYY-MM-DD');
}

/** "Mozilla/5.0 (Macintosh...) Chrome/124" -> "Chrome on macOS". Good enough to recognise your own sessions. */
export function describeAgent(userAgent) {
  if (!userAgent) return 'Unknown device';

  const ua = userAgent.toLowerCase();
  const browser =
    (/edg\//.test(ua) && 'Edge') ||
    (/opr\/|opera/.test(ua) && 'Opera') ||
    (/firefox|fxios/.test(ua) && 'Firefox') ||
    (/chrome|crios/.test(ua) && 'Chrome') ||
    (/safari/.test(ua) && 'Safari') ||
    (/curl|python|axios|node|postman/.test(ua) && 'Script') ||
    'Browser';
  const system =
    (/android/.test(ua) && 'Android') ||
    (/iphone|ipad|ios/.test(ua) && 'iOS') ||
    (/windows/.test(ua) && 'Windows') ||
    (/macintosh|mac os/.test(ua) && 'macOS') ||
    (/linux|x11/.test(ua) && 'Linux') ||
    null;

  return system ? `${browser} on ${system}` : browser;
}
