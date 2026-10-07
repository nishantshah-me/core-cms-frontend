import { Suspense } from 'react';

import { CONFIG } from 'src/global-config';

import { BlogEditRoute } from 'src/components/blog/blog-edit-route';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit blog post | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  // useSearchParams (for ?id=) needs a Suspense boundary during the build.
  return (
    <Suspense fallback={null}>
      <BlogEditRoute />
    </Suspense>
  );
}
