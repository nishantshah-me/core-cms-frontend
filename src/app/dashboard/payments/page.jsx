import { Suspense } from 'react';

import { CONFIG } from 'src/global-config';

import { PaymentsView } from 'src/sections/payments/payments-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Payments | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaymentsView />
    </Suspense>
  );
}
