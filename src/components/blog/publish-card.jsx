'use client';

import dayjs from 'dayjs';
import { useWatch, Controller, useFormContext } from 'react-hook-form';

import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Label } from 'src/components/label';
import { Field } from 'src/components/hook-form';

import { isFuture } from './blog-form';
import { STATUS_OPTIONS, statusLabel } from './blog-utils';

// ----------------------------------------------------------------------

/**
 * Status, schedule and the two save buttons.
 *   Save draft: stores the post as a draft, whatever the toggle says.
 *   Publish:    stores it as published (or scheduled, if the date is in the future);
 *               if the toggle is on Archived, it stores it as archived instead.
 */
export function PublishCard({ post, busy, onSaveDraft, onPublish }) {
  const { control } = useFormContext();
  const [status, publishedAt] = useWatch({ control, name: ['status', 'published_at'] });

  const live = post && post.status === 'PUBLISHED' && !post.is_scheduled;
  const scheduling = status === 'PUBLISHED' && isFuture(publishedAt);
  const alreadyPublished = post?.status === 'PUBLISHED';

  let primary = alreadyPublished ? 'Update' : 'Publish';
  if (status === 'ARCHIVED') primary = 'Archive';
  else if (scheduling) primary = alreadyPublished ? 'Reschedule' : 'Schedule';

  return (
    <Card>
      <CardHeader
        title="Publish"
        action={post ? <Label color={statusLabel(post).color}>{statusLabel(post).label}</Label> : <Label>New</Label>}
      />
      <CardContent>
        <Stack spacing={2.5}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                color="primary"
                value={field.value}
                onChange={(_, next) => next && field.onChange(next)}
                aria-label="Post status"
              >
                {STATUS_OPTIONS.map((option) => (
                  <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
          />

          <Field.DateTimePicker
            name="published_at"
            label="Publish date"
            disabled={status !== 'PUBLISHED'}
            disablePast={!post}
            slotProps={{
              field: { clearable: true },
              textField: {
                helperText:
                  status !== 'PUBLISHED'
                    ? 'Choose “Published” to set a date.'
                    : scheduling
                      ? `Goes live ${dayjs(publishedAt).format('D MMM YYYY [at] h:mm A')}.`
                      : 'Leave empty to publish immediately.',
              },
            }}
          />

          <Stack direction="row" spacing={1.5}>
            <Button fullWidth variant="outlined" color="inherit" onClick={onSaveDraft} disabled={busy}>
              Save draft
            </Button>
            <Button fullWidth variant="contained" onClick={onPublish} disabled={busy}>
              {busy ? 'Saving…' : primary}
            </Button>
          </Stack>

          {live && (
            <Typography variant="body2" color="text.secondary">
              Live at{' '}
              <Link href={post.public_url} target="_blank" rel="noopener noreferrer" underline="always">
                {post.public_url.replace(/^https?:\/\//, '')}
              </Link>
            </Typography>
          )}
          {post && (
            <Stack spacing={0.25}>
              <Typography variant="caption" color="text.secondary">
                {post.reading_time_minutes} min read · by {post.author_name || 'Officeous'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last saved {dayjs(post.updated_at).format('D MMM YYYY, h:mm A')}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
