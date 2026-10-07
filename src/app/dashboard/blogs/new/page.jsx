import { CONFIG } from 'src/global-config';

import { BlogEditorView } from 'src/components/blog/blog-editor-view';

// ----------------------------------------------------------------------

export const metadata = { title: `New blog post | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <BlogEditorView />;
}
