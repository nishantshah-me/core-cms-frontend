'use client';

import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Tabs from '@mui/material/Tabs';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { paths } from 'src/routes/paths';
import { Label } from 'src/components/label';
import { getBlog, listBlogs, deleteBlog, listBlogCategories } from 'src/auth/services/blogService';
import {
  getAdminSession,
  adminSignOut,
  describeApiError,
} from 'src/auth/services/platformAdminService';

import { BlogProse } from './blog-prose';
import { CategoriesDialog } from './categories-dialog';
import { statusKey, statusLabel } from './blog-utils';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'ALL', label: 'All', count: 'all' },
  { value: 'PUBLISHED', label: 'Published', count: 'published' },
  { value: 'DRAFT', label: 'Draft', count: 'draft' },
  { value: 'ARCHIVED', label: 'Archived', count: 'archived' },
];

const DATE_FIELDS = [
  { value: 'created_at', label: 'Created' },
  { value: 'updated_at', label: 'Updated' },
  { value: 'published_at', label: 'Published' },
];

const SEARCH_DELAY_MS = 350;
const formatDate = (value) => (value ? dayjs(value).format('D MMM YYYY') : '—');

function publishedCell(post) {
  const key = statusKey(post);
  if (key === 'DRAFT' || !post.published_at) return '—';
  if (key === 'SCHEDULED') return `Goes live ${dayjs(post.published_at).format('D MMM YYYY, h:mm A')}`;
  return formatDate(post.published_at);
}

// ----------------------------------------------------------------------

export function BlogListView() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);

  const [tab, setTab] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateField, setDateField] = useState('created_at');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState({ by: 'created_at', order: 'desc' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  const [result, setResult] = useState({ status: 'loading', data: null, message: '' });
  const [counts, setCounts] = useState(null); // kept across reloads so the tab badges don't flicker
  const [categories, setCategories] = useState([]);

  const [menu, setMenu] = useState({ anchor: null, post: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => setAdmin(getAdminSession()?.admin || null), []);

  useEffect(() => {
    listBlogCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Typing in the search box waits for a pause before it queries.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setResult((previous) => ({ ...previous, status: 'loading' }));
    listBlogs(
      {
        page: page + 1,
        limit: rowsPerPage,
        status: tab === 'ALL' ? '' : tab,
        category_id: categoryId,
        search,
        date_field: dateField,
        date_from: dateFrom,
        date_to: dateTo,
        sort: sort.by,
        order: sort.order,
      },
      { signal: controller.signal }
    )
      .then((data) => {
        setResult({ status: 'ready', data, message: '' });
        setCounts(data.counts);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult({ status: 'error', data: null, message: describeApiError(err, 'Could not load posts.').message });
      });
    return () => controller.abort();
  }, [tab, search, categoryId, dateField, dateFrom, dateTo, sort, page, rowsPerPage, reloadKey]);

  const reload = useCallback(() => setReloadKey((n) => n + 1), []);
  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(0);
  };
  const toggleSort = (by) =>
    setSort((s) => ({ by, order: s.by === by && s.order === 'desc' ? 'asc' : 'desc' }));

  const items = result.data?.items || [];
  const total = result.data?.total || 0;
  const loading = result.status === 'loading';
  const filtered = Boolean(search || categoryId || dateFrom || dateTo);

  const closeMenu = () => setMenu({ anchor: null, post: null });
  const edit = (post) => router.push(paths.dashboard.blogs.edit(post.id));

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteBlog(toDelete.id);
      toast.success(`“${toDelete.title}” deleted`);
      // Deleting the last row of a later page would leave that page empty.
      if (items.length === 1 && page > 0) setPage(page - 1);
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(describeApiError(err, 'Could not delete the post.').message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Typography color="text.primary">Blogs</Typography>
      </Breadcrumbs>

      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Blog posts</Typography>
          {admin && (
            <Typography variant="body2" color="text.secondary">
              Signed in as {admin.email} ·{' '}
              <Link component="button" type="button" underline="always" onClick={adminSignOut}>
                Sign out
              </Link>
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" color="inherit" onClick={() => setCategoriesOpen(true)}>
            Categories
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push(paths.dashboard.blogs.new)}>
            New post
          </Button>
        </Stack>
      </Stack>

      <Card>
        <Tabs
          value={tab}
          onChange={(_, value) => {
            setTab(value);
            setPage(0);
          }}
          sx={{ px: 2.5, borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}
        >
          {TABS.map((item) => (
            <Tab
              key={item.value}
              value={item.value}
              label={counts ? `${item.label} (${counts[item.count]})` : item.label}
            />
          ))}
        </Tabs>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2.5 }}>
          <TextField
            size="small"
            label="Search"
            placeholder="Title, summary or slug"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="blog-category-filter">Category</InputLabel>
            <Select
              labelId="blog-category-filter"
              label="Category"
              value={categoryId}
              onChange={(e) => resetPage(setCategoryId)(e.target.value)}
            >
              <MenuItem value="">All categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="blog-date-field">Date</InputLabel>
            <Select
              labelId="blog-date-field"
              label="Date"
              value={dateField}
              onChange={(e) => resetPage(setDateField)(e.target.value)}
            >
              {DATE_FIELDS.map((f) => (
                <MenuItem key={f.value} value={f.value}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="date"
            label="From"
            value={dateFrom}
            onChange={(e) => resetPage(setDateFrom)(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: dateTo || undefined } }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={dateTo}
            onChange={(e) => resetPage(setDateTo)(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: dateFrom || undefined } }}
          />
        </Stack>

        {result.status === 'error' && (
          <Alert
            severity="error"
            sx={{ mx: 2.5, mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={reload}>
                Retry
              </Button>
            }
          >
            {result.message}
          </Alert>
        )}

        <TableContainer>
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell width={72}>Cover</TableCell>
                <TableCell sortDirection={sort.by === 'title' ? sort.order : false}>
                  <TableSortLabel active={sort.by === 'title'} direction={sort.by === 'title' ? sort.order : 'asc'} onClick={() => toggleSort('title')}>
                    Title
                  </TableSortLabel>
                </TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sortDirection={sort.by === 'published_at' ? sort.order : false}>
                  <TableSortLabel active={sort.by === 'published_at'} direction={sort.by === 'published_at' ? sort.order : 'asc'} onClick={() => toggleSort('published_at')}>
                    Published
                  </TableSortLabel>
                </TableCell>
                <TableCell width={64} align="right">
                  <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                    Actions
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && items.length === 0 &&
                Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }, (__, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" height={28} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {result.status !== 'error' && !loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Stack alignItems="center" spacing={1.5} sx={{ py: 7, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary">
                        {filtered || tab !== 'ALL' ? 'No posts match these filters' : 'No posts yet'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {filtered || tab !== 'ALL'
                          ? 'Try a different search, status or date range.'
                          : 'Write your first story and it will appear here.'}
                      </Typography>
                      {!filtered && tab === 'ALL' && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push(paths.dashboard.blogs.new)}>
                          New post
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              )}

              {items.map((post) => {
                const label = statusLabel(post);
                return (
                  <TableRow key={post.id} hover sx={{ opacity: loading ? 0.6 : 1 }}>
                    <TableCell>
                      <Avatar variant="rounded" src={post.cover_image_url || undefined} alt={post.cover_image_alt || ''} sx={{ width: 56, height: 40 }}>
                        <ImageIcon fontSize="small" />
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 360 }}>
                      <Link component="button" type="button" variant="subtitle2" color="text.primary" underline="hover" onClick={() => edit(post)} sx={{ textAlign: 'left' }}>
                        {post.title}
                      </Link>
                      <Typography variant="caption" color="text.secondary" component="div" noWrap>
                        /{post.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>{post.category?.name || '—'}</TableCell>
                    <TableCell>
                      <Label color={label.color}>{label.label}</Label>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{publishedCell(post)}</TableCell>
                    <TableCell align="right">
                      <IconButton aria-label={`Actions for ${post.title}`} onClick={(e) => setMenu({ anchor: e.currentTarget, post })}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
        />
      </Card>

      <Menu anchorEl={menu.anchor} open={Boolean(menu.anchor)} onClose={closeMenu}>
        <MenuItem onClick={() => { edit(menu.post); closeMenu(); }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { setPreviewId(menu.post.id); closeMenu(); }}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} /> Preview
        </MenuItem>
        {menu.post && statusKey(menu.post) === 'PUBLISHED' && (
          <MenuItem component="a" href={menu.post.public_url} target="_blank" rel="noopener noreferrer" onClick={closeMenu}>
            <OpenInNewIcon fontSize="small" sx={{ mr: 1 }} /> View live
          </MenuItem>
        )}
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { setToDelete(menu.post); closeMenu(); }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <Dialog open={Boolean(toDelete)} onClose={deleting ? undefined : () => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this post?</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{toDelete?.title}</strong> will be removed from the website straight away.
            {toDelete && statusKey(toDelete) === 'PUBLISHED' && ' Anyone with a link to it will see a “not found” page.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <BlogPreviewDialog
        blogId={previewId}
        onClose={() => setPreviewId(null)}
        onEdit={(id) => router.push(paths.dashboard.blogs.edit(id))}
      />

      <CategoriesDialog
        open={categoriesOpen}
        onClose={() => {
          setCategoriesOpen(false);
          reload();
        }}
        onChanged={setCategories}
      />
    </Container>
  );
}

// ----------------------------------------------------------------------

/** The saved post, rendered the way the website renders it (drafts included). */
function BlogPreviewDialog({ blogId, onClose, onEdit }) {
  const [state, setState] = useState({ status: 'loading', post: null, message: '' });
  const lastId = useRef(null);

  useEffect(() => {
    if (!blogId) return undefined;
    lastId.current = blogId;
    let cancelled = false;
    setState({ status: 'loading', post: null, message: '' });
    getBlog(blogId)
      .then((post) => !cancelled && setState({ status: 'ready', post, message: '' }))
      .catch((err) => !cancelled && setState({ status: 'error', post: null, message: describeApiError(err, 'Could not load the post.').message }));
    return () => {
      cancelled = true;
    };
  }, [blogId]);

  const { post } = state;
  return (
    <Dialog open={Boolean(blogId)} onClose={onClose} fullWidth maxWidth="md" scroll="paper" aria-labelledby="blog-preview-title">
      <DialogTitle id="blog-preview-title">Preview</DialogTitle>
      <DialogContent dividers>
        {state.status === 'loading' && <Skeleton variant="rounded" height={240} />}
        {state.status === 'error' && <Alert severity="error">{state.message}</Alert>}
        {post && (
          <Box component="article" sx={{ maxWidth: 720, mx: 'auto' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <Label color={statusLabel(post).color}>{statusLabel(post).label}</Label>
              {post.category && <Typography variant="caption" color="text.secondary">{post.category.name}</Typography>}
              <Typography variant="caption" color="text.secondary">{post.reading_time_minutes} min read</Typography>
            </Stack>
            <Typography variant="h3" component="h1" sx={{ mb: 1 }}>
              {post.title}
            </Typography>
            {post.summary && (
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 3 }}>
                {post.summary}
              </Typography>
            )}
            {post.cover_image_url && (
              <Box component="img" src={post.cover_image_url} alt={post.cover_image_alt || ''} sx={{ width: 1, borderRadius: 2, mb: 3, display: 'block' }} />
            )}
            <BlogProse html={post.content_html} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {post && statusKey(post) === 'PUBLISHED' && (
          <Button href={post.public_url} target="_blank" rel="noopener noreferrer" startIcon={<OpenInNewIcon />}>
            View live
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Close</Button>
        {post && (
          <Button variant="contained" onClick={() => onEdit(post.id)}>
            Edit
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
