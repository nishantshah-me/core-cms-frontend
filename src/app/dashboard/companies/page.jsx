import { CONFIG } from 'src/global-config';

import { CompaniesView } from 'src/sections/companies/companies-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Companies | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <CompaniesView />;
}
