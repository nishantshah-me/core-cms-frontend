import { CONFIG } from 'src/global-config';

import { BlogListView } from 'src/components/blog/blog-list-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Blogs | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <BlogListView />;
}
