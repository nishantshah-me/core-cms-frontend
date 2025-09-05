'use client';

import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = Boolean(editId);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load data for edit mode
  useEffect(() => {
    if (isEdit && editId) {
      const savedOwners = localStorage.getItem('owners');
      if (savedOwners) {
        const owners = JSON.parse(savedOwners);
        const owner = owners.find((o) => o.id === parseInt(editId));
        if (owner) {
          setFormData({
            firstName: owner.firstName,
            lastName: owner.lastName,
            email: owner.email,
            phone: owner.phone,
            company: owner.company,
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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
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

      const savedOwners = localStorage.getItem('owners');
      let owners = savedOwners ? JSON.parse(savedOwners) : [];

      if (isEdit) {
        // Update existing owner
        owners = owners.map((owner) =>
          owner.id === parseInt(editId) ? { ...owner, ...formData } : owner
        );
      } else {
        // Create new owner
        const newOwner = {
          id: Date.now(), // Simple ID generation
          ...formData,
        };
        owners.push(newOwner);
      }

      localStorage.setItem('owners', JSON.stringify(owners));

      setSuccessMessage(isEdit ? 'Owner updated successfully!' : 'Owner created successfully!');

      // Navigate back after success
      setTimeout(() => {
        router.push('/dashboard/owners');
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/owners');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Edit Owner' : 'Create Owner'}
        </Typography>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/owners">
            Owner
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
              label="First Name"
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              error={Boolean(errors.firstName)}
              helperText={errors.firstName}
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={handleInputChange('lastName')}
              error={Boolean(errors.lastName)}
              helperText={errors.lastName}
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={Boolean(errors.email)}
              helperText={errors.email}
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              error={Boolean(errors.phone)}
              helperText={errors.phone}
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Company"
              value={formData.company}
              onChange={handleInputChange('company')}
              error={Boolean(errors.company)}
              helperText={errors.company}
              required
              variant="outlined"
            />
            <Box />
          </Box>

          {/* Buttons aligned to the right (like your reference) */}
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
                    ? 'Update Owner'
                    : 'Create Owner'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Card>
    </Container>
  );
};

export default Page;
