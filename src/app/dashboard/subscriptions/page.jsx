import { Suspense } from 'react';

import { CONFIG } from 'src/global-config';

import { SubscriptionsView } from 'src/sections/subscriptions/subscriptions-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Subscriptions | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SubscriptionsView />
    </Suspense>
  );
}
