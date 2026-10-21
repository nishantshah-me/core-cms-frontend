// How the audit log names things. Actions look like "owner.password_reset": a category, then what happened.

const WORDS = {
  auth: 'Sign-in',
  billing: 'Billing',
  blog: 'Blog',
  owner: 'Owner',
  signup: 'Signup',
  workspace: 'Workspace',
  admin_session: 'Admin session',
  seed: 'System',
  cli: 'Command line',
};

// Plain-English names for every action the backend records; anything new falls back to a generic rewording.
const KNOWN_ACTIONS = {
  'auth.login': 'Signed in',
  'auth.login_failed': 'Failed sign-in',
  'auth.locked': 'Account locked',
  'auth.logout': 'Signed out',
  'auth.logout_all': 'Signed out everywhere',
  'auth.password_changed': 'Password changed',
  'auth.mfa_setup_started': 'Authenticator setup started',
  'auth.mfa_enabled': 'Authenticator enabled',
  'auth.refresh_token_reused': 'Refresh token reused',
  'seed.admin_created': 'Admin created at startup',
  'cli.admin_created': 'Admin created (command line)',
  'cli.password_reset': 'Password reset (command line)',
  'cli.mfa_reset': 'Authenticator reset (command line)',
  'owner.created': 'Owner added',
  'owner.updated': 'Owner updated',
  'owner.deleted': 'Owner deleted',
  'owner.password_reset': 'Owner password reset',
  'owner.signed_out': 'Owner signed out',
  'owner.two_factor_reset': 'Owner 2FA reset',
  'signup.approved': 'Signup approved',
  'signup.rejected': 'Signup rejected',
  'billing.settings_updated': 'Billing settings changed',
  'billing.plan_updated': 'Plan edited',
  'billing.price_updated': 'Price changed',
  'billing.razorpay_synced': 'Razorpay plans synced',
  'workspace.trial_extended': 'Trial extended',
  'admin_session.revoked': 'Admin session ended',
  'blog.created': 'Blog post created',
  'blog.updated': 'Blog post updated',
  'blog.deleted': 'Blog post deleted',
  'blog.image_uploaded': 'Blog image uploaded',
  'blog.category_created': 'Blog category created',
  'blog.category_updated': 'Blog category updated',
  'blog.category_deleted': 'Blog category deleted',
};

/** "owner.password_reset" -> { area: "Owner", what: "password reset" } */
export function describeAction(action = '') {
  const [category, ...rest] = action.split('.');
  return {
    area: WORDS[category] ?? category.replace(/_/g, ' '),
    what: (rest.join(' ') || category).replace(/_/g, ' '),
  };
}

/** "Owner password reset" for one-line mentions. */
export function fAction(action) {
  if (KNOWN_ACTIONS[action]) return KNOWN_ACTIONS[action];

  const { area, what } = describeAction(action);
  return what === action ? area : `${area} ${what}`;
}

/** Categories that mean "something is wrong or someone is probing", for colouring. */
export const SECURITY_ACTIONS = new Set([
  'auth.login_failed',
  'auth.locked',
  'auth.refresh_token_reused',
]);

export const CATEGORY_COLORS = {
  auth: 'warning',
  owner: 'info',
  signup: 'success',
  billing: 'secondary',
  workspace: 'primary',
  blog: 'default',
  admin_session: 'warning',
};
