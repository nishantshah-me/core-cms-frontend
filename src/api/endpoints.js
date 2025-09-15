export const endpoints = {
  employee: {
    login: '/employee/login',
  },
  company: {
    // Owner related endpoints
    send_otp: '/company/company-owner/send-otp',
    verify_otp: '/company/company-owner/verify-otp',
    get_company_owners: '/company/company-owners', // Fixed typo
    update_company_owner: '/company/update-company-owner', // New endpoint
    delete_company_owner: '/company/delete-company-owner', // New endpoint

    // Company info endpoints
    create_company: '/company/info',
    company_list: '/company/company-list',
    update_company: '/company/info', // PATCH endpoint
    delete_company: '/company/delete-company', // New endpoint
  },
};
