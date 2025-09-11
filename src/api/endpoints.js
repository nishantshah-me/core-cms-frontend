export const endpoints = {
  employee: {
    login: '/employee/login',
  },
  company: {
    // Owner related endpoints
    send_otp: '/company/company-owner/send-otp',
    verify_otp: '/company/company-owner/verify-otp',
    get_company_owners: '/company/get-comapny-owners',
    // Company info endpoint
    create_company: '/company/info',
    company_list: '/company/company_list',
  },
};
