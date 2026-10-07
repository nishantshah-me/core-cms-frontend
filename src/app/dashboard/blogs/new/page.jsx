import { CONFIG } from 'src/global-config';

import { BlogAdminGate } from 'src/components/blog/blog-admin-gate';
import { BlogEditorView } from 'src/components/blog/blog-editor-view';

// ----------------------------------------------------------------------

export const metadata = { title: `New blog post | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <BlogAdminGate>
      <BlogEditorView />
    </BlogAdminGate>
  );
}
