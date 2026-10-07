import { adminApi } from './platformAdminService';

// ----------------------------------------------------------------------
// Blog admin API (backend: app/api/cms_blog/admin_endpoints.py). Every call resolves to
// the response body and rejects with the raw axios error; use describeApiError() from
// platformAdminService to present it.
// ----------------------------------------------------------------------

const body = (response) => response.data;
const withoutEmpty = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
const id = (value) => encodeURIComponent(value);

/** { items, page, limit, total, total_pages, counts: { all, draft, published, scheduled, archived } } */
export const listBlogs = (params, { signal } = {}) =>
  adminApi.get('/blogs', { params: withoutEmpty(params), signal }).then(body);

export const getBlog = (blogId) => adminApi.get(`/blogs/${id(blogId)}`).then(body);

export const createBlog = (payload) => adminApi.post('/blogs', payload).then(body);

/** Only the fields present in `payload` change. */
export const updateBlog = (blogId, payload) => adminApi.put(`/blogs/${id(blogId)}`, payload).then(body);

export const deleteBlog = (blogId) => adminApi.delete(`/blogs/${id(blogId)}`).then(body);

/** -> { url, width, height, size_bytes, content_type }. `onProgress(percent)` is optional. */
export const uploadBlogImage = (file, onProgress) => {
  const form = new FormData();
  form.append('file', file);
  return adminApi
    .post('/blogs/upload-image', form, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded * 100) / event.total));
      },
    })
    .then(body);
};

/** Renders Markdown exactly as the public site will -> { html, toc, reading_time_minutes } */
export const previewMarkdown = (content, { signal } = {}) =>
  adminApi.post('/blogs/preview', { content }, { signal }).then(body);

export const listBlogCategories = () => adminApi.get('/blogs/categories').then(body);

export const createBlogCategory = (payload) => adminApi.post('/blogs/categories', payload).then(body);

export const updateBlogCategory = (categoryId, payload) =>
  adminApi.put(`/blogs/categories/${id(categoryId)}`, payload).then(body);

export const deleteBlogCategory = (categoryId) =>
  adminApi.delete(`/blogs/categories/${id(categoryId)}`).then(body);
