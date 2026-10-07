'use client';

import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import CardContent from '@mui/material/CardContent';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { paths } from 'src/routes/paths';
import { Form, Field } from 'src/components/hook-form';
import { getBlog, createBlog, updateBlog, listBlogCategories } from 'src/auth/services/blogService';
import { describeApiError } from 'src/auth/services/platformAdminService';

import { SeoCard, CharacterCounter } from './seo-card';
import { PublishCard } from './publish-card';
import { MarkdownEditor } from './markdown-editor';
import { CoverImageField } from './cover-image-field';
import { CategoriesDialog } from './categories-dialog';
import { publicPostUrl, slugify, SUMMARY_MAX } from './blog-utils';
import {
  blogSchema,
  postToFormValues,
  BLOG_DEFAULT_VALUES,
  formValuesToPayload,
} from './blog-form';

// ----------------------------------------------------------------------

const SUMMARY_RECOMMENDED = 160;

function savedMessage(saved, previousStatus) {
  if (saved.status === 'DRAFT') return 'Draft saved';
  if (saved.status === 'ARCHIVED') return 'Post archived';
  if (saved.is_scheduled) return 'Post scheduled';
  return previousStatus === 'PUBLISHED' ? 'Post updated' : 'Post published';
}

export function BlogEditorView({ blogId }) {
  const router = useRouter();
  const isNew = !blogId;

  const methods = useForm({
    resolver: zodResolver(blogSchema),
    defaultValues: BLOG_DEFAULT_VALUES,
    mode: 'onTouched',
  });
  const {
    control,
    reset,
    setValue,
    setError,
    getValues,
    handleSubmit,
    formState: { isDirty },
  } = methods;

  const [post, setPost] = useState(null);
  const [load, setLoad] = useState({ status: isNew ? 'ready' : 'loading', message: '' });
  const [categories, setCategories] = useState([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [slugLocked, setSlugLocked] = useState(true);
  const [suggestion, setSuggestion] = useState('');
  const [banner, setBanner] = useState('');
  const [saving, setSaving] = useState(false);

  // ---- loading ----
  const loadPost = useCallback(async () => {
    setLoad({ status: 'loading', message: '' });
    try {
      const loaded = await getBlog(blogId);
      setPost(loaded);
      reset(postToFormValues(loaded));
      setLoad({ status: 'ready', message: '' });
    } catch (err) {
      const { message, status } = describeApiError(err, 'Could not load this post.');
      setLoad({ status: status === 404 ? 'missing' : 'error', message });
    }
  }, [blogId, reset]);

  useEffect(() => {
    if (!isNew) loadPost();
  }, [isNew, loadPost]);

  useEffect(() => {
    listBlogCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // ---- slug: follows the title until the author takes it over ----
  const title = useWatch({ control, name: 'title' });
  const slug = useWatch({ control, name: 'slug' });
  useEffect(() => {
    if (isNew && slugLocked) setValue('slug', slugify(title), { shouldValidate: false });
  }, [isNew, slugLocked, title, setValue]);

  const toggleSlugLock = () => {
    if (!slugLocked) {
      // Re-locking: new posts go back to following the title, existing ones to their address.
      setValue('slug', isNew ? slugify(getValues('title')) : post.slug, { shouldValidate: true });
      setSuggestion('');
    }
    setSlugLocked(!slugLocked);
  };

  // ---- leaving with unsaved work ----
  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  // ---- saving ----
  const showServerErrors = (fieldErrors) => {
    const known = Object.keys(getValues());
    Object.entries(fieldErrors).forEach(([field, message]) => {
      const name = field === 'category_id' ? 'category' : field.split('.')[0];
      if (known.includes(name)) setError(name, { type: 'server', message });
    });
  };

  const persist = async (values) => {
    const includeSlug = post ? values.slug !== post.slug : !slugLocked;
    setSaving(true);
    try {
      const payload = formValuesToPayload(values, { includeSlug });
      const saved = post ? await updateBlog(post.id, payload) : await createBlog(payload);
      toast.success(savedMessage(saved, post?.status));
      reset(postToFormValues(saved));
      setPost(saved);
      setSlugLocked(true);
      if (isNew) router.replace(paths.dashboard.blogs.edit(saved.id));
    } catch (err) {
      const { message, fieldErrors, suggestedSlug } = describeApiError(err, 'Could not save the post.');
      showServerErrors(fieldErrors);
      setSuggestion(suggestedSlug || '');
      setBanner(Object.keys(fieldErrors).length ? 'Some fields need attention. They are highlighted below.' : message);
    } finally {
      setSaving(false);
    }
  };

  const save = async (mode) => {
    setBanner('');
    setSuggestion('');
    const previous = getValues('status');
    // "Save draft" always stores a draft. "Publish" publishes, unless Archived is selected.
    const target = mode === 'draft' ? 'DRAFT' : previous === 'ARCHIVED' ? 'ARCHIVED' : 'PUBLISHED';
    setValue('status', target, { shouldDirty: true });
    await handleSubmit(persist, () => {
      setValue('status', previous);
      setBanner('Some fields need attention. They are highlighted below.');
    })();
  };

  const useSuggestedSlug = () => {
    setSlugLocked(false);
    setValue('slug', suggestion, { shouldValidate: true, shouldDirty: true });
    setSuggestion('');
    setBanner('');
  };

  const refreshCategories = (list) => {
    setCategories(list);
    // A renamed or deleted category must not linger in the form.
    const selected = getValues('category');
    if (selected) {
      const current = list.find((c) => c.id === selected.id);
      setValue('category', current ? { id: current.id, name: current.name, slug: current.slug } : null, { shouldDirty: true });
    }
  };

  // ---- rendering ----
  const crumbs = (
    <Breadcrumbs sx={{ mb: 3 }}>
      <Link color="inherit" href="/dashboard">
        Dashboard
      </Link>
      <Link color="inherit" href={paths.dashboard.blogs.root}>
        Blogs
      </Link>
      <Typography color="text.primary">{isNew ? 'New post' : 'Edit post'}</Typography>
    </Breadcrumbs>
  );

  if (load.status === 'loading') {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {crumbs}
        <Skeleton variant="rounded" height={48} sx={{ mb: 3, maxWidth: 360 }} />
        <Skeleton variant="rounded" height={480} />
      </Container>
    );
  }

  if (load.status !== 'ready') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        {crumbs}
        <Alert
          severity={load.status === 'missing' ? 'warning' : 'error'}
          action={
            load.status === 'missing' ? (
              <Button color="inherit" size="small" onClick={() => router.push(paths.dashboard.blogs.root)}>
                Back to posts
              </Button>
            ) : (
              <Button color="inherit" size="small" onClick={loadPost}>
                Retry
              </Button>
            )
          }
        >
          {load.status === 'missing' ? 'This post doesn’t exist, or it has been deleted.' : load.message}
        </Alert>
      </Container>
    );
  }

  const published = post?.status === 'PUBLISHED';

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
        {crumbs}

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h4">{isNew ? 'New post' : 'Edit post'}</Typography>
          <Button color="inherit" onClick={() => router.push(paths.dashboard.blogs.root)}>
            Back to posts
          </Button>
        </Stack>

        {banner && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setBanner('')} role="alert">
            {banner}
          </Alert>
        )}

        {/* Enter inside a field must never publish by accident: saving is always an explicit button. */}
        <Form methods={methods} onSubmit={(event) => event.preventDefault()}>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              alignItems: 'start',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 400px' },
            }}
          >
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  <Field.Text name="title" label="Title *" autoFocus={isNew} />

                  <Box>
                    <Field.Text
                      name="slug"
                      label="Slug"
                      helperText={
                        isNew && slugLocked
                          ? `${publicPostUrl(slug || '…')} (made unique when you save)`
                          : publicPostUrl(slug || '…')
                      }
                      slotProps={{
                        input: {
                          readOnly: slugLocked,
                          endAdornment: (
                            <InputAdornment position="end">
                              <Tooltip title={slugLocked ? 'Edit the slug' : isNew ? 'Generate from the title' : 'Restore the original slug'}>
                                <IconButton
                                  edge="end"
                                  onClick={toggleSlugLock}
                                  aria-label={slugLocked ? 'Unlock slug for editing' : 'Lock slug'}
                                  aria-pressed={!slugLocked}
                                >
                                  {slugLocked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    {suggestion && (
                      <Button size="small" onClick={useSuggestedSlug} sx={{ mt: 0.5 }}>
                        Use “{suggestion}” instead
                      </Button>
                    )}
                    {!slugLocked && published && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        This post is live. Changing its slug changes its web address: links and search results
                        pointing at the old one will stop working.
                      </Alert>
                    )}
                  </Box>

                  <Box>
                    <Field.Text
                      name="summary"
                      label="Summary"
                      multiline
                      minRows={2}
                      helperText="Shown on cards and used as the default search description."
                    />
                    <Box sx={{ mt: 0.5 }}>
                      <SummaryCounter />
                    </Box>
                  </Box>

                  <CoverImageField />

                  <Controller
                    name="content"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Content
                        </Typography>
                        <MarkdownEditor
                          value={field.value}
                          onChange={field.onChange}
                          error={fieldState.error?.message}
                          helperText="Markdown. ## headings become the table of contents; # is reserved for the title."
                        />
                      </Box>
                    )}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Stack spacing={3}>
              <PublishCard
                post={post}
                busy={saving}
                onSaveDraft={() => save('draft')}
                onPublish={() => save('publish')}
              />

              <Card>
                <CardHeader title="Organise" />
                <CardContent>
                  <Stack spacing={2.5}>
                    <Box>
                      <Field.Autocomplete
                        name="category"
                        label="Category"
                        options={categories}
                        getOptionLabel={(option) => option?.name ?? ''}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                      />
                      <Button size="small" onClick={() => setCategoriesOpen(true)} sx={{ mt: 0.5 }}>
                        Manage categories
                      </Button>
                    </Box>
                    <Field.Autocomplete
                      name="tags"
                      label="Tags"
                      placeholder="Type a tag and press Enter"
                      multiple
                      freeSolo
                      autoSelect
                      options={[]}
                      helperText="Up to 15. Visitors can browse stories by tag."
                    />
                  </Stack>
                </CardContent>
              </Card>

              <SeoCard />
            </Stack>
          </Box>
        </Form>
      </Container>

      <CategoriesDialog open={categoriesOpen} onClose={() => setCategoriesOpen(false)} onChanged={refreshCategories} />
    </LocalizationProvider>
  );
}

function SummaryCounter() {
  // Reads one field, so typing in the summary doesn't re-render the whole editor.
  const summary = useWatch({ name: 'summary' }) || '';
  return (
    <CharacterCounter
      length={summary.length}
      max={SUMMARY_MAX}
      recommended={SUMMARY_RECOMMENDED}
      recommendedHint="Around 150–160 characters reads best on cards and in search"
    />
  );
}
