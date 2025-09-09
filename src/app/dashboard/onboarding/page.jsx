/* eslint-disable perfectionist/sort-imports */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Alert,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { CustomPopover } from 'src/components/custom-popover';
import { Iconify } from 'src/components/iconify';

// Initial empty data
const initialOwners = [];
const initialCompanies = [];

// Industry and employee count options
const industryOptions = [
  'Information Technology',
  'Healthcare',
  'Education',
  'Real Estate',
  'Banking',
  'Finance',
  'Manufacturing',
  'Retail',
  'Marketing & Advertising',
  'Research & Development',
  'Financial Services',
  'Construction',
  'Transportation',
  'Energy',
  'Entertainment',
  'Food & Beverage',
  'Consulting',
  'Non-profit',
  'Government',
  'Other',
];

const employeeCountOptions = ['1-50', '51-100', '101-500', '501-1000', '1000+'];

const steps = ['Owner Onboarding', 'Company Onboarding'];

const Page = () => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

  // Owner state
  const [owners, setOwners] = useState([]);
  const [selectedOwners, setSelectedOwners] = useState([]);
  const [ownerAnchorEl, setOwnerAnchorEl] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerDeleteDialog, setOwnerDeleteDialog] = useState(false);
  const [ownerBulkDeleteDialog, setOwnerBulkDeleteDialog] = useState(false);
  const [ownerFormDialog, setOwnerFormDialog] = useState(false);
  const [ownerFormData, setOwnerFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [ownerErrors, setOwnerErrors] = useState({});
  const [isOwnerEdit, setIsOwnerEdit] = useState(false);
  const [ownerSubmitting, setOwnerSubmitting] = useState(false);

  // Company state
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companyAnchorEl, setCompanyAnchorEl] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyDeleteDialog, setCompanyDeleteDialog] = useState(false);
  const [companyBulkDeleteDialog, setCompanyBulkDeleteDialog] = useState(false);
  const [companyFormDialog, setCompanyFormDialog] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    companyName: '',
    industryType: '',
    companyEmail: '',
    companyAddress: '',
    employeeCount: '',
    companyURL: '',
  });
  const [companyErrors, setCompanyErrors] = useState({});
  const [isCompanyEdit, setIsCompanyEdit] = useState(false);
  const [companySubmitting, setCompanySubmitting] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const savedOwners = localStorage.getItem('onboarding_owners');
    const savedCompanies = localStorage.getItem('onboarding_companies');

    if (savedOwners) {
      setOwners(JSON.parse(savedOwners));
    } else {
      setOwners(initialOwners);
      localStorage.setItem('onboarding_owners', JSON.stringify(initialOwners));
    }

    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    } else {
      setCompanies(initialCompanies);
      localStorage.setItem('onboarding_companies', JSON.stringify(initialCompanies));
    }
  }, []);

  // Owner CRUD functions
  const updateOwners = (newOwners) => {
    setOwners(newOwners);
    localStorage.setItem('onboarding_owners', JSON.stringify(newOwners));
  };

  const handleOwnerSelectAll = (checked) => {
    if (checked) {
      setSelectedOwners(owners.map((owner) => owner.id));
    } else {
      setSelectedOwners([]);
    }
  };

  const handleOwnerSelectOne = (ownerId) => {
    setSelectedOwners((prev) =>
      prev.includes(ownerId) ? prev.filter((id) => id !== ownerId) : [...prev, ownerId]
    );
  };

  const handleOwnerMenuOpen = (event, owner) => {
    setOwnerAnchorEl(event.currentTarget);
    setSelectedOwner(owner);
  };

  const handleOwnerMenuClose = () => {
    setOwnerAnchorEl(null);
    setSelectedOwner(null);
  };

  const openOwnerForm = (owner = null) => {
    if (owner) {
      setIsOwnerEdit(true);
      setOwnerFormData({ ...owner });
    } else {
      setIsOwnerEdit(false);
      setOwnerFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      });
    }
    setOwnerErrors({});
    setOwnerFormDialog(true);
    handleOwnerMenuClose();
  };

  const closeOwnerForm = () => {
    setOwnerFormDialog(false);
    setOwnerFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });
    setOwnerErrors({});
    setIsOwnerEdit(false);
  };

  const handleOwnerInputChange = (field) => (event) => {
    const value = event.target.value;
    setOwnerFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (ownerErrors[field]) {
      setOwnerErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateOwnerForm = () => {
    const newErrors = {};

    if (!ownerFormData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!ownerFormData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!ownerFormData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(ownerFormData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!ownerFormData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setOwnerErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOwnerSubmit = async (event) => {
    event.preventDefault();

    if (!validateOwnerForm()) {
      return;
    }

    setOwnerSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isOwnerEdit) {
        const newOwners = owners.map((owner) =>
          owner.id === ownerFormData.id ? { ...ownerFormData } : owner
        );
        updateOwners(newOwners);
      } else {
        const newOwner = {
          id: Date.now(),
          ...ownerFormData,
        };
        updateOwners([...owners, newOwner]);
      }

      closeOwnerForm();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setOwnerSubmitting(false);
    }
  };

  const handleOwnerDeleteSingle = () => {
    if (selectedOwner) {
      const newOwners = owners.filter((owner) => owner.id !== selectedOwner.id);
      updateOwners(newOwners);
      setOwnerDeleteDialog(false);
      setSelectedOwner(null);
    }
    handleOwnerMenuClose();
  };

  const handleOwnerBulkDelete = () => {
    const newOwners = owners.filter((owner) => !selectedOwners.includes(owner.id));
    updateOwners(newOwners);
    setSelectedOwners([]);
    setOwnerBulkDeleteDialog(false);
  };

  // Company CRUD functions (similar to owners)
  const updateCompanies = (newCompanies) => {
    setCompanies(newCompanies);
    localStorage.setItem('onboarding_companies', JSON.stringify(newCompanies));
  };

  const handleCompanySelectAll = (checked) => {
    if (checked) {
      setSelectedCompanies(companies.map((company) => company.id));
    } else {
      setSelectedCompanies([]);
    }
  };

  const handleCompanySelectOne = (companyId) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
  };

  const handleCompanyMenuOpen = (event, company) => {
    setCompanyAnchorEl(event.currentTarget);
    setSelectedCompany(company);
  };

  const handleCompanyMenuClose = () => {
    setCompanyAnchorEl(null);
    setSelectedCompany(null);
  };

  const openCompanyForm = (company = null) => {
    if (company) {
      setIsCompanyEdit(true);
      setCompanyFormData({ ...company });
    } else {
      setIsCompanyEdit(false);
      setCompanyFormData({
        companyName: '',
        industryType: '',
        companyEmail: '',
        companyAddress: '',
        employeeCount: '',
        companyURL: '',
      });
    }
    setCompanyErrors({});
    setCompanyFormDialog(true);
    handleCompanyMenuClose();
  };

  const closeCompanyForm = () => {
    setCompanyFormDialog(false);
    setCompanyFormData({
      companyName: '',
      industryType: '',
      companyEmail: '',
      companyAddress: '',
      employeeCount: '',
      companyURL: '',
    });
    setCompanyErrors({});
    setIsCompanyEdit(false);
  };

  const handleCompanyInputChange = (field) => (event) => {
    const value = event.target.value;
    setCompanyFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (companyErrors[field]) {
      setCompanyErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateCompanyForm = () => {
    const newErrors = {};

    if (!companyFormData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!companyFormData.industryType) {
      newErrors.industryType = 'Industry type is required';
    }

    if (!companyFormData.companyEmail.trim()) {
      newErrors.companyEmail = 'Company email is required';
    } else if (!/\S+@\S+\.\S+/.test(companyFormData.companyEmail)) {
      newErrors.companyEmail = 'Email is invalid';
    }

    if (!companyFormData.companyAddress.trim()) {
      newErrors.companyAddress = 'Company address is required';
    }

    if (!companyFormData.employeeCount) {
      newErrors.employeeCount = 'Employee count is required';
    }

    if (!companyFormData.companyURL.trim()) {
      newErrors.companyURL = 'Company URL is required';
    } else {
      try {
        new URL(companyFormData.companyURL);
      } catch {
        newErrors.companyURL = 'Please enter a valid URL (e.g., https://example.com)';
      }
    }

    setCompanyErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCompanySubmit = async (event) => {
    event.preventDefault();

    if (!validateCompanyForm()) {
      return;
    }

    setCompanySubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isCompanyEdit) {
        const newCompanies = companies.map((company) =>
          company.id === companyFormData.id ? { ...companyFormData } : company
        );
        updateCompanies(newCompanies);
      } else {
        const newCompany = {
          id: Date.now(),
          ...companyFormData,
        };
        updateCompanies([...companies, newCompany]);
      }

      closeCompanyForm();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCompanySubmitting(false);
    }
  };

  const handleCompanyDeleteSingle = () => {
    if (selectedCompany) {
      const newCompanies = companies.filter((company) => company.id !== selectedCompany.id);
      updateCompanies(newCompanies);
      setCompanyDeleteDialog(false);
      setSelectedCompany(null);
    }
    handleCompanyMenuClose();
  };

  const handleCompanyBulkDelete = () => {
    const newCompanies = companies.filter((company) => !selectedCompanies.includes(company.id));
    updateCompanies(newCompanies);
    setSelectedCompanies([]);
    setCompanyBulkDeleteDialog(false);
  };

  const navigateToCompanyDetail = (id) => {
    if (id) {
      router.push(`/dashboard/owner-detail`);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const renderOwnerStep = () => (
    <Box>
      {/* Header with Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Onboard Owners</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openOwnerForm()}>
          Add Owner
        </Button>
      </Box>

      {/* Empty State or Table */}
      {owners.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No owners added yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Get started by adding your first owner
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openOwnerForm()}
            size="large"
          >
            Add Your First Owner
          </Button>
        </Card>
      ) : (
        <>
          {/* Bulk Actions */}
          {selectedOwners.length > 0 && (
            <Card sx={{ mb: 2, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2">{selectedOwners.length} item(s) selected</Typography>
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setOwnerBulkDeleteDialog(true)}
                >
                  Delete Selected
                </Button>
              </Box>
            </Card>
          )}

          {/* Owners Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedOwners.length === owners.length && owners.length > 0}
                        indeterminate={
                          selectedOwners.length > 0 && selectedOwners.length < owners.length
                        }
                        onChange={(e) => handleOwnerSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Working Email</TableCell>
                    <TableCell>Phone Number</TableCell>
                    <TableCell width={88} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {owners.map((owner) => (
                    <TableRow key={owner.id} hover selected={selectedOwners.includes(owner.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedOwners.includes(owner.id)}
                          onChange={() => handleOwnerSelectOne(owner.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {owner.firstName} {owner.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{owner.email}</Typography>
                      </TableCell>
                      <TableCell>{owner.phone}</TableCell>
                      <TableCell>
                        <IconButton onClick={(e) => handleOwnerMenuOpen(e, owner)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  );

  const renderCompanyStep = () => (
    <Box>
      {/* Header with Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Onboard Companies</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openCompanyForm()}>
          Add Company
        </Button>
      </Box>

      {/* Empty State or Table */}
      {companies.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No companies added yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add your company information to complete the onboarding process
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openCompanyForm()}
            size="large"
          >
            Add Your First Company
          </Button>
        </Card>
      ) : (
        <>
          {/* Bulk Actions */}
          {selectedCompanies.length > 0 && (
            <Card sx={{ mb: 2, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2">{selectedCompanies.length} item(s) selected</Typography>
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setCompanyBulkDeleteDialog(true)}
                >
                  Delete Selected
                </Button>
              </Box>
            </Card>
          )}

          {/* Companies Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={
                          selectedCompanies.length === companies.length && companies.length > 0
                        }
                        indeterminate={
                          selectedCompanies.length > 0 &&
                          selectedCompanies.length < companies.length
                        }
                        onChange={(e) => handleCompanySelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>Company Name</TableCell>
                    <TableCell>Industry</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Employee Count</TableCell>
                    <TableCell>Website</TableCell>
                    <TableCell width={88} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow
                      key={company.id}
                      hover
                      selected={selectedCompanies.includes(company.id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedCompanies.includes(company.id)}
                          onChange={() => handleCompanySelectOne(company.id)}
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
                      <TableCell>
                        <Typography variant="body2">{company.companyAddress}</Typography>
                      </TableCell>
                      <TableCell>{company.employeeCount}</TableCell>
                      <TableCell>
                        <Link href={company.companyURL} target="_blank" rel="noopener noreferrer">
                          <Typography variant="body2" color="primary">
                            Visit Website
                          </Typography>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={(e) => handleCompanyMenuOpen(e, company)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Onboarding Process
        </Typography>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Typography color="text.primary">Onboarding</Typography>
        </Breadcrumbs>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Box sx={{ mb: 4 }}>
        {activeStep === 0 && renderOwnerStep()}
        {activeStep === 1 && renderCompanyStep()}
      </Box>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={activeStep === steps.length - 1}
          endIcon={<ArrowForwardIcon />}
          variant="contained"
        >
          Continue
        </Button>
      </Box>

      {/* Owner Form Dialog */}
      <Dialog open={ownerFormDialog} onClose={closeOwnerForm} maxWidth="md" fullWidth>
        <DialogTitle>{isOwnerEdit ? 'Edit Owner' : 'Add Owner'}</DialogTitle>
        <form onSubmit={handleOwnerSubmit}>
          <DialogContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
                gap: 2,
                mt: 1,
              }}
            >
              <TextField
                fullWidth
                label="First Name"
                value={ownerFormData.firstName}
                onChange={handleOwnerInputChange('firstName')}
                error={Boolean(ownerErrors.firstName)}
                helperText={ownerErrors.firstName}
                required
              />
              <TextField
                fullWidth
                label="Last Name"
                value={ownerFormData.lastName}
                onChange={handleOwnerInputChange('lastName')}
                error={Boolean(ownerErrors.lastName)}
                helperText={ownerErrors.lastName}
                required
              />
              <TextField
                fullWidth
                label="Working Email"
                type="email"
                value={ownerFormData.email}
                onChange={handleOwnerInputChange('email')}
                error={Boolean(ownerErrors.email)}
                helperText={ownerErrors.email}
                required
              />
              <TextField
                fullWidth
                label="Phone Number"
                value={ownerFormData.phone}
                onChange={handleOwnerInputChange('phone')}
                error={Boolean(ownerErrors.phone)}
                helperText={ownerErrors.phone}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeOwnerForm}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={ownerSubmitting}>
              {ownerSubmitting
                ? isOwnerEdit
                  ? 'Updating...'
                  : 'Creating...'
                : isOwnerEdit
                  ? 'Update Owner'
                  : 'Create Owner'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Company Form Dialog */}
      <Dialog open={companyFormDialog} onClose={closeCompanyForm} maxWidth="md" fullWidth>
        <DialogTitle>{isCompanyEdit ? 'Edit Company' : 'Add Company'}</DialogTitle>
        <form onSubmit={handleCompanySubmit}>
          <DialogContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
                gap: 2,
                mt: 1,
              }}
            >
              <TextField
                fullWidth
                label="Company Name"
                value={companyFormData.companyName}
                onChange={handleCompanyInputChange('companyName')}
                error={Boolean(companyErrors.companyName)}
                helperText={companyErrors.companyName}
                required
              />
              <FormControl fullWidth error={Boolean(companyErrors.industryType)} required>
                <InputLabel>Industry Type</InputLabel>
                <Select
                  value={companyFormData.industryType}
                  onChange={handleCompanyInputChange('industryType')}
                  label="Industry Type"
                >
                  {industryOptions.map((industry) => (
                    <MenuItem key={industry} value={industry}>
                      {industry}
                    </MenuItem>
                  ))}
                </Select>
                {companyErrors.industryType && (
                  <FormHelperText>{companyErrors.industryType}</FormHelperText>
                )}
              </FormControl>
              <TextField
                fullWidth
                label="Company Email"
                type="email"
                value={companyFormData.companyEmail}
                onChange={handleCompanyInputChange('companyEmail')}
                error={Boolean(companyErrors.companyEmail)}
                helperText={companyErrors.companyEmail}
                required
              />
              <TextField
                fullWidth
                label="Company Address"
                value={companyFormData.companyAddress}
                onChange={handleCompanyInputChange('companyAddress')}
                error={Boolean(companyErrors.companyAddress)}
                helperText={companyErrors.companyAddress}
                required
                multiline
                rows={2}
              />
              <FormControl fullWidth error={Boolean(companyErrors.employeeCount)} required>
                <InputLabel>Employee Count</InputLabel>
                <Select
                  value={companyFormData.employeeCount}
                  onChange={handleCompanyInputChange('employeeCount')}
                  label="Employee Count"
                >
                  {employeeCountOptions.map((count) => (
                    <MenuItem key={count} value={count}>
                      {count}
                    </MenuItem>
                  ))}
                </Select>
                {companyErrors.employeeCount && (
                  <FormHelperText>{companyErrors.employeeCount}</FormHelperText>
                )}
              </FormControl>
              <TextField
                fullWidth
                label="Company URL"
                value={companyFormData.companyURL}
                onChange={handleCompanyInputChange('companyURL')}
                error={Boolean(companyErrors.companyURL)}
                helperText={companyErrors.companyURL}
                required
                placeholder="https://example.com"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCompanyForm}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={companySubmitting}>
              {companySubmitting
                ? isCompanyEdit
                  ? 'Updating...'
                  : 'Creating...'
                : isCompanyEdit
                  ? 'Update Company'
                  : 'Create Company'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Owner Action Menu */}
      <CustomPopover
        open={Boolean(ownerAnchorEl)}
        anchorEl={ownerAnchorEl}
        onClose={handleOwnerMenuClose}
        slotProps={{
          arrow: { placement: 'right-center', offset: 14, size: 15 },
          paper: { sx: { borderRadius: 2, boxShadow: (theme) => theme.shadows[6], maxWidth: 140 } },
        }}
      >
        <MenuList>
          <MenuItem onClick={() => openOwnerForm(selectedOwner)}>
            <EditIcon fontSize="small" />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              setOwnerDeleteDialog(true);
              handleOwnerMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/* Company Action Menu */}
      <CustomPopover
        open={Boolean(companyAnchorEl)}
        anchorEl={companyAnchorEl}
        onClose={handleCompanyMenuClose}
        slotProps={{
          arrow: { placement: 'right-center', offset: 14, size: 15 },
          paper: { sx: { borderRadius: 2, boxShadow: (theme) => theme.shadows[6], maxWidth: 140 } },
        }}
      >
        <MenuList>
          <MenuItem onClick={() => navigateToCompanyDetail(selectedCompany?.id)}>
            <Iconify icon="solar:eye-bold" />
            View Details
          </MenuItem>
          <MenuItem onClick={() => openCompanyForm(selectedCompany)}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              setCompanyDeleteDialog(true);
              handleCompanyMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/* Owner Delete Confirmation Dialog */}
      <Dialog
        open={ownerDeleteDialog}
        onClose={() => setOwnerDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Owner</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this owner? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOwnerDeleteDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleOwnerDeleteSingle} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Owner Bulk Delete Confirmation Dialog */}
      <Dialog
        open={ownerBulkDeleteDialog}
        onClose={() => setOwnerBulkDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Selected</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedOwners.length} selected owner(s)? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOwnerBulkDeleteDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleOwnerBulkDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Company Delete Confirmation Dialog */}
      <Dialog
        open={companyDeleteDialog}
        onClose={() => setCompanyDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this company? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompanyDeleteDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleCompanyDeleteSingle} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Company Bulk Delete Confirmation Dialog */}
      <Dialog
        open={companyBulkDeleteDialog}
        onClose={() => setCompanyBulkDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Selected</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedCompanies.length} selected company(s)? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompanyBulkDeleteDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleCompanyBulkDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Page;
