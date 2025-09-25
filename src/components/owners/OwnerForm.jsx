'use client';

import { useState } from 'react';
import { Box, TextField, Button, Stack, CircularProgress } from '@mui/material';
import toast from 'react-hot-toast';
import { updateOwner } from 'src/auth/services/ownerCompanyService';

const OwnerForm = ({ ownerData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    username: ownerData?.username || '',
    email: ownerData?.email || '',
    phone: ownerData?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ownerData?.id) {
      toast.error('Missing owner ID');
      return;
    }
    try {
      setLoading(true);
      await updateOwner(ownerData.id, formData);
      toast.success('Owner updated successfully');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to update owner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Stack spacing={2}>
        <TextField
          name="username"
          label="Full Name"
          value={formData.username}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          name="email"
          label="Email Address"
          value={formData.email}
          onChange={handleChange}
          type="email"
          fullWidth
          required
        />
        <TextField
          name="phone"
          label="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          fullWidth
          required
        />
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default OwnerForm;
