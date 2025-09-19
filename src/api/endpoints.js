export const endpoints = {
  auth: {
    signIn: '/token?grant_type=password',
  },
  company: {
    // Owner related endpoints
    send_otp: '/company/company-owner/send-otp',
    verify_otp: '/company/company-owner/verify-otp',
    get_company_owners: '/company/company-owners',
    update_company_owner: '/company/update-company-owner',
    delete_company_owner: '/company/delete-company-owner',

    // Company info endpoints
    create_company: '/company/info',
    company_list: '/company/company-list',
    update_company: '/company/info',
    delete_company: '/company/delete-company',
  },
};
