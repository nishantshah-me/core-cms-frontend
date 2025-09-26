/* eslint-disable perfectionist/sort-imports */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TableContainer,
  MenuList,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
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
import lodash from 'lodash';

// Generate month options
const monthOptions = [
  { value: '', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

// Generate year options (current year ± 5 years)
const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: '', label: 'All Years' },
  ...Array.from({ length: 11 }, (_, i) => {
    const year = currentYear - 5 + i;
    return { value: year.toString(), label: year.toString() };
  }),
];

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

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [inputValue, setInputValue] = useState(''); // what user is typing (immediate)
  const [searchQuery, setSearchQuery] = useState(''); // debounced value used for API

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Load owners from API with filters
  const loadOwnersData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const skip = page * rowsPerPage;

      const filters = { skip, limit: rowsPerPage };
      if (searchQuery.trim()) filters.search = searchQuery.trim();
      if (selectedMonth) filters.month = selectedMonth;
      if (selectedYear) filters.year = selectedYear;

      const ownersData = await getOwnersWithCompanies(filters);
      if (ownersData?.data) {
        setOwners(ownersData.data);
        setTotalCount(ownersData.total || 0);
      } else {
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
  }, [page, rowsPerPage, searchQuery, selectedMonth, selectedYear]);

  // Debounced function: updates the actual searchQuery
  const debouncedSetSearchQuery = useMemo(
    () =>
      lodash.debounce((val) => {
        setSearchQuery(val);
        setPage(0); // reset pagination
      }, 500), // wait 500ms after user stops typing
    []
  );

  // Initial load and reload when filters change
  useEffect(() => {
    loadOwnersData();
  }, [loadOwnersData]);

  //Cancel debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetSearchQuery.cancel();
    };
  }, [debouncedSetSearchQuery]);

  const handleSearchChange = (event) => {
    const val = event.target.value;
    setInputValue(val); // update immediate input for TextField
    debouncedSetSearchQuery(val); // update debounced query for API
  };

  const handleClearSearch = () => {
    setInputValue('');
    setSearchQuery('');
    setPage(0);
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
    setPage(0);
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
    setPage(0);
  };

  const hasActiveFilters = searchQuery || selectedMonth || selectedYear;

  const handleMenuOpen = (event, owner) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedOwner(owner);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOwner(null);
  };

  const handleRowClick = (owner) => {
    try {
      const ownerId = owner.id;
      const companyId = owner.ownerData?.companies?.[0]?.id || null;
      router.push(
        `/dashboard/owners/owner-detail?owner_id=${ownerId}${companyId ? `&company_id=${companyId}` : ''}`
      );
    } catch (error_) {
      console.error('Error navigating to owner details:', error_);
      toast.error('Failed to load owner details');
    }
  };

  const handleDeleteSingle = async () => {
    if (!selectedOwner) return;
    try {
      setIsDeleting(true);
      setError('');
      if (selectedOwner.companyId) {
        try {
          await deleteCompany(selectedOwner.companyId);
          toast.success('Company deleted successfully');
        } catch (companyError) {
          console.warn('Company deletion failed:', companyError);
          toast('Company deletion failed, continuing with owner deletion', { icon: '⚠️' });
        }
      }
      await deleteOwner(selectedOwner.id);
      toast.success('Owner deleted successfully');
      await loadOwnersData();
      setDeleteDialog(false);
      setSelectedOwner(null);
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
    localStorage.removeItem('edit_owner_data');
    localStorage.removeItem('active_step');
    localStorage.removeItem('created_owner_id');
    router.push('/dashboard/owners/create-owner');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    setSelected([]);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSelected([]);
  };

  const handleViewDetails = () => {
    if (selectedOwner) {
      handleRowClick(selectedOwner);
    }
    handleMenuClose();
  };

  if (loading && page === 0 && !hasActiveFilters) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
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

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Owners List</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Owner
        </Button>
      </Box>

      {/* Search + Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            placeholder="Search by owner name, email, or phone"
            value={inputValue}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: inputValue && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch} size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: { md: 400 } }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Month</InputLabel>
              <Select value={selectedMonth} onChange={handleMonthChange} label="Month">
                {monthOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Year</InputLabel>
              <Select value={selectedYear} onChange={handleYearChange} label="Year">
                {yearOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Companies</TableCell>
                <TableCell width={88}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : owners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Card sx={{ textAlign: 'center', py: 7, boxShadow: 'none' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {hasActiveFilters ? 'No owners found' : 'No owners added yet'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {hasActiveFilters
                          ? 'Try adjusting your search criteria or clear filters'
                          : 'Add your owner information to complete the onboarding process'}
                      </Typography>
                      {!hasActiveFilters && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleAdd}
                          size="large"
                        >
                          Add Owner
                        </Button>
                      )}
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

        {/* Custom Pagination */}
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

            <Typography variant="body2" sx={{ mx: 2 }}>
              Page {page + 1} of {Math.ceil(totalCount / rowsPerPage)}
            </Typography>

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

            <Box sx={{ ml: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">Rows:</Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select value={rowsPerPage} onChange={(e) => handleChangeRowsPerPage(e)}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
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
