import { Suspense } from 'react';

import { CONFIG } from 'src/global-config';

import { BlogAdminGate } from 'src/components/blog/blog-admin-gate';
import { BlogEditRoute } from 'src/components/blog/blog-edit-route';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit blog post | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  // useSearchParams (for ?id=) needs a Suspense boundary during the build.
  return (
    <BlogAdminGate>
      <Suspense fallback={null}>
        <BlogEditRoute />
      </Suspense>
    </BlogAdminGate>
  );
}
