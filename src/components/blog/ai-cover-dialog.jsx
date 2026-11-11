'use client';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';

import { generateAiCover, describeApiError } from 'src/auth/services/blogService';

import { formatFileSize } from './blog-utils';

// ----------------------------------------------------------------------
// "Generate with AI" for a cover image. Used from two places: the cover field in the editor, and the 3-dot menu of a
// post in the list. The dialog does the same thing in both: ask the backend to draw an image for a post's title
// (and summary), show it, and let the person regenerate, edit the alt text and then accept it.
//
// What accepting does is the caller's business (`onApply`): the editor puts the image in its form (saved with the
// post), the list saves it onto the post straight away. Nothing is attached to a post until the person accepts, so
// a picture they don't like costs nothing but the click.
//
// `onApply({ url, alt, width, height, size_bytes })` may be async. If it throws, the message is shown here and the
// dialog stays open so the picture is not lost.
// ----------------------------------------------------------------------

const HINT_MAX = 300;
const ALT_MAX = 255;
const IDLE = { status: 'idle', result: null, message: '' };

export function AiCoverDialog({ open, onClose, title, summary, hasCover, onApply }) {
  const [hint, setHint] = useState('');
  const [alt, setAlt] = useState('');
  const [state, setState] = useState(IDLE);
  const [applying, setApplying] = useState(false);
  const controllerRef = useRef(null);

  const generating = state.status === 'generating';
  const { result } = state;

  // A fresh start every time the dialog opens; closing it abandons a picture still being drawn.
  useEffect(() => {
    if (!open) return undefined;
    setHint('');
    setAlt('');
    setState(IDLE);
    setApplying(false);
    return () => controllerRef.current?.abort();
  }, [open]);

  const generate = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: 'generating', result: null, message: '' });
    try {
      const data = await generateAiCover({ title, summary, prompt: hint.trim() }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setAlt(data.alt || '');
      setState({ status: 'ready', result: data, message: '' });
    } catch (err) {
      if (controller.signal.aborted) return;
      setState({ status: 'error', result: null, message: describeApiError(err, 'Could not generate the image.').message });
    }
  };

  const apply = async () => {
    setApplying(true);
    try {
      await onApply({ ...result, alt: alt.trim() });
      onClose();
    } catch (err) {
      setState((s) => ({ ...s, message: describeApiError(err, 'Could not use this image.').message }));
    } finally {
      setApplying(false);
    }
  };

  const busy = generating || applying;

  return (
    <Dialog open={open} onClose={applying ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="ai-cover-title">
      <DialogTitle id="ai-cover-title">Generate cover image with AI</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            The AI draws a wide cover image for <strong>“{title}”</strong>
            {summary ? ' from its title and summary' : ' from its title'}. Nothing changes on the post until you use the
            picture.
          </Typography>

          <TextField
            label="What should it show? (optional)"
            placeholder="e.g. a team reviewing a checklist, calm blue colours"
            helperText="Leave empty and the AI decides from the title."
            value={hint}
            onChange={(event) => setHint(event.target.value.slice(0, HINT_MAX))}
            disabled={busy}
            fullWidth
            multiline
            maxRows={3}
          />

          {generating && (
            <Stack spacing={1}>
              <Skeleton variant="rounded" sx={{ width: 1, aspectRatio: '16 / 9', height: 'auto' }} animation="wave" />
              <LinearProgress aria-label="Generating the image" />
              <Typography variant="caption" color="text.secondary">
                Drawing the image. This usually takes 10 to 20 seconds.
              </Typography>
            </Stack>
          )}

          {result && (
            <Stack spacing={1.5}>
              <Box
                component="img"
                src={result.url}
                alt={alt}
                sx={{ width: 1, aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 1.5, bgcolor: 'background.neutral', display: 'block' }}
              />
              <Typography variant="caption" color="text.secondary">
                {result.width} × {result.height}px · {formatFileSize(result.size_bytes)} · AI generated
              </Typography>
              <TextField
                label="Alt text *"
                helperText="Read aloud by screen readers and used by search engines. Edit it if it doesn’t describe the image."
                value={alt}
                onChange={(event) => setAlt(event.target.value.slice(0, ALT_MAX))}
                disabled={applying}
                error={!alt.trim()}
                fullWidth
              />
              {hasCover && <Alert severity="info">Using this picture replaces the current cover image.</Alert>}
            </Stack>
          )}

          {state.message && (
            <Alert severity="error" role="alert">
              {state.message}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={applying}>
          Cancel
        </Button>
        <Button variant={result ? 'outlined' : 'contained'} onClick={generate} disabled={busy || !title?.trim()}>
          {generating ? 'Generating…' : result ? 'Try again' : 'Generate'}
        </Button>
        {result && (
          <Button variant="contained" onClick={apply} disabled={busy || !alt.trim()}>
            {applying ? 'Saving…' : 'Use this image'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
