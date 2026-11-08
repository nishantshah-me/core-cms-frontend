import { CONFIG } from 'src/global-config';

import { AiProvidersView } from 'src/sections/ai-providers/ai-providers-view';

// ----------------------------------------------------------------------

export const metadata = { title: `AI providers | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <AiProvidersView />;
}
