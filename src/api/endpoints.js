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
    // Support actions (backend owner_endpoints.py); each one signs the owner out everywhere.
    resetPassword: (id) => `/admin/owners/${encodeURIComponent(id)}/reset-password`,
    signOut: (id) => `/admin/owners/${encodeURIComponent(id)}/sign-out`,
    resetTwoFactor: (id) => `/admin/owners/${encodeURIComponent(id)}/reset-2fa`,
  },
  // Read-only platform reports (backend app/api/admin/analytics_endpoints.py): KPIs, growth, engagement, adoption,
  // cohorts and the signup funnel.
  analytics: {
    overview: '/admin/analytics/overview',
    growth: '/admin/analytics/growth',
    distribution: '/admin/analytics/distribution',
    engagement: '/admin/analytics/engagement',
    adoption: '/admin/analytics/adoption',
    cohorts: '/admin/analytics/cohorts',
    funnel: '/admin/analytics/funnel',
  },
  // Workspaces and companies across every tenant (backend workspace_endpoints.py).
  workspaces: {
    list: '/admin/workspaces',
    details: (id) => `/admin/workspaces/${encodeURIComponent(id)}`,
    extendTrial: (id) => `/admin/workspaces/${encodeURIComponent(id)}/extend-trial`,
  },
  companies: { list: '/admin/companies' },
  // Subscriptions, payments and the Razorpay event log (backend revenue_endpoints.py).
  subscriptions: { list: '/admin/subscriptions' },
  payments: { list: '/admin/payments' },
  webhooks: { list: '/admin/webhooks' },
  // The platform itself (backend platform_endpoints.py): audit log, system status, admin team and its sessions.
  auditLogs: { list: '/admin/audit-logs' },
  system: { status: '/admin/system/status' },
  team: {
    list: '/admin/team',
    session: (id) => `/admin/team/sessions/${encodeURIComponent(id)}`,
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
  // Billing configuration (backend app/api/admin/billing_endpoints.py): the master switch, currencies, trial
  // length, plans and per-seat prices, and creating the matching Razorpay plans.
  billing: {
    root: '/admin/billing',
    settings: '/admin/billing/settings',
    plan: (key) => `/admin/billing/plans/${encodeURIComponent(key)}`,
    prices: (key) => `/admin/billing/plans/${encodeURIComponent(key)}/prices`,
    razorpaySync: '/admin/billing/razorpay/sync',
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
