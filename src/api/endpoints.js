export const endpoints = {
  // Platform-admin console auth (backend app/api/admin). Login is two steps: password -> mfa_token,
  // then an authenticator code (or first-time setup) -> access + refresh tokens.
  auth: {
    signIn: '/admin/auth/login',
    mfaSetup: '/admin/auth/mfa/setup',
    mfaConfirm: '/admin/auth/mfa/confirm',
    mfaVerify: '/admin/auth/mfa/verify',
    refresh: '/admin/auth/refresh',
    logout: '/admin/auth/logout',
    me: '/admin/auth/me',
  },
  // Workspace owners in the admin console (backend app/api/admin/owner_endpoints.py). Approving or
  // rejecting a pending signup is a separate route (app/api/admin/signup_endpoints.py).
  owners: {
    list: '/admin/owners',
    details: (id) => `/admin/owners/${encodeURIComponent(id)}`,
    approve: (id) => `/admin/signups/${encodeURIComponent(id)}/approve`,
    reject: (id) => `/admin/signups/${encodeURIComponent(id)}/reject`,
  },
  // Blog posts published to the marketing site's journal (backend app/api/cms_blog/admin_endpoints.py).
  // Same admin identity and Bearer token as the rest of the console.
  blogs: {
    list: '/api/v1/admin/blogs',
    details: (id) => `/api/v1/admin/blogs/${encodeURIComponent(id)}`,
    uploadImage: '/api/v1/admin/blogs/upload-image',
    preview: '/api/v1/admin/blogs/preview',
    categories: '/api/v1/admin/blogs/categories',
    category: (id) => `/api/v1/admin/blogs/categories/${encodeURIComponent(id)}`,
  },
  company: {
    send_otp: '/company/company-owner/send-otp',
    verify_otp: '/company/company-owner/verify-otp',
    get_company_owners: '/company/company-owners',
    update_company_owner: '/company/update-company-owner',
    delete_company_owner: '/company/delete-company-owner',
    get_company_owner: (id) => `/company/get-company-owner/${encodeURIComponent(id)}`,

    create_company: '/company/info',
    company_list: '/company/company-list',
    update_company: '/company/info',
    delete_company: '/company/delete-company',
    get_company: (id) => `/company/info/${encodeURIComponent(id)}`,
  },
  jobs: {
    list: '/job_openings',
    create: '/job_openings',
    update: (id) => `/job_openings?id=eq.${encodeURIComponent(id)}`,
    details: (id) => `/job_openings?id=eq.${encodeURIComponent(id)}`,
    applications:
      '/job_applications?select=*,job_openings(*),candidates(*)&order=submitted_at.desc',
    applicationsByJob: (id) =>
      `/job_applications?job_id=eq.${encodeURIComponent(
        id
      )}&select=*,job_openings(*),candidates(*)&order=submitted_at.desc`,
  },
};
