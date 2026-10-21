import { Suspense } from 'react';

import { CONFIG } from 'src/global-config';

import { WorkspacesView } from 'src/sections/workspaces/workspaces-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Workspaces | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  // The list reads its starting filters from the URL, which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <WorkspacesView />
    </Suspense>
  );
}
