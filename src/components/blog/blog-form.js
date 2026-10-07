import * as z from 'zod';
import dayjs from 'dayjs';

import {
  SUMMARY_MAX,
  META_TITLE_MAX,
  META_DESCRIPTION_MAX,
} from './blog-utils';

// ----------------------------------------------------------------------
// The editor's form model. Everything is a plain string/array so inputs stay controlled;
// emptiness is turned into null (or omitted) only when the payload is built.
// ----------------------------------------------------------------------

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !/\s/.test(value);
  } catch {
    return false;
  }
};

const optionalUrl = z
  .string()
  .trim()
  .max(1024, { error: 'Must be 1024 characters or fewer' })
  .refine((value) => !value || isHttpUrl(value), { error: 'Must be an absolute http(s) URL' });

const jsonObjectText = z.string().refine(
  (value) => {
    if (!value.trim()) return true;
    try {
      const parsed = JSON.parse(value);
      return !!parsed && typeof parsed === 'object' && !Array.isArray(parsed);
    } catch {
      return false;
    }
  },
  { error: 'Must be a valid JSON object' }
);

const labelList = (max, noun) =>
  z.array(z.string()).max(max, { error: `At most ${max} ${noun} are allowed` });

export const blogSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { error: 'Title is required' })
      .max(255, { error: 'Title must be 255 characters or fewer' }),
    slug: z
      .string()
      .trim()
      .max(200, { error: 'Slug must be 200 characters or fewer' })
      .refine((value) => !value || SLUG_PATTERN.test(value), {
        error: 'Use lowercase letters, numbers and single hyphens only (e.g. my-first-post)',
      }),
    summary: z.string().trim().max(SUMMARY_MAX, { error: `Keep the summary under ${SUMMARY_MAX} characters` }),
    content: z.string().max(200000, { error: 'Content is too long' }),
    cover_image_url: z.string(),
    cover_image_alt: z.string().trim().max(255, { error: 'Alt text must be 255 characters or fewer' }),

    meta_title: z.string().trim().max(META_TITLE_MAX, { error: `Meta title can be at most ${META_TITLE_MAX} characters` }),
    meta_description: z
      .string()
      .trim()
      .max(META_DESCRIPTION_MAX, { error: `Meta description can be at most ${META_DESCRIPTION_MAX} characters` }),
    canonical_url: optionalUrl,
    og_image_url: optionalUrl,
    schema_json_ld: jsonObjectText,
    focus_keywords: labelList(10, 'keywords'),

    category: z.object({ id: z.string(), name: z.string(), slug: z.string() }).nullable(),
    tags: labelList(15, 'tags'),

    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    published_at: z.string().nullable(),
  })
  .superRefine((values, ctx) => {
    const add = (path, message) => ctx.addIssue({ code: 'custom', path: [path], message });
    if (values.cover_image_url && !values.cover_image_alt) {
      add('cover_image_alt', 'Alt text is required for the cover image');
    }
    if (values.status === 'PUBLISHED') {
      if (!values.summary) add('summary', 'A summary is required to publish');
      if (!values.content.trim()) add('content', 'Content is required to publish');
    }
  });

export const BLOG_DEFAULT_VALUES = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  cover_image_url: '',
  cover_image_alt: '',
  meta_title: '',
  meta_description: '',
  canonical_url: '',
  og_image_url: '',
  schema_json_ld: '',
  focus_keywords: [],
  category: null,
  tags: [],
  status: 'DRAFT',
  published_at: null,
};

/** API post -> form values */
export function postToFormValues(post) {
  return {
    title: post.title || '',
    slug: post.slug || '',
    summary: post.summary || '',
    content: post.content || '',
    cover_image_url: post.cover_image_url || '',
    cover_image_alt: post.cover_image_alt || '',
    meta_title: post.meta_title || '',
    meta_description: post.meta_description || '',
    canonical_url: post.canonical_url || '',
    og_image_url: post.og_image_url || '',
    schema_json_ld: post.schema_json_ld ? JSON.stringify(post.schema_json_ld, null, 2) : '',
    focus_keywords: post.focus_keywords || [],
    category: post.category
      ? { id: post.category.id, name: post.category.name, slug: post.category.slug }
      : null,
    tags: post.tags || [],
    status: post.status || 'DRAFT',
    published_at: post.published_at || null,
  };
}

const orNull = (value) => (value && String(value).trim() ? String(value).trim() : null);

/**
 * Form values -> API payload.
 * `includeSlug`: send the slug only when the author chose it (or changed it). Otherwise the
 * server generates a unique one, so an automatic slug can never collide with another post.
 */
export function formValuesToPayload(values, { includeSlug }) {
  const payload = {
    title: values.title.trim(),
    summary: orNull(values.summary),
    content: values.content,
    cover_image_url: orNull(values.cover_image_url),
    cover_image_alt: orNull(values.cover_image_alt),
    meta_title: orNull(values.meta_title),
    meta_description: orNull(values.meta_description),
    canonical_url: orNull(values.canonical_url),
    og_image_url: orNull(values.og_image_url),
    schema_json_ld: values.schema_json_ld.trim() ? JSON.parse(values.schema_json_ld) : null,
    focus_keywords: values.focus_keywords,
    category_id: values.category?.id ?? null,
    tags: values.tags,
    status: values.status,
  };
  if (includeSlug && values.slug.trim()) payload.slug = values.slug.trim();

  // A blank date on a published post means "now" (or "keep the original"): leave it out.
  if (values.status === 'PUBLISHED' && values.published_at) {
    const date = dayjs(values.published_at);
    if (date.isValid()) payload.published_at = date.toISOString();
  }
  return payload;
}

export const isFuture = (value) => !!value && dayjs(value).isValid() && dayjs(value).isAfter(dayjs());
