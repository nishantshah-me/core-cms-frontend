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

// Initial mock data for companies - this will be managed in localStorage for CRUD
const initialCompanies = [
  {
    id: 1,
    companyName: 'Tech Solutions Inc',
    industryType: 'Information Technology',
    companyEmail: 'info@techsolutions.com',
    companyAddress: '123 Tech Street, Silicon Valley, CA 94025',
    employeeCount: '51-100',
    companyURL: 'https://www.techsolutions.com',
  },
  {
    id: 2,
    companyName: 'Innovation Labs',
    industryType: 'Research & Development',
    companyEmail: 'contact@innovationlabs.com',
    companyAddress: '456 Innovation Drive, Boston, MA 02101',
    employeeCount: '101-500',
    companyURL: 'https://www.innovationlabs.com',
  },
  {
    id: 3,
    companyName: 'Enterprise Corp',
    industryType: 'Financial Services',
    companyEmail: 'hello@enterprisecorp.com',
    companyAddress: '789 Enterprise Blvd, New York, NY 10001',
    employeeCount: '501-1000',
    companyURL: 'https://www.enterprisecorp.com',
  },
  {
    id: 4,
    companyName: 'Creative Agency',
    industryType: 'Marketing & Advertising',
    companyEmail: 'studio@creativeagency.com',
    companyAddress: '321 Creative Ave, Los Angeles, CA 90210',
    employeeCount: '1-50',
    companyURL: 'https://www.creativeagency.com',
  },
];

const Page = () => {
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  // Load companies from localStorage or use initial data
  useEffect(() => {
    const savedCompanies = localStorage.getItem('companies');
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    } else {
      setCompanies(initialCompanies);
      localStorage.setItem('companies', JSON.stringify(initialCompanies));
    }
  }, []);

  // Save to localStorage whenever companies change
  const updateCompanies = (newCompanies) => {
    setCompanies(newCompanies);
    localStorage.setItem('companies', JSON.stringify(newCompanies));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(companies.map((company) => company.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (companyId) => {
    setSelected((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
  };

  const handleMenuOpen = (event, company) => {
    setAnchorEl(event.currentTarget);
    setSelectedCompany(company);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCompany(null);
  };

  const handleEdit = () => {
    if (selectedCompany) {
      router.push(`/dashboard/company/create-company?edit=${selectedCompany.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteSingle = () => {
    if (selectedCompany) {
      const newCompanies = companies.filter((company) => company.id !== selectedCompany.id);
      updateCompanies(newCompanies);
      setDeleteDialog(false);
      setSelectedCompany(null);
    }
    handleMenuClose();
  };

  const handleBulkDelete = () => {
    const newCompanies = companies.filter((company) => !selected.includes(company.id));
    updateCompanies(newCompanies);
    setSelected([]);
    setBulkDeleteDialog(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Company List
        </Typography>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/company">
            Company
          </Link>
          <Typography color="text.primary">List</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header with Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Onboard Companies</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/dashboard/company/create-company')}
        >
          Add
        </Button>
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
                    checked={selected.length === companies.length && companies.length > 0}
                    indeterminate={selected.length > 0 && selected.length < companies.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>Company Name</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Employee Count</TableCell>
                <TableCell>Address</TableCell>
                <TableCell width={88} />
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} hover selected={selected.includes(company.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(company.id)}
                      onChange={() => handleSelectOne(company.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {company.companyName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{company.industryType}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{company.companyEmail}</Typography>
                  </TableCell>
                  <TableCell>{company.employeeCount}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{company.companyAddress}</Typography>
                    <div>
                      <Link href={company.companyURL} target="_blank" rel="noopener noreferrer">
                        <Typography variant="body2" color="primary">
                          Visit Website
                        </Typography>
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={(e) => handleMenuOpen(e, company)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
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
          <MenuItem
            onClick={() => {
              handleEdit();
              handleMenuClose();
            }}
          >
            <EditIcon fontSize="small" />
            Edit
          </MenuItem>

          <MenuItem
            onClick={() => {
              setDeleteDialog(true);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this company? This action cannot be undone.
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
            Are you sure you want to delete {selected.length} selected company(s)? This action
            cannot be undone.
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
