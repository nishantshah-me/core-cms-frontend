'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Box,
  Card,
  Button,
  TextField,
  Typography,
  Container,
  Breadcrumbs,
  Link,
  Alert,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';

// Industry type options
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

// Employee count options
const employeeCountOptions = ['1-50', '51-100', '101-500', '501-1000', '1000+'];

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = Boolean(editId);

  const [formData, setFormData] = useState({
    companyName: '',
    industryType: '',
    companyEmail: '',
    companyAddress: '',
    employeeCount: '',
    companyURL: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load data for edit mode
  useEffect(() => {
    if (isEdit && editId) {
      const savedCompanies = localStorage.getItem('companies');
      if (savedCompanies) {
        const companies = JSON.parse(savedCompanies);
        const company = companies.find((c) => c.id === parseInt(editId));
        if (company) {
          setFormData({
            companyName: company.companyName,
            industryType: company.industryType,
            companyEmail: company.companyEmail,
            companyAddress: company.companyAddress,
            employeeCount: company.employeeCount,
            companyURL: company.companyURL,
          });
        }
      }
    }
  }, [isEdit, editId]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.industryType) {
      newErrors.industryType = 'Industry type is required';
    }

    if (!formData.companyEmail.trim()) {
      newErrors.companyEmail = 'Company email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.companyEmail)) {
      newErrors.companyEmail = 'Email is invalid';
    }

    if (!formData.companyAddress.trim()) {
      newErrors.companyAddress = 'Company address is required';
    }

    if (!formData.employeeCount) {
      newErrors.employeeCount = 'Employee count is required';
    }

    if (!formData.companyURL.trim()) {
      newErrors.companyURL = 'Company URL is required';
    } else {
      // Basic URL validation
      try {
        new URL(formData.companyURL);
      } catch {
        newErrors.companyURL = 'Please enter a valid URL (e.g., https://example.com)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const savedCompanies = localStorage.getItem('companies');
      let companies = savedCompanies ? JSON.parse(savedCompanies) : [];

      if (isEdit) {
        // Update existing company
        companies = companies.map((company) =>
          company.id === parseInt(editId) ? { ...company, ...formData } : company
        );
      } else {
        // Create new company
        const newCompany = {
          id: Date.now(), // Simple ID generation
          ...formData,
        };
        companies.push(newCompany);
      }

      localStorage.setItem('companies', JSON.stringify(companies));

      setSuccessMessage(isEdit ? 'Company updated successfully!' : 'Company created successfully!');

      // Navigate back after success
      setTimeout(() => {
        router.push('/dashboard/company');
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/company');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Edit Company' : 'Create Company'}
        </Typography>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/company">
            Company
          </Link>
          <Typography color="text.primary">{isEdit ? 'Edit' : 'Create'}</Typography>
        </Breadcrumbs>
      </Box>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.submit}
        </Alert>
      )}

      {/* Form */}
      <Card sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          {/* CSS grid for two-per-row on md+ (1-per-row on xs) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
              columnGap: 2, // horizontal gap between columns
              rowGap: 3, // vertical gap between rows
              alignItems: 'center',
            }}
          >
            <TextField
              fullWidth
              label="Company Name"
              value={formData.companyName}
              onChange={handleInputChange('companyName')}
              error={Boolean(errors.companyName)}
              helperText={errors.companyName}
              required
              variant="outlined"
            />

            <FormControl fullWidth error={Boolean(errors.industryType)} required variant="outlined">
              <InputLabel>Industry Type</InputLabel>
              <Select
                value={formData.industryType}
                onChange={handleInputChange('industryType')}
                label="Industry Type"
              >
                {industryOptions.map((industry) => (
                  <MenuItem key={industry} value={industry}>
                    {industry}
                  </MenuItem>
                ))}
              </Select>
              {errors.industryType && <FormHelperText>{errors.industryType}</FormHelperText>}
            </FormControl>

            <TextField
              fullWidth
              label="Company Email"
              type="email"
              value={formData.companyEmail}
              onChange={handleInputChange('companyEmail')}
              error={Boolean(errors.companyEmail)}
              helperText={errors.companyEmail}
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Company Address"
              value={formData.companyAddress}
              onChange={handleInputChange('companyAddress')}
              error={Boolean(errors.companyAddress)}
              helperText={errors.companyAddress}
              required
              variant="outlined"
              multiline
              // rows={2}
            />

            <FormControl
              fullWidth
              error={Boolean(errors.employeeCount)}
              required
              variant="outlined"
            >
              <InputLabel>Employee Count</InputLabel>
              <Select
                value={formData.employeeCount}
                onChange={handleInputChange('employeeCount')}
                label="Employee Count"
              >
                {employeeCountOptions.map((count) => (
                  <MenuItem key={count} value={count}>
                    {count}
                  </MenuItem>
                ))}
              </Select>
              {errors.employeeCount && <FormHelperText>{errors.employeeCount}</FormHelperText>}
            </FormControl>

            <TextField
              fullWidth
              label="Company URL"
              value={formData.companyURL}
              onChange={handleInputChange('companyURL')}
              error={Boolean(errors.companyURL)}
              helperText={errors.companyURL}
              required
              variant="outlined"
              placeholder="https://example.com"
            />
          </Box>

          {/* Buttons aligned to the right */}
          <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isSubmitting}
                size="large"
              >
                Cancel
              </Button>

              <Button type="submit" variant="contained" disabled={isSubmitting} size="large">
                {isSubmitting
                  ? isEdit
                    ? 'Updating...'
                    : 'Creating...'
                  : isEdit
                    ? 'Update Company'
                    : 'Create Company'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Card>
    </Container>
  );
};

export default Page;
