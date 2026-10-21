import { CONFIG } from 'src/global-config';

import { AnalyticsView } from 'src/sections/analytics/analytics-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Analytics | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <AnalyticsView />;
}
