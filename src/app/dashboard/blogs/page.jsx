import { CONFIG } from 'src/global-config';

import { BlogListView } from 'src/components/blog/blog-list-view';
import { BlogAdminGate } from 'src/components/blog/blog-admin-gate';

// ----------------------------------------------------------------------

export const metadata = { title: `Blogs | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <BlogAdminGate>
      <BlogListView />
    </BlogAdminGate>
  );
}
