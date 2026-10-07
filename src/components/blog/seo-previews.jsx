'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

import { siteHost, truncate, META_TITLE_RECOMMENDED, META_DESCRIPTION_MAX } from './blog-utils';

// ----------------------------------------------------------------------
// Approximations of how a post will look in Google and when it's shared. They apply the
// same fallbacks the website uses (meta title -> title, meta description -> summary,
// OG image -> cover image), so what is shown here is what the page will declare.
// ----------------------------------------------------------------------

/** Effective values after the fallbacks. */
export function resolveSeo(values) {
  const title = values.meta_title?.trim() || values.title?.trim() || 'Untitled post';
  const description =
    values.meta_description?.trim() || truncate(values.summary || '', META_DESCRIPTION_MAX) || 'No description yet.';
  return {
    title,
    description,
    image: values.og_image_url?.trim() || values.cover_image_url || '',
    slug: values.slug?.trim() || '',
  };
}

export function SerpPreview({ values }) {
  const { title, description, slug } = resolveSeo(values);
  return (
    <Box aria-label="Google search result preview" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
      <Typography variant="caption" color="text.secondary" noWrap component="div">
        {siteHost()} › blog › {slug || 'your-post'}
      </Typography>
      <Typography
        component="div"
        sx={{ color: '#1a0dab', fontSize: 18, lineHeight: 1.3, my: 0.25, '@media (prefers-color-scheme: dark)': { color: '#8ab4f8' } }}
      >
        {truncate(title, META_TITLE_RECOMMENDED)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.5 }}>
        {truncate(description, META_DESCRIPTION_MAX)}
      </Typography>
    </Box>
  );
}

export function SocialPreview({ values }) {
  const { title, description, image } = resolveSeo(values);
  return (
    <Box
      aria-label="Social share preview"
      sx={{ borderRadius: 1.5, overflow: 'hidden', border: (theme) => `1px solid ${theme.vars.palette.divider}` }}
    >
      {image ? (
        <Box component="img" src={image} alt="" sx={{ width: 1, aspectRatio: '1.91 / 1', objectFit: 'cover', display: 'block' }} />
      ) : (
        <Stack alignItems="center" justifyContent="center" sx={{ aspectRatio: '1.91 / 1', bgcolor: 'background.neutral', color: 'text.disabled' }}>
          <ImageOutlinedIcon />
          <Typography variant="caption">Add a cover or social image</Typography>
        </Stack>
      )}
      <Box sx={{ p: 1.5, bgcolor: 'background.neutral' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
          {siteHost()}
        </Typography>
        <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
          {truncate(title, 90)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {truncate(description, 130)}
        </Typography>
      </Box>
    </Box>
  );
}
