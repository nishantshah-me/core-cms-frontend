import axiosInstance from 'src/api/axiosInstance';
import { endpoints } from 'src/api/endpoints';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------
// Blog admin API (backend: app/api/cms_blog/admin_endpoints.py).
//
// These calls go through the shared axiosInstance, so they use the same signed-in admin as the
// rest of the dashboard: the Bearer token is attached, an expired one is refreshed, and a dead
// session sends the user back to /sign-in. There is no separate blog login.
//
// Every function resolves to the response body and rejects with the raw axios error; present
// it with describeApiError(). Request URLs must start with CONFIG.apiUrl, because that is how
// the interceptor knows to attach the token.
// ----------------------------------------------------------------------

const url = (path) => `${CONFIG.apiUrl}${path}`;
const body = (response) => response.data;
const withoutEmpty = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );

/** { items, page, limit, total, total_pages, counts: { all, draft, published, scheduled, archived } } */
export const listBlogs = (params, { signal } = {}) =>
  axiosInstance.get(url(endpoints.blogs.list), { params: withoutEmpty(params), signal }).then(body);

export const getBlog = (blogId) => axiosInstance.get(url(endpoints.blogs.details(blogId))).then(body);

export const createBlog = (payload) => axiosInstance.post(url(endpoints.blogs.list), payload).then(body);

/** Only the fields present in `payload` change. */
export const updateBlog = (blogId, payload) =>
  axiosInstance.put(url(endpoints.blogs.details(blogId)), payload).then(body);

export const deleteBlog = (blogId) => axiosInstance.delete(url(endpoints.blogs.details(blogId))).then(body);

/** -> { url, width, height, size_bytes, content_type }. `onProgress(percent)` is optional. */
export const uploadBlogImage = (file, onProgress) => {
  const form = new FormData();
  form.append('file', file);
  return axiosInstance
    .post(url(endpoints.blogs.uploadImage), form, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded * 100) / event.total));
      },
    })
    .then(body);
};

/** Renders Markdown exactly as the public site will -> { html, toc, reading_time_minutes } */
export const previewMarkdown = (content, { signal } = {}) =>
  axiosInstance.post(url(endpoints.blogs.preview), { content }, { signal }).then(body);

export const listBlogCategories = () => axiosInstance.get(url(endpoints.blogs.categories)).then(body);

export const createBlogCategory = (payload) =>
  axiosInstance.post(url(endpoints.blogs.categories), payload).then(body);

export const updateBlogCategory = (categoryId, payload) =>
  axiosInstance.put(url(endpoints.blogs.category(categoryId)), payload).then(body);

export const deleteBlogCategory = (categoryId) =>
  axiosInstance.delete(url(endpoints.blogs.category(categoryId))).then(body);

// ----------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------

const cleanMessage = (message) => String(message || '').replace(/^Value error,\s*/i, '');

/**
 * Turns whatever the backend (or the network) threw into
 * { status, message, fieldErrors: { <field>: message }, suggestedSlug }.
 * FastAPI reports validation as [{ loc: ['body', 'field'], msg }], rule failures the same
 * way, and conflicts/other errors as a string or { message, field, suggested_slug }.
 */
export function describeApiError(error, fallback = 'Something went wrong. Please try again.') {
  const status = error?.response?.status ?? null;
  const detail = error?.response?.data?.detail;
  const result = { status, message: fallback, fieldErrors: {}, suggestedSlug: null };

  if (!error?.response) {
    result.message =
      error?.code === 'ECONNABORTED'
        ? 'The request timed out. Please try again.'
        : 'Cannot reach the server. Check your connection and try again.';
  } else if (Array.isArray(detail)) {
    detail.forEach((item) => {
      const field = Array.isArray(item.loc) ? item.loc.filter((part) => part !== 'body').join('.') : '';
      const message = cleanMessage(item.msg);
      if (field && !result.fieldErrors[field]) result.fieldErrors[field] = message;
    });
    result.message = cleanMessage(detail[0]?.msg) || fallback;
  } else if (detail && typeof detail === 'object') {
    result.message = detail.message || fallback;
    if (detail.field) result.fieldErrors[detail.field] = result.message;
    result.suggestedSlug = detail.suggested_slug || null;
  } else if (typeof detail === 'string') {
    result.message = detail;
  } else if (status === 403) {
    result.message = 'You don’t have permission to do that.';
  }
  return result;
}
