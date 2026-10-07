'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  listBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
} from 'src/auth/services/blogService';
import { describeApiError } from 'src/auth/services/platformAdminService';

// ----------------------------------------------------------------------

/**
 * Create, rename and delete categories. Deleting one never deletes posts: they simply
 * become uncategorised. `onChanged(categories)` reports the fresh list after every change.
 */
export function CategoriesDialog({ open, onClose, onChanged }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null); // { id, name }
  const [confirming, setConfirming] = useState(null); // category awaiting delete confirmation

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await listBlogCategories();
      setCategories(list);
      return list;
    } catch (err) {
      setError(describeApiError(err, 'Could not load categories.').message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Runs a change, then reloads the list and tells the parent.
  const change = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
      const list = await load();
      if (list) onChanged?.(list);
      return true;
    } catch (err) {
      const { message, fieldErrors } = describeApiError(err);
      setError(fieldErrors.name || fieldErrors.slug || message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (event) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (await change(() => createBlogCategory({ name }))) setNewName('');
  };

  const saveRename = async () => {
    const name = editing.name.trim();
    if (!name) return;
    const current = categories.find((c) => c.id === editing.id);
    if (await change(() => updateBlogCategory(editing.id, { name, description: current?.description ?? null }))) {
      setEditing(null);
    }
  };

  const remove = async () => {
    if (await change(() => deleteBlogCategory(confirming.id))) setConfirming(null);
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="categories-title">
      <DialogTitle id="categories-title">Categories</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={add} sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            label="New category"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <Button type="submit" variant="contained" disabled={busy || !newName.trim()}>
            Add
          </Button>
        </Box>

        {loading && categories.length === 0 ? (
          <Stack alignItems="center" sx={{ py: 3 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <List disablePadding>
            {categories.length === 0 && (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No categories yet.
              </Typography>
            )}
            {categories.map((category) => {
              const isEditing = editing?.id === category.id;
              const isConfirming = confirming?.id === category.id;
              return (
                <ListItem
                  key={category.id}
                  divider
                  disableGutters
                  secondaryAction={
                    isEditing ? (
                      <Stack direction="row">
                        <IconButton aria-label="Save name" onClick={saveRename} disabled={busy} color="primary">
                          <CheckIcon />
                        </IconButton>
                        <IconButton aria-label="Cancel" onClick={() => setEditing(null)} disabled={busy}>
                          <CloseIcon />
                        </IconButton>
                      </Stack>
                    ) : isConfirming ? (
                      <Stack direction="row" spacing={0.5}>
                        <Button size="small" color="error" variant="contained" onClick={remove} disabled={busy}>
                          Delete
                        </Button>
                        <Button size="small" onClick={() => setConfirming(null)} disabled={busy}>
                          Keep
                        </Button>
                      </Stack>
                    ) : (
                      <Stack direction="row">
                        <IconButton aria-label={`Rename ${category.name}`} onClick={() => setEditing({ id: category.id, name: category.name })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton aria-label={`Delete ${category.name}`} onClick={() => setConfirming(category)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    )
                  }
                  sx={{ pr: isConfirming ? 20 : 12 }}
                >
                  {isEditing ? (
                    <TextField
                      size="small"
                      fullWidth
                      autoFocus
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename();
                        if (e.key === 'Escape') setEditing(null);
                      }}
                      slotProps={{ htmlInput: { 'aria-label': 'Category name', maxLength: 100 } }}
                    />
                  ) : (
                    <ListItemText
                      primary={category.name}
                      secondary={
                        isConfirming
                          ? category.post_count
                            ? `${category.post_count} post${category.post_count === 1 ? '' : 's'} will become uncategorised.`
                            : 'No posts use this category.'
                          : `/${category.slug} · ${category.post_count} post${category.post_count === 1 ? '' : 's'}`
                      }
                    />
                  )}
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
