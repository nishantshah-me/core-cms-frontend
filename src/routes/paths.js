// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      // The back-office login lives at /sign-in (see src/app/sign-in); /auth/jwt/sign-in is a leftover duplicate.
      signIn: '/sign-in',
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    two: `${ROOTS.DASHBOARD}/two`,
    three: `${ROOTS.DASHBOARD}/three`,
    owners: `${ROOTS.DASHBOARD}/owners`,
    ownerNew: `${ROOTS.DASHBOARD}/owners/create-owner`,
    ownerEdit: (id) => `${ROOTS.DASHBOARD}/owners/create-owner?owner_id=${encodeURIComponent(id)}`,
    ownerDetails: (id) =>
      `${ROOTS.DASHBOARD}/owners/owner-detail?owner_id=${encodeURIComponent(id)}`,
    owners_Test: `${ROOTS.DASHBOARD}/owners-2`,
    company: `${ROOTS.DASHBOARD}/company`,
    blogs: {
      root: `${ROOTS.DASHBOARD}/blogs`,
      new: `${ROOTS.DASHBOARD}/blogs/new`,
      edit: (id) => `${ROOTS.DASHBOARD}/blogs/edit?id=${encodeURIComponent(id)}`,
    },
    onboarding: `${ROOTS.DASHBOARD}/onboarding`,
    group: {
      root: `${ROOTS.DASHBOARD}/group`,
      five: `${ROOTS.DASHBOARD}/group/five`,
      six: `${ROOTS.DASHBOARD}/group/six`,
    },
  },
};
