import { CONFIG } from 'src/global-config';

import { OverviewView } from 'src/sections/overview/overview-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Overview | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <OverviewView />;
}
