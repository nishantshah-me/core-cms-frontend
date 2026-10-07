import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------
// SEO guidance. The hard limits mirror the backend's validation; the "recommended"
// values are the points where search engines typically start truncating.
// ----------------------------------------------------------------------

export const META_TITLE_MAX = 70;
export const META_TITLE_RECOMMENDED = 60;
export const META_DESCRIPTION_MAX = 160;
export const META_DESCRIPTION_MIN = 70;
export const SUMMARY_MAX = 320;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Same rules as the backend's slugify, so the preview matches what will be saved. */
export function slugify(value, maxLength = 200) {
  return String(value || '')
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/, '');
}

/** Cuts at a word boundary and adds an ellipsis, like a search engine would. */
export function truncate(text, limit) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit - 1);
  const atWord = cut.lastIndexOf(' ') > limit * 0.6 ? cut.slice(0, cut.lastIndexOf(' ')) : cut;
  return `${atWord.replace(/[\s,.;:-]+$/, '')}…`;
}

export const siteHost = () => {
  try {
    return new URL(CONFIG.marketingSiteUrl).host;
  } catch {
    return CONFIG.marketingSiteUrl;
  }
};

export const publicPostUrl = (slug) => `${CONFIG.marketingSiteUrl}/blog/${slug}`;

export function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ----------------------------------------------------------------------
// Status
// ----------------------------------------------------------------------

export const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const STATUS_LABELS = {
  DRAFT: { label: 'Draft', color: 'default' },
  PUBLISHED: { label: 'Published', color: 'success' },
  SCHEDULED: { label: 'Scheduled', color: 'info' },
  ARCHIVED: { label: 'Archived', color: 'warning' },
};

/** A PUBLISHED post with a future date isn't live yet: show it as Scheduled. */
export const statusKey = (post) =>
  post.status === 'PUBLISHED' && post.is_scheduled ? 'SCHEDULED' : post.status;

export const statusLabel = (post) => STATUS_LABELS[statusKey(post)] || STATUS_LABELS.DRAFT;
