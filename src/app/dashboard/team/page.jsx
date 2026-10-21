import { CONFIG } from 'src/global-config';

import { TeamView } from 'src/sections/team/team-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Admin team | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <TeamView />;
}
