'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Card,
  Button,
  Typography,
  Container,
  Breadcrumbs,
  Link,
  TextField,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, Add as AddIcon } from '@mui/icons-material';
import {
  createCompany,
  updateCompany,
  getOwnerById,
  getCompanyById,
} from 'src/auth/services/ownerCompanyService';
import toast from 'react-hot-toast';

// Industry and employee count options
const industryOptions = [
  'IT Services',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Others',
];

const employeeCountOptions = ['1-50', '51-100', '101-500', '501-1000', '1000+'];

const CompanyManagementPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get URL parameters
  const ownerId = searchParams?.get('owner_id');
  const companyId = searchParams?.get('company_id');
  const isEdit = Boolean(companyId);

  // State management
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ownerData, setOwnerData] = useState(null);

  // Company form data
  const [companyFormData, setCompanyFormData] = useState({
    companyName: '',
    industryType: '',
    companyEmail: '',
    companyAddress: '',
    employeeCount: '',
    companyURL: '',
  });
  const [companyErrors, setCompanyErrors] = useState({});

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!ownerId) {
        setError('Owner ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Load owner data first
        const owner = await getOwnerById(ownerId);
        setOwnerData(owner);

        if (isEdit && companyId) {
          // Load existing company data for editing
          const company = await getCompanyById(companyId);

          setCompanyFormData({
            companyName: company.name || '',
            industryType: company.industry_type || '',
            companyEmail: company.email || '',
            companyAddress: company.office_address || '',
            employeeCount: company.employee_count_range || company.employee_count || '',
            companyURL: company.website || '',
          });
        } else {
          // Pre-fill email for new company
          setCompanyFormData((prev) => ({
            ...prev,
            companyEmail: owner.email || '',
          }));
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ownerId, companyId, isEdit]);

  // Handle form input changes
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setCompanyFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (companyErrors[field]) {
      setCompanyErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }

    // Clear general error
    if (error) {
      setError('');
    }
  };

  // Validate form
  const validateForm = () => {
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

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const companyData = {
        name: companyFormData.companyName,
        website: companyFormData.companyURL,
        phone: ownerData?.phone || '',
        email: companyFormData.companyEmail,
        office_address: companyFormData.companyAddress,
        employee_count: companyFormData.employeeCount,
        industry_type: companyFormData.industryType,
      };

      if (isEdit) {
        // Update existing company
        await updateCompany(companyId, companyData);
        toast.success('Company updated successfully');
      } else {
        // Create new company
        const payload = {
          ...companyData,
          owner_id: ownerId,
        };
        await createCompany(payload);
        toast.success('Company created successfully');
      }

      // Navigate back to owner detail page
      router.push(`/dashboard/owner-detail?owner_id=${ownerId}`);
    } catch (err) {
      console.error('Error saving company:', err);
      const errorMessage = err.message || 'Failed to save company';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.push(`/dashboard/owner-detail?owner_id=${ownerId}`);
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading company data...
        </Typography>
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
          <Link component="button" color="inherit" onClick={handleBack} sx={{ cursor: 'pointer' }}>
            Owner Detail
          </Link>
          <Typography color="text.primary">{isEdit ? 'Edit Company' : 'Add Company'}</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
          {isEdit ? 'Edit Company' : 'Add Company'}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Company Form */}

      <Box>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Company Information
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Company Name"
              value={companyFormData.companyName}
              onChange={handleInputChange('companyName')}
              error={Boolean(companyErrors.companyName)}
              helperText={companyErrors.companyName}
              required
            />
            <FormControl fullWidth error={Boolean(companyErrors.industryType)} required>
              <InputLabel>Industry Type</InputLabel>
              <Select
                value={companyFormData.industryType}
                onChange={handleInputChange('industryType')}
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
              onChange={handleInputChange('companyEmail')}
              error={Boolean(companyErrors.companyEmail)}
              helperText={companyErrors.companyEmail}
              required
            />

            <FormControl fullWidth error={Boolean(companyErrors.employeeCount)} required>
              <InputLabel>Employee Count</InputLabel>
              <Select
                value={companyFormData.employeeCount}
                onChange={handleInputChange('employeeCount')}
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
              label="Company Address"
              value={companyFormData.companyAddress}
              onChange={handleInputChange('companyAddress')}
              error={Boolean(companyErrors.companyAddress)}
              helperText={companyErrors.companyAddress}
              required
              multiline
            />

            <TextField
              fullWidth
              label="Company URL"
              value={companyFormData.companyURL}
              onChange={handleInputChange('companyURL')}
              error={Boolean(companyErrors.companyURL)}
              helperText={companyErrors.companyURL}
              required
              placeholder="https://example.com"
            />
          </Box>
        </Card>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />} variant="outlined" size="medium">
          Back to Owner
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          endIcon={
            isSubmitting ? <CircularProgress size={16} /> : isEdit ? <SaveIcon /> : <AddIcon />
          }
          variant="contained"
          size="medium"
        >
          {isSubmitting
            ? isEdit
              ? 'Updating...'
              : 'Creating...'
            : isEdit
              ? 'Update Company'
              : 'Create Company'}
        </Button>
      </Box>
    </Container>
  );
};

export default CompanyManagementPage;
