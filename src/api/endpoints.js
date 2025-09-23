// src/api/endpoints.js
export const endpoints = {
  auth: {
    signIn: '/token?grant_type=password',
  },
  company: {
    send_otp: '/company/company-owner/send-otp',
    verify_otp: '/company/company-owner/verify-otp',
    get_company_owners: '/company/company-owners',
    update_company_owner: '/company/update-company-owner',
    delete_company_owner: '/company/delete-company-owner',

    create_company: '/company/info',
    company_list: '/company/company-list',
    update_company: '/company/info',
    delete_company: '/company/delete-company',
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
