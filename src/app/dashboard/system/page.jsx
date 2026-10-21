import { CONFIG } from 'src/global-config';

import { SystemView } from 'src/sections/system/system-view';

// ----------------------------------------------------------------------

export const metadata = { title: `System health | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <SystemView />;
}
