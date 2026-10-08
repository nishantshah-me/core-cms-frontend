import { CONFIG } from 'src/global-config';

import { BillingView } from 'src/sections/billing/billing-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Billing | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <BillingView />;
}
