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
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, Add as AddIcon } from '@mui/icons-material';

import {
  getCompanyById,
  createCompany,
  updateCompany,
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

  // Company form data
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    industry_type: '',
    email: '',
    office_address: '',
    employee_count: '',
    website: '',
    phone: '',
  });
  const [companyErrors, setCompanyErrors] = useState({});

  // Load existing company data for editing
  const loadCompanyData = async () => {
    try {
      const response = await getCompanyById(companyId);

      setCompanyFormData({
        name: response.name || '',
        industry_type: response.industry_type || '',
        email: response.email || '',
        office_address: response.office_address || '',
        employee_count: response.employee_count || '',
        website: response.website || '',
        phone: response.phone || '',
      });
    } catch (err) {
      console.error('Error loading company data:', err);
      throw new Error('Failed to load company data');
    }
  };

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

        if (isEdit && companyId) {
          await loadCompanyData();
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

    if (!companyFormData.name.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (!companyFormData.industry_type) {
      newErrors.industry_type = 'Industry type is required';
    }

    if (!companyFormData.email.trim()) {
      newErrors.email = 'Company email is required';
    } else if (!/\S+@\S+\.\S+/.test(companyFormData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!companyFormData.office_address.trim()) {
      newErrors.office_address = 'Company address is required';
    }

    if (!companyFormData.employee_count) {
      newErrors.employee_count = 'Employee count is required';
    }

    if (!companyFormData.website.trim()) {
      newErrors.website = 'Company URL is required';
    } else {
      try {
        new URL(companyFormData.website);
      } catch {
        newErrors.website = 'Please enter a valid URL (e.g., https://example.com)';
      }
    }

    setCompanyErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        ...companyFormData,
        ...(isEdit ? {} : { owner_id: ownerId }),
      };

      if (isEdit) {
        await updateCompany(companyId, payload);
        toast.success('Company updated successfully');
      } else {
        await createCompany(payload);
        toast.success('Company created successfully');
      }

      router.push(`/dashboard/owners/owner-detail?owner_id=${ownerId}`);
    } catch (err) {
      console.error('Error saving company:', err);
      const errorMessage = err.message || err.detail || 'Failed to save company';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.push(`/dashboard/owners/owner-detail?owner_id=${ownerId}`);
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
            value={companyFormData.name}
            onChange={handleInputChange('name')}
            error={Boolean(companyErrors.name)}
            helperText={companyErrors.name}
            required
          />

          <FormControl fullWidth error={Boolean(companyErrors.industry_type)} required>
            <InputLabel>Industry Type</InputLabel>
            <Select
              value={companyFormData.industry_type}
              onChange={handleInputChange('industry_type')}
              label="Industry Type"
            >
              {industryOptions.map((industry) => (
                <MenuItem key={industry} value={industry}>
                  {industry}
                </MenuItem>
              ))}
            </Select>
            {companyErrors.industry_type && (
              <FormHelperText>{companyErrors.industry_type}</FormHelperText>
            )}
          </FormControl>

          <TextField
            fullWidth
            label="Company Email"
            type="email"
            value={companyFormData.email}
            onChange={handleInputChange('email')}
            error={Boolean(companyErrors.email)}
            helperText={companyErrors.email}
            required
          />

          <TextField
            fullWidth
            label="Company Number"
            value={companyFormData.phone}
            onChange={handleInputChange('phone')}
            error={Boolean(companyErrors.phone)}
            helperText={companyErrors.phone}
          />

          <FormControl fullWidth error={Boolean(companyErrors.employee_count)} required>
            <InputLabel>Employee Count</InputLabel>
            <Select
              value={companyFormData.employee_count}
              onChange={handleInputChange('employee_count')}
              label="Employee Count"
            >
              {employeeCountOptions.map((count) => (
                <MenuItem key={count} value={count}>
                  {count}
                </MenuItem>
              ))}
            </Select>
            {companyErrors.employee_count && (
              <FormHelperText>{companyErrors.employee_count}</FormHelperText>
            )}
          </FormControl>

          <TextField
            fullWidth
            label="Company URL"
            value={companyFormData.website}
            onChange={handleInputChange('website')}
            error={Boolean(companyErrors.website)}
            helperText={companyErrors.website}
            required
            placeholder="https://example.com"
          />

          <TextField
            fullWidth
            label="Company Address"
            value={companyFormData.office_address}
            onChange={handleInputChange('office_address')}
            error={Boolean(companyErrors.office_address)}
            helperText={companyErrors.office_address}
            required
            multiline
            rows={2}
            sx={{ gridColumn: { md: 'span 2' } }}
          />
        </Box>
      </Card>

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
