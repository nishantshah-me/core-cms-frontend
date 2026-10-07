'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import LinkIcon from '@mui/icons-material/Link';
import CodeIcon from '@mui/icons-material/Code';
import ImageIcon from '@mui/icons-material/Image';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';

import { previewMarkdown, uploadBlogImage, describeApiError } from 'src/auth/services/blogService';

import { BlogProse } from './blog-prose';
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from './blog-utils';

// ----------------------------------------------------------------------

const PREVIEW_DELAY_MS = 300;

/**
 * Each action maps (text, selectionStart, selectionEnd) to the new text and selection.
 * Pure functions, so the editing rules are easy to reason about.
 */
const wrap = (before, after, placeholder) => (text, start, end) => {
  const selected = text.slice(start, end) || placeholder;
  const next = `${text.slice(0, start)}${before}${selected}${after}${text.slice(end)}`;
  return { text: next, start: start + before.length, end: start + before.length + selected.length };
};

const prefixLines = (prefixFor) => (text, start, end) => {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const lineEndIndex = text.indexOf('\n', end);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  const block = text.slice(lineStart, lineEnd) || 'Text';
  const changed = block
    .split('\n')
    .map((line, index) => `${prefixFor(index)}${line}`)
    .join('\n');
  return { text: `${text.slice(0, lineStart)}${changed}${text.slice(lineEnd)}`, start: lineStart, end: lineStart + changed.length };
};

const insertLink = (text, start, end) => {
  const label = text.slice(start, end) || 'link text';
  const url = 'https://';
  const next = `${text.slice(0, start)}[${label}](${url})${text.slice(end)}`;
  const urlStart = start + label.length + 3;
  return { text: next, start: urlStart, end: urlStart + url.length };
};

const insertRule = (text, start, end) => {
  const next = `${text.slice(0, start)}\n\n---\n\n${text.slice(end)}`;
  const caret = start + 7;
  return { text: next, start: caret, end: caret };
};

const ACTIONS = {
  bold: wrap('**', '**', 'bold text'),
  italic: wrap('_', '_', 'italic text'),
  code: wrap('`', '`', 'code'),
  h2: prefixLines(() => '## '),
  h3: prefixLines(() => '### '),
  quote: prefixLines(() => '> '),
  ul: prefixLines(() => '- '),
  ol: prefixLines((index) => `${index + 1}. `),
  link: insertLink,
  rule: insertRule,
};

const TOOLBAR = [
  ['bold', 'Bold (Ctrl+B)', <FormatBoldIcon key="b" fontSize="small" />],
  ['italic', 'Italic (Ctrl+I)', <FormatItalicIcon key="i" fontSize="small" />],
  ['h2', 'Heading', <Typography key="h2" variant="subtitle2" component="span" sx={{ px: 0.5 }}>H2</Typography>],
  ['h3', 'Subheading', <Typography key="h3" variant="subtitle2" component="span" sx={{ px: 0.5 }}>H3</Typography>],
  ['ul', 'Bulleted list', <FormatListBulletedIcon key="ul" fontSize="small" />],
  ['ol', 'Numbered list', <FormatListNumberedIcon key="ol" fontSize="small" />],
  ['quote', 'Quote', <FormatQuoteIcon key="q" fontSize="small" />],
  ['code', 'Code', <CodeIcon key="c" fontSize="small" />],
  ['link', 'Link (Ctrl+K)', <LinkIcon key="l" fontSize="small" />],
  ['rule', 'Divider', <HorizontalRuleIcon key="r" fontSize="small" />],
];

// ----------------------------------------------------------------------

export function MarkdownEditor({ value, onChange, error, helperText, minRows = 18 }) {
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const [tab, setTab] = useState('write');
  const [preview, setPreview] = useState({ status: 'idle', html: '', readingTime: 0, message: '' });
  const [upload, setUpload] = useState({ active: false, percent: 0, error: '' });

  // Always the latest text, for work that finishes after the author has moved on (an upload).
  const valueRef = useRef(value);
  valueRef.current = value;

  // Applies an edit and puts the caret/selection where the author expects it.
  const edit = useCallback(
    (transform) => {
      const el = textareaRef.current;
      if (!el) return;
      const result = transform(el.value, el.selectionStart, el.selectionEnd);
      onChange(result.text);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(result.start, result.end);
      });
    },
    [onChange]
  );

  const handleKeyDown = (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return;
    const shortcut = { b: 'bold', i: 'italic', k: 'link' }[event.key.toLowerCase()];
    if (shortcut) {
      event.preventDefault();
      edit(ACTIONS[shortcut]);
    }
  };

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setUpload({ active: false, percent: 0, error: 'Use a JPEG, PNG or WebP image.' });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUpload({ active: false, percent: 0, error: 'Images must be 5 MB or smaller.' });
      return;
    }
    setUpload({ active: true, percent: 0, error: '' });
    try {
      const { url } = await uploadBlogImage(file, (percent) => setUpload((s) => ({ ...s, percent })));
      const alt = 'Describe the image';
      const markdown = `![${alt}](${url})`;
      if (textareaRef.current) {
        edit((text, start, end) => ({
          text: `${text.slice(0, start)}${markdown}${text.slice(end)}`,
          start: start + 2,
          end: start + 2 + alt.length, // alt text selected, ready to be replaced
        }));
      } else {
        // The author switched to Preview mid-upload: keep the image rather than lose it.
        onChange(`${valueRef.current.replace(/\s+$/, '')}\n\n${markdown}\n`);
      }
      setUpload({ active: false, percent: 100, error: '' });
    } catch (err) {
      setUpload({ active: false, percent: 0, error: describeApiError(err, 'Image upload failed.').message });
    }
  };

  // The preview is rendered by the API, so it is exactly what the website will show.
  useEffect(() => {
    if (tab !== 'preview') return undefined;
    const controller = new AbortController();
    setPreview((s) => ({ ...s, status: 'loading' }));
    const timer = setTimeout(async () => {
      try {
        const result = await previewMarkdown(value, { signal: controller.signal });
        setPreview({ status: 'ready', html: result.html, readingTime: result.reading_time_minutes, message: '' });
      } catch (err) {
        if (controller.signal.aborted) return;
        setPreview({ status: 'error', html: '', readingTime: 0, message: describeApiError(err, 'Could not render the preview.').message });
      }
    }, PREVIEW_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [tab, value]);

  return (
    <Box>
      <Box
        sx={{
          border: (theme) => `1px solid ${error ? theme.vars.palette.error.main : theme.vars.palette.divider}`,
          borderRadius: 1.5,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 1, bgcolor: 'background.neutral', borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}
        >
          <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ minHeight: 44 }}>
            <Tab value="write" label="Write" />
            <Tab value="preview" label="Preview" />
          </Tabs>

          {tab === 'write' && (
            <Stack direction="row" alignItems="center" sx={{ flexWrap: 'wrap' }}>
              {TOOLBAR.map(([action, label, icon]) => (
                <Tooltip key={action} title={label}>
                  <IconButton size="small" aria-label={label} onClick={() => edit(ACTIONS[action])}>
                    {icon}
                  </IconButton>
                </Tooltip>
              ))}
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />
              <Tooltip title="Upload an image">
                <span>
                  <IconButton size="small" aria-label="Insert image" onClick={() => fileRef.current?.click()} disabled={upload.active}>
                    {upload.active ? <CircularProgress size={18} /> : <ImageIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
              <input ref={fileRef} type="file" accept={IMAGE_TYPES.join(',')} hidden onChange={handleImage} />
            </Stack>
          )}
        </Stack>

        {upload.active && <LinearProgress variant="determinate" value={upload.percent} />}

        {tab === 'write' ? (
          <Box
            component="textarea"
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={minRows}
            spellCheck
            aria-label="Article content (Markdown)"
            aria-invalid={!!error}
            placeholder="Write in Markdown. Use ## for sections: they become the article’s table of contents."
            sx={{
              display: 'block',
              width: 1,
              resize: 'vertical',
              minHeight: 320,
              p: 2,
              border: 0,
              outline: 0,
              bgcolor: 'transparent',
              color: 'text.primary',
              font: 'inherit',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 14,
              lineHeight: 1.7,
            }}
          />
        ) : (
          <Box sx={{ p: 3, minHeight: 320 }}>
            {preview.status === 'loading' && <CircularProgress size={22} aria-label="Rendering preview" />}
            {preview.status === 'error' && <Alert severity="error">{preview.message}</Alert>}
            {preview.status === 'ready' &&
              (value.trim() ? <BlogProse html={preview.html} /> : <Typography color="text.secondary">Nothing to preview yet.</Typography>)}
          </Box>
        )}
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5, px: 0.5 }}>
        <FormHelperText error={!!error} sx={{ m: 0 }}>
          {error || helperText}
        </FormHelperText>
        <FormHelperText sx={{ m: 0 }}>
          {tab === 'preview' && preview.status === 'ready' ? `${preview.readingTime} min read` : `${value.length.toLocaleString()} characters`}
        </FormHelperText>
      </Stack>
      {upload.error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setUpload((s) => ({ ...s, error: '' }))}>
          {upload.error}
        </Alert>
      )}
    </Box>
  );
}
