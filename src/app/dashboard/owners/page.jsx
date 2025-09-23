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
  // Checkbox,
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
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { CustomPopover } from 'src/components/custom-popover';
import {
  getOwnersWithCompanies,
  deleteOwner,
  deleteCompany,
} from 'src/auth/services/ownerCompanyService';
import { LogoLoader } from 'src/components/loading-screen/LogoLoader';

const Page = () => {
  const router = useRouter();
  const [owners, setOwners] = useState([]);
  const [selected, setSelected] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state - Default to 10 records per page
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Load owners from API
  useEffect(() => {
    loadOwnersData();
  }, [page, rowsPerPage]);

  const loadOwnersData = async () => {
    try {
      setLoading(true);
      setError('');
      const skip = page * rowsPerPage;
      const ownersData = await getOwnersWithCompanies(skip, rowsPerPage);

      // The service now returns { data: [], total: number }
      if (ownersData && typeof ownersData === 'object' && ownersData.data) {
        setOwners(ownersData.data);
        setTotalCount(ownersData.total || 0);
      } else {
        // Fallback for old format
        setOwners(ownersData || []);
        setTotalCount(ownersData?.length || 0);
      }
    } catch (err) {
      console.error('Error loading owners:', err);
      toast.error(`Error loading owners: ${err.message}`);
      setError(err.message || 'Failed to load owners data');
      setOwners([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // const handleSelectAll = (checked) => {
  //   if (checked) {
  //     setSelected(owners.map((owner) => owner.id));
  //   } else {
  //     setSelected([]);
  //   }
  // };

  // const handleSelectOne = (ownerId) => {
  //   setSelected((prev) =>
  //     prev.includes(ownerId) ? prev.filter((id) => id !== ownerId) : [...prev, ownerId]
  //   );
  // };

  const handleMenuOpen = (event, owner) => {
    event.stopPropagation(); // Prevent row click when opening menu
    setAnchorEl(event.currentTarget);
    setSelectedOwner(owner);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOwner(null);
  };

  // Handle row click to navigate to detail page
  const handleRowClick = (owner) => {
    try {
      const ownerId = owner.id;
      const companyId = owner.ownerData?.companies?.[0]?.id || null; // first company if available

      // Navigate with query params
      router.push(
        `/dashboard/owner-detail?owner_id=${ownerId}${companyId ? `&company_id=${companyId}` : ''}`
      );
    } catch (error_) {
      console.error('Error navigating to owner details:', error_);
      toast.error('Failed to load owner details');
    }
  };

  const handleEdit = () => {
    if (selectedOwner) {
      // Clear any existing edit data and localStorage items
      localStorage.removeItem('edit_owner_data');
      localStorage.removeItem('active_step');
      localStorage.removeItem('created_owner_id');

      // Prepare the edit data with both owner and company information
      const editData = {
        isEdit: true,
        owner: {
          id: selectedOwner.id, // Owner UUID
          username: selectedOwner.name,
          firstName: selectedOwner.firstName,
          lastName: selectedOwner.lastName,
          email: selectedOwner.email,
          phone: selectedOwner.phone,
        },
        company: {
          id: selectedOwner.companyId, // Company ID (number) - could be null
          name: selectedOwner.companyData?.name || '',
          website: selectedOwner.companyData?.website || '',
          email: selectedOwner.companyData?.email || selectedOwner.email,
          phone: selectedOwner.companyData?.phone || '',
          office_address: selectedOwner.companyData?.office_address || '',
          industry_type: selectedOwner.companyData?.industry_type || '',
          employee_count: selectedOwner.companyData?.employee_count || '',
        },
      };

      // Store the edit data
      localStorage.setItem('edit_owner_data', JSON.stringify(editData));

      // Navigate to edit page with owner ID
      router.push(`/dashboard/owners/create-owners?edit=${selectedOwner.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteSingle = async () => {
    if (!selectedOwner) return;

    try {
      setIsDeleting(true);
      setError('');

      // Delete company first if it exists
      if (selectedOwner.companyId) {
        try {
          await deleteCompany(selectedOwner.companyId);
          toast.success('Company deleted successfully');
        } catch (companyError) {
          console.warn('Company deletion failed:', companyError);
          toast('Company deletion failed, continuing with owner deletion', {
            icon: '⚠️',
          });
        }
      }

      // Delete owner
      await deleteOwner(selectedOwner.id);
      toast.success('Owner deleted successfully');

      // Refresh the data after deletion
      await loadOwnersData();

      setDeleteDialog(false);
      setSelectedOwner(null);

      // Clear selection if deleted item was selected
      setSelected((prev) => prev.filter((id) => id !== selectedOwner.id));
    } catch (err) {
      console.error('Error deleting owner:', err);
      toast.error(`Error deleting owner: ${err.message}`);
      setError(err.message || 'Failed to delete owner');
    } finally {
      setIsDeleting(false);
    }
    handleMenuClose();
  };

  const handleAdd = () => {
    // Clear any existing data when adding new owner
    localStorage.removeItem('edit_owner_data');
    localStorage.removeItem('active_step');
    localStorage.removeItem('created_owner_id');
    router.push('/dashboard/owners/create-owners');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    setSelected([]); // Clear selection when changing pages
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSelected([]); // Clear selection when changing rows per page
  };

  const handleViewDetails = () => {
    if (selectedOwner) {
      handleRowClick(selectedOwner);
    }
    handleMenuClose();
  };

  if (loading && page === 0) {
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Header with Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Owners</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Owner
        </Button>
      </Box>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {/* <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.length === owners.length && owners.length > 0}
                    indeterminate={selected.length > 0 && selected.length < owners.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell> */}
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Company Count</TableCell>
                <TableCell width={88}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && page > 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : owners.length === 0 ? (
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
                        Add Owner
                      </Button>
                    </Card>
                  </TableCell>
                </TableRow>
              ) : (
                owners.map((owner) => (
                  <TableRow
                    key={owner.id}
                    hover
                    selected={selected.includes(owner.id)}
                    onClick={() => handleRowClick(owner)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    {/* <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.includes(owner.id)}
                        onChange={() => handleSelectOne(owner.id)}
                      />
                    </TableCell> */}
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {owner.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{owner.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{owner.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{owner.companyCount}</Typography>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
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

        {/* Custom Pagination - Only shows page numbers with arrows */}
        {totalCount > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 2,
              gap: 2,
            }}
          >
            {/* Previous Button */}
            <IconButton
              onClick={() => handleChangePage(null, page - 1)}
              disabled={page === 0}
              sx={{
                border: '1px solid',
                borderColor: page === 0 ? 'grey.300' : 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              }}
            >
              <NavigateBeforeIcon />
            </IconButton>

            {/* Page Info */}
            <Typography variant="body2" sx={{ mx: 2 }}>
              Page {page + 1} of {Math.ceil(totalCount / rowsPerPage)}
            </Typography>

            {/* Next Button */}
            <IconButton
              onClick={() => handleChangePage(null, page + 1)}
              disabled={page >= Math.ceil(totalCount / rowsPerPage) - 1}
              sx={{
                border: '1px solid',
                borderColor:
                  page >= Math.ceil(totalCount / rowsPerPage) - 1 ? 'grey.300' : 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              }}
            >
              <NavigateNextIcon />
            </IconButton>

            {/* Rows per page selection */}
            <Box sx={{ ml: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">Rows:</Typography>
              <select
                value={rowsPerPage}
                onChange={(e) => handleChangeRowsPerPage(e)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </Box>
          </Box>
        )}
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
          <MenuItem onClick={handleViewDetails}>
            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
            View
          </MenuItem>

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
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Owner and Company</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>{selectedOwner?.name}</strong> and their
            associated company <strong>{selectedOwner?.company}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. Both the owner and company data will be permanently
            removed.
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
            startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Page;
