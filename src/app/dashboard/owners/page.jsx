/* eslint-disable perfectionist/sort-imports */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  Button,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Breadcrumbs,
  Link,
  Checkbox,
  TableContainer,
  MenuList,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { CustomPopover } from 'src/components/custom-popover';
import { getOwnersWithCompanies, deleteOwner } from 'src/auth/services/ownerCompanyService';
import { LogoLoader } from 'src/components/loading-screen/LogoLoader';

const Page = () => {
  const router = useRouter();
  const [owners, setOwners] = useState([]);
  const [selected, setSelected] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Load owners from API
  useEffect(() => {
    loadOwnersData();
  }, []);

  const loadOwnersData = async () => {
    try {
      setLoading(true);
      setError('');
      const ownersData = await getOwnersWithCompanies();
      setOwners(ownersData);
    } catch (err) {
      toast.error(`Error loading owners: ${err}`);
      setError(err.message || 'Failed to load owners data');
      // Fallback to localStorage if API fails (for development)
      try {
        const savedOwners = localStorage.getItem('owners');
        if (savedOwners) {
          setOwners(JSON.parse(savedOwners));
        }
      } catch (localStorageError) {
        toast.error(`Failed to load from localStorage: ${localStorageError}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(owners.map((owner) => owner.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (ownerId) => {
    setSelected((prev) =>
      prev.includes(ownerId) ? prev.filter((id) => id !== ownerId) : [...prev, ownerId]
    );
  };

  const handleMenuOpen = (event, owner) => {
    setAnchorEl(event.currentTarget);
    setSelectedOwner(owner);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOwner(null);
  };

  const handleEdit = () => {
    if (selectedOwner) {
      // Clear any existing edit data first
      localStorage.removeItem('edit_owner_data');
      localStorage.removeItem('onboarding_owners');
      localStorage.removeItem('onboarding_companies');

      // Prepare the edit data in the format expected by the stepper form
      const editData = {
        owner: {
          id: selectedOwner.id,
          firstName: selectedOwner.firstName,
          lastName: selectedOwner.lastName,
          email: selectedOwner.email,
          phone: selectedOwner.phone,
        },
        company: {
          id: selectedOwner.companyId,
          companyName: selectedOwner.company,
          industryType: '',
          companyEmail: selectedOwner.email,
          companyAddress: '',
          employeeCount: '',
          companyURL: '',
        },
      };

      // Store the edit data
      localStorage.setItem('edit_owner_data', JSON.stringify(editData));

      // Navigate to edit page
      router.push(`/dashboard/owners/create-owners?edit=${selectedOwner.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteSingle = async () => {
    if (!selectedOwner) return;

    try {
      setIsDeleting(true);
      setError('');

      // Try to delete from API
      try {
        await deleteOwner(selectedOwner.id);
      } catch (apiError) {
        toast(`API delete failed, continuing with local removal: ${apiError}`, {
          icon: '⚠️',
        });
      }

      // Remove from local state
      const newOwners = owners.filter((owner) => owner.id !== selectedOwner.id);
      setOwners(newOwners);

      // Also update localStorage as backup
      localStorage.setItem('owners', JSON.stringify(newOwners));

      setDeleteDialog(false);
      setSelectedOwner(null);
    } catch (err) {
      toast.error(`Error deleting owne: ${err}`);
      setError(err.message || 'Failed to delete owner');
    } finally {
      setIsDeleting(false);
    }
    handleMenuClose();
  };

  const handleBulkDelete = async () => {
    try {
      setIsDeleting(true);
      setError('');

      // Try to delete from API
      for (const ownerId of selected) {
        try {
          await deleteOwner(ownerId);
        } catch (apiError) {
          toast(`API delete failed for owner ${ownerId}: ${apiError}`, { icon: '⚠️' });
        }
      }

      // Remove from local state
      const newOwners = owners.filter((owner) => !selected.includes(owner.id));
      setOwners(newOwners);

      // Also update localStorage as backup
      localStorage.setItem('owners', JSON.stringify(newOwners));

      setSelected([]);
      setBulkDeleteDialog(false);
    } catch (err) {
      toast.error('Error deleting owners:', err);
      setError(err.message || 'Failed to delete selected owners');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdd = () => {
    router.push('/dashboard/owners/create-owners');
  };

  const handleRefresh = () => {
    loadOwnersData();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
          width: '100%',
        }}
      >
        <LogoLoader />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/owners">
            Owners
          </Link>
        </Breadcrumbs>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Header with Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Owners</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {owners.length > 0 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
              Add
            </Button>
          )}
        </Box>
      </Box>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <Card sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2">{selected.length} item(s) selected</Typography>
            <Button
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setBulkDeleteDialog(true)}
              disabled={isDeleting}
            >
              Delete Selected
            </Button>
          </Box>
        </Card>
      )}

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.length === owners.length && owners.length > 0}
                    indeterminate={selected.length > 0 && selected.length < owners.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Company</TableCell>
                <TableCell width={88} />
              </TableRow>
            </TableHead>
            <TableBody>
              {owners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Card sx={{ textAlign: 'center', py: 7, boxShadow: 'none' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No owners added yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Add your owner information to complete the onboarding process
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        size="large"
                      >
                        Add
                      </Button>
                    </Card>
                  </TableCell>
                </TableRow>
              ) : (
                owners.map((owner) => (
                  <TableRow key={owner.id} hover selected={selected.includes(owner.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(owner.id)}
                        onChange={() => handleSelectOne(owner.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {owner.name || `${owner.firstName} ${owner.lastName}`.trim()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {owner.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{owner.phone}</TableCell>
                    <TableCell>{owner.company}</TableCell>
                    <TableCell>
                      <IconButton onClick={(e) => handleMenuOpen(e, owner)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Menu */}
      <CustomPopover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        slotProps={{
          arrow: {
            placement: 'right-center',
            offset: 14,
            size: 15,
          },
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: (theme) => theme.shadows[6],
              maxWidth: 140,
            },
          },
        }}
      >
        <MenuList>
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>

          <MenuItem
            onClick={() => setDeleteDialog(true)}
            sx={{ color: 'error.main' }}
            disabled={isDeleting}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Owner</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this owner and their associated company data? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} variant="outlined" disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSingle}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialog}
        onClose={() => setBulkDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Selected</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selected.length} selected owner(s) and their associated
            company data? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBulkDeleteDialog(false)}
            variant="outlined"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Page;
