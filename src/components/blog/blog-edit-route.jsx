'use client';

import { useSearchParams } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';

import { BlogEditorView } from './blog-editor-view';

// ----------------------------------------------------------------------

/** /dashboard/blogs/edit?id=<post id> (same ?id= convention as the other edit pages). */
export function BlogEditRoute() {
  const id = useSearchParams().get('id');

  if (!id) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">No post was selected. Choose one from the blog list.</Alert>
      </Container>
    );
  }
  // Keyed so moving between two posts starts from a clean form.
  return <BlogEditorView key={id} blogId={id} />;
}
