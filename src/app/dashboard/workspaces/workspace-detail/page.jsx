import { Suspense } from 'react';

import { CONFIG } from 'src/global-config';

import { WorkspaceDetailView } from 'src/sections/workspaces/workspace-detail-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Workspace | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <WorkspaceDetailView />
    </Suspense>
  );
}
