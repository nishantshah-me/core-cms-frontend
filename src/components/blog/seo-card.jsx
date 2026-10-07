'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { Field } from 'src/components/hook-form';

import { SerpPreview, SocialPreview } from './seo-previews';
import {
  META_TITLE_MAX,
  META_DESCRIPTION_MAX,
  META_DESCRIPTION_MIN,
  META_TITLE_RECOMMENDED,
} from './blog-utils';

// ----------------------------------------------------------------------

/** "34/70": amber past the point search engines start cutting text off, red past the hard limit. */
export function CharacterCounter({
  length,
  max,
  recommended,
  minimum,
  sx,
  recommendedHint = 'May be cut off in search results',
}) {
  let color = 'text.secondary';
  let hint = '';
  if (length > max) {
    color = 'error.main';
    hint = `${length - max} over the ${max} character limit`;
  } else if (recommended && length > recommended) {
    color = 'warning.main';
    hint = recommendedHint;
  } else if (minimum && length > 0 && length < minimum) {
    color = 'warning.main';
    hint = 'A little short: aim for a fuller description';
  }
  return (
    <Typography variant="caption" sx={[{ color, display: 'block' }, ...(Array.isArray(sx) ? sx : [sx])]} aria-live="polite">
      {length}/{max}
      {hint && ` · ${hint}`}
    </Typography>
  );
}

export function SeoCard() {
  const { control } = useFormContext();
  const [title, slug, summary, metaTitle, metaDescription, coverImage, ogImage] = useWatch({
    control,
    name: ['title', 'slug', 'summary', 'meta_title', 'meta_description', 'cover_image_url', 'og_image_url'],
  });
  const preview = {
    title,
    slug,
    summary,
    meta_title: metaTitle,
    meta_description: metaDescription,
    cover_image_url: coverImage,
    og_image_url: ogImage,
  };

  return (
    <Card>
      <CardHeader title="SEO" subheader="How this post appears in search and when it’s shared" />
      <CardContent>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">
              Google preview
            </Typography>
            <SerpPreview values={preview} />
          </Stack>

          <Stack spacing={2}>
            <Field.Text name="meta_title" label="Meta title" placeholder={title || 'Defaults to the post title'} />
            <CharacterCounter
              length={(metaTitle || '').length}
              max={META_TITLE_MAX}
              recommended={META_TITLE_RECOMMENDED}
              sx={{ mt: -1 }}
            />

            <Field.Text
              name="meta_description"
              label="Meta description"
              placeholder="Defaults to the summary"
              multiline
              minRows={3}
            />
            <CharacterCounter
              length={(metaDescription || '').length}
              max={META_DESCRIPTION_MAX}
              minimum={metaDescription ? META_DESCRIPTION_MIN : 0}
              sx={{ mt: -1 }}
            />

            <Field.Autocomplete
              name="focus_keywords"
              label="Focus keywords"
              placeholder="Type a keyword and press Enter"
              multiple
              freeSolo
              autoSelect
              options={[]}
              helperText="Up to 10. Used for the page’s keywords and structured data."
            />

            <Field.Text
              name="canonical_url"
              label="Canonical URL"
              placeholder="Leave empty to use the post’s own address"
              helperText="Only set this if the same article was first published elsewhere."
            />
            <Field.Text
              name="og_image_url"
              label="Social image URL"
              placeholder="Defaults to the cover image"
              helperText="Shown on LinkedIn, X, Slack… 1200 × 630 works best."
            />
          </Stack>

          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">
              Social preview
            </Typography>
            <SocialPreview values={preview} />
          </Stack>

          <Divider />

          <Accordion disableGutters elevation={0} sx={{ '&::before': { display: 'none' }, bgcolor: 'transparent' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
              <Typography variant="subtitle2">Advanced: structured data override</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
              <Field.Text
                name="schema_json_ld"
                label="JSON-LD (optional)"
                multiline
                minRows={5}
                placeholder='{ "inLanguage": "en" }'
                helperText="A JSON object merged over the BlogPosting data generated for this post. Leave empty unless you need to."
                slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: 13 } } }}
              />
            </AccordionDetails>
          </Accordion>
        </Stack>
      </CardContent>
    </Card>
  );
}
