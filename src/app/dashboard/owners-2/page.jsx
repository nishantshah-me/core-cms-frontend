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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { CustomPopover } from 'src/components/custom-popover';

// Initial mock data for owners - this will be managed in localStorage for CRUD
const initialOwners = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+1 234 567 8900',
    company: 'Tech Solutions Inc',
    companyId: 1,
    planId: 'pro',
    billingCycle: 'monthly',
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@startup.com',
    phone: '+1 234 567 8901',
    company: 'Innovation Labs',
    companyId: 2,
    planId: 'basic',
    billingCycle: 'yearly',
  },
  {
    id: 3,
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.j@enterprise.com',
    phone: '+1 234 567 8902',
    company: 'Enterprise Corp',
    companyId: 3,
    planId: 'enterprise',
    billingCycle: 'monthly',
  },
  {
    id: 4,
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@agency.com',
    phone: '+1 234 567 8903',
    company: 'Creative Agency',
    companyId: 4,
    planId: 'free',
    billingCycle: 'monthly',
  },
];

const Page = () => {
  const router = useRouter();
  const [owners, setOwners] = useState([]);
  const [selected, setSelected] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  // Load owners from localStorage and merge with completed onboarding
  useEffect(() => {
    const loadData = () => {
      let loadedOwners = [];

      // First, load existing owners data
      const savedOwners = localStorage.getItem('owners');
      if (savedOwners) {
        loadedOwners = JSON.parse(savedOwners);
      } else {
        // Use initial mock data if no saved data
        loadedOwners = initialOwners;
      }

      // Check for completed onboarding data
      const completedOnboarding = localStorage.getItem('completed_onboarding');
      if (completedOnboarding) {
        try {
          const onboardingData = JSON.parse(completedOnboarding);

          // Check if this onboarding data is already in the owners list
          const existingOwner = loadedOwners.find(
            (owner) => owner.email === onboardingData.owner.email
          );

          if (!existingOwner) {
            // Add the new owner from completed onboarding
            const newOwner = {
              id: Date.now(),
              firstName: onboardingData.owner.firstName,
              lastName: onboardingData.owner.lastName,
              email: onboardingData.owner.email,
              phone: onboardingData.owner.phone,
              company: onboardingData.company.companyName,
              companyId: Date.now() + 1,
              planId: onboardingData.selectedPlan,
              billingCycle: onboardingData.billingCycle,
              companyData: onboardingData.company, // Store complete company data
            };

            loadedOwners = [newOwner, ...loadedOwners];

            // Clear the completed onboarding data as it's now integrated
            localStorage.removeItem('completed_onboarding');
          }
        } catch (error) {
          console.error('Error parsing completed onboarding data:', error);
        }
      }

      setOwners(loadedOwners);
      updateOwners(loadedOwners);
    };

    loadData();
  }, []);

  // Save to localStorage whenever owners change
  const updateOwners = (newOwners) => {
    setOwners(newOwners);
    localStorage.setItem('owners', JSON.stringify(newOwners));
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
        company: selectedOwner.companyData || {
          id: selectedOwner.companyId,
          companyName: selectedOwner.company,
          industryType: '',
          companyEmail: selectedOwner.email,
          companyAddress: '',
          employeeCount: '',
          companyURL: '',
        },
        pricing: {
          selectedPlan: selectedOwner.planId,
          billingCycle: selectedOwner.billingCycle,
        },
      };

      // Store the edit data
      localStorage.setItem('edit_owner_data', JSON.stringify(editData));

      // Navigate to edit page
      router.push(`/dashboard/owners/create-owners?edit=${selectedOwner.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteSingle = () => {
    if (selectedOwner) {
      // Delete both owner and associated company data
      const newOwners = owners.filter((owner) => owner.id !== selectedOwner.id);
      updateOwners(newOwners);

      // Also remove from companies storage if exists
      const savedCompanies = localStorage.getItem('onboarding_companies');
      if (savedCompanies) {
        try {
          const companies = JSON.parse(savedCompanies);
          const updatedCompanies = companies.filter(
            (company) => company.id !== selectedOwner.companyId
          );
          localStorage.setItem('onboarding_companies', JSON.stringify(updatedCompanies));
        } catch (error) {
          console.error('Error updating companies data:', error);
        }
      }

      setDeleteDialog(false);
      setSelectedOwner(null);
    }
    handleMenuClose();
  };

  const handleBulkDelete = () => {
    // Get the company IDs that will be deleted
    const deletedCompanyIds = owners
      .filter((owner) => selected.includes(owner.id))
      .map((owner) => owner.companyId);

    // Delete owners
    const newOwners = owners.filter((owner) => !selected.includes(owner.id));
    updateOwners(newOwners);

    // Also remove associated companies
    const savedCompanies = localStorage.getItem('onboarding_companies');
    if (savedCompanies) {
      try {
        const companies = JSON.parse(savedCompanies);
        const updatedCompanies = companies.filter(
          (company) => !deletedCompanyIds.includes(company.id)
        );
        localStorage.setItem('onboarding_companies', JSON.stringify(updatedCompanies));
      } catch (error) {
        console.error('Error updating companies data:', error);
      }
    }

    setSelected([]);
    setBulkDeleteDialog(false);
  };

  const handleAdd = () => {
    // Clear any existing data when creating new
    localStorage.removeItem('edit_owner_data');
    localStorage.removeItem('onboarding_owners');
    localStorage.removeItem('onboarding_companies');
    router.push('/dashboard/owners/create-owners');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/owners-2">
            Owners
          </Link>
        </Breadcrumbs>
      </Box>

      {/* Header with Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Owners</Typography>
        {owners.length > 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add
          </Button>
        )}
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
                        {owner.firstName} {owner.lastName}
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
            onClick={() => {
              setDeleteDialog(true);
            }}
            sx={{ color: 'error.main' }}
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
          <Button onClick={() => setDeleteDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteSingle} color="error" variant="contained">
            Delete
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
          <Button onClick={() => setBulkDeleteDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleBulkDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Page;
