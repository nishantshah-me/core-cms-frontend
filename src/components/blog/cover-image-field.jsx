'use client';

import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

import { Field } from 'src/components/hook-form';
import { uploadBlogImage, describeApiError } from 'src/auth/services/blogService';

import { IMAGE_TYPES, MAX_IMAGE_BYTES, formatFileSize } from './blog-utils';

// ----------------------------------------------------------------------

/** Cover image: upload (click or drop), preview, and the alt text the page can't do without. */
export function CoverImageField() {
  const { watch, setValue, clearErrors } = useFormContext();
  const url = watch('cover_image_url');

  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState({ uploading: false, percent: 0, error: '', info: '' });

  const upload = async (file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setState((s) => ({ ...s, error: 'Use a JPEG, PNG or WebP image.' }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setState((s) => ({ ...s, error: `That file is ${formatFileSize(file.size)}. Images must be 5 MB or smaller.` }));
      return;
    }
    setState({ uploading: true, percent: 0, error: '', info: '' });
    try {
      const result = await uploadBlogImage(file, (percent) => setState((s) => ({ ...s, percent })));
      setValue('cover_image_url', result.url, { shouldDirty: true, shouldValidate: true });
      clearErrors('cover_image_url');
      setState({
        uploading: false,
        percent: 100,
        error: '',
        info: `${result.width} × ${result.height}px · ${formatFileSize(result.size_bytes)} (optimised)`,
      });
    } catch (err) {
      setState({ uploading: false, percent: 0, error: describeApiError(err, 'Image upload failed.').message, info: '' });
    }
  };

  const remove = () => {
    setValue('cover_image_url', '', { shouldDirty: true });
    setValue('cover_image_alt', '', { shouldDirty: true });
    clearErrors(['cover_image_url', 'cover_image_alt']);
    setState({ uploading: false, percent: 0, error: '', info: '' });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Cover image</Typography>

      {url ? (
        <Box sx={{ position: 'relative' }}>
          <Box
            component="img"
            src={url}
            alt=""
            sx={{ width: 1, aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 1.5, bgcolor: 'background.neutral', display: 'block' }}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
            <Button size="small" variant="outlined" onClick={() => inputRef.current?.click()} disabled={state.uploading}>
              Replace
            </Button>
            <Button size="small" color="error" onClick={remove} disabled={state.uploading}>
              Remove
            </Button>
            {state.info && (
              <Typography variant="caption" color="text.secondary">
                {state.info}
              </Typography>
            )}
          </Stack>
        </Box>
      ) : (
        <Box
          role="button"
          tabIndex={0}
          aria-label="Upload a cover image"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            upload(event.dataTransfer.files?.[0]);
          }}
          sx={(theme) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            py: 5,
            px: 2,
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: 1.5,
            border: `1px dashed ${dragging ? theme.vars.palette.primary.main : theme.vars.palette.divider}`,
            bgcolor: dragging ? 'action.hover' : 'background.neutral',
            '&:hover, &:focus-visible': { bgcolor: 'action.hover', outline: 'none' },
          })}
        >
          <AddPhotoAlternateIcon color="disabled" fontSize="large" />
          <Typography variant="body2">Drop an image here, or click to browse</Typography>
          <Typography variant="caption" color="text.secondary">
            JPEG, PNG or WebP · up to 5 MB · wide images (16:9) work best
          </Typography>
        </Box>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        hidden
        onChange={(event) => {
          upload(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {state.uploading && <LinearProgress variant="determinate" value={state.percent} aria-label="Uploading" />}
      {state.error && (
        <Alert severity="error" onClose={() => setState((s) => ({ ...s, error: '' }))}>
          {state.error}
        </Alert>
      )}

      {url && (
        <Field.Text
          name="cover_image_alt"
          label="Alt text *"
          placeholder="Describe the image for people who can’t see it"
          helperText="Required. Read aloud by screen readers and used by search engines."
        />
      )}
    </Stack>
  );
}
