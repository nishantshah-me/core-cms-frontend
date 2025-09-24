/* eslint-disable perfectionist/sort-imports */

'use client';

import { useEffect } from 'react';

import { useRouter } from 'src/routes/hooks';

// import { CONFIG } from 'src/global-config';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // router.push(CONFIG.auth.redirectPath);
    router.push('/sign-in');
  }, [router]);

  return null;
}
