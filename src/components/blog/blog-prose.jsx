'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

/**
 * Article HTML as the public site shows it. The HTML comes from the backend's Markdown
 * renderer (raw HTML escaped, links restricted), and is sanitised once more here because
 * this page holds an admin's credentials. Only ever render it client-side, after data has
 * loaded: without a DOM, DOMPurify can't sanitise.
 */
export function BlogProse({ html, sx }) {
  const clean = useMemo(
    () => (typeof window === 'undefined' ? '' : DOMPurify.sanitize(html || '', { ADD_ATTR: ['loading', 'decoding'] })),
    [html]
  );

  return (
    <Box
      className="blog-prose"
      dangerouslySetInnerHTML={{ __html: clean }}
      sx={[
        (theme) => ({
          color: 'text.primary',
          typography: 'body1',
          lineHeight: 1.8,
          overflowWrap: 'anywhere',
          '& > :first-of-type': { mt: 0 },
          '& h2': { ...theme.typography.h4, mt: 5, mb: 2 },
          '& h3': { ...theme.typography.h5, mt: 4, mb: 1.5 },
          '& h4, & h5, & h6': { ...theme.typography.h6, mt: 3, mb: 1 },
          '& p': { my: 2 },
          '& ul, & ol': { pl: 3, my: 2 },
          '& li': { my: 0.5 },
          '& a': { color: 'primary.main', textDecoration: 'underline' },
          '& img': { display: 'block', maxWidth: 1, height: 'auto', borderRadius: 1.5, my: 3 },
          '& blockquote': {
            m: 0,
            my: 3,
            px: 3,
            py: 1,
            color: 'text.secondary',
            borderLeft: `4px solid ${theme.vars.palette.divider}`,
            bgcolor: 'background.neutral',
            borderRadius: '0 8px 8px 0',
          },
          '& code': {
            px: 0.75,
            py: 0.25,
            borderRadius: 0.75,
            fontSize: '0.9em',
            bgcolor: 'background.neutral',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          },
          '& pre': {
            p: 2,
            my: 3,
            overflowX: 'auto',
            borderRadius: 1.5,
            bgcolor: 'grey.900',
            color: 'common.white',
          },
          '& pre code': { p: 0, bgcolor: 'transparent', color: 'inherit' },
          '& table': { display: 'block', overflowX: 'auto', borderCollapse: 'collapse', my: 3 },
          '& th, & td': { border: `1px solid ${theme.vars.palette.divider}`, px: 1.5, py: 1, textAlign: 'left' },
          '& th': { bgcolor: 'background.neutral' },
          '& hr': { my: 4, border: 0, borderTop: `1px solid ${theme.vars.palette.divider}` },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
