import { CONFIG } from 'src/global-config';

import { AuditView } from 'src/sections/audit/audit-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Audit log | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <AuditView />;
}
