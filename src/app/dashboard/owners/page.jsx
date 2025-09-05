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
  //   People as PeopleIcon,
  //   PersonAdd as PersonAddIcon,
  //   Pending as PendingIcon,
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
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@startup.com',
    phone: '+1 234 567 8901',
    company: 'Innovation Labs',
  },
  {
    id: 3,
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.j@enterprise.com',
    phone: '+1 234 567 8902',
    company: 'Enterprise Corp',
  },
  {
    id: 4,
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@agency.com',
    phone: '+1 234 567 8903',
    company: 'Creative Agency',
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

  // Load owners from localStorage or use initial data
  useEffect(() => {
    const savedOwners = localStorage.getItem('owners');
    if (savedOwners) {
      setOwners(JSON.parse(savedOwners));
    } else {
      setOwners(initialOwners);
      localStorage.setItem('owners', JSON.stringify(initialOwners));
    }
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
      router.push(`/dashboard/owners/create-owners?edit=${selectedOwner.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteSingle = () => {
    if (selectedOwner) {
      const newOwners = owners.filter((owner) => owner.id !== selectedOwner.id);
      updateOwners(newOwners);
      setDeleteDialog(false);
      setSelectedOwner(null);
    }
    handleMenuClose();
  };

  const handleBulkDelete = () => {
    const newOwners = owners.filter((owner) => !selected.includes(owner.id));
    updateOwners(newOwners);
    setSelected([]);
    setBulkDeleteDialog(false);
  };

  // Calculate statistics
  //   const totalOwners = owners.length;
  //   const newJoiners = owners.filter((owner) => {
  //     // Simulate new joiners (owners with id > 2 as example)
  //     return owner.id > 2;
  //   }).length;

  //   const pendingOwners = Math.floor(totalOwners * 0.2); // 20% pending as example

  //   const statsCards = [
  //     {
  //       title: 'Total Owners',
  //       value: totalOwners,
  //       icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
  //       color: 'primary.main',
  //     },
  //     {
  //       title: 'New Joiners',
  //       value: newJoiners,
  //       icon: <PersonAddIcon sx={{ fontSize: 40, color: 'success.main' }} />,
  //       color: 'success.main',
  //     },
  //     {
  //       title: 'Pending',
  //       value: pendingOwners,
  //       icon: <PendingIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
  //       color: 'warning.main',
  //     },
  //   ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          List
        </Typography>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/owners">
            Owner
          </Link>
          <Typography color="text.primary">List</Typography>
        </Breadcrumbs>
      </Box>

      {/* Statistics Cards */}
      {/* <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                border: `2px solid ${card.color}`,
                borderRadius: 2,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <Box sx={{ mr: 3 }}>{card.icon}</Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: card.color }}>
                  {card.value}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {card.title}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid> */}

      {/* Header with Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Onboard Owners</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/dashboard/owners/create-owners')}
        >
          Add Owner
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
                    checked={selected.length === owners.length && owners.length > 0}
                    indeterminate={selected.length > 0 && selected.length < owners.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Company</TableCell>
                <TableCell width={88}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {owners.map((owner) => (
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
            placement: 'right-center', // arrow points left, aligned center
            offset: 14, // adjust until it aligns with 3-dot button
            size: 15, // small diamond, matches UI
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
        <DialogTitle>Delete Owner</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this owner? This action cannot be undone.
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
            Are you sure you want to delete {selected.length} selected owner(s)? This action cannot
            be undone.
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
