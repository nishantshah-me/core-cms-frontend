'use client';

import { useState, useEffect } from 'react';
import { Box, TextField, Button, Stack, MenuItem, CircularProgress } from '@mui/material';
import toast from 'react-hot-toast';
import {
  createCompany,
  updateCompany,
  getCompanyById,
} from 'src/auth/services/ownerCompanyService';

const industryOptions = [
  'Manufacturing',
  'IT Services',
  'Finance',
  'Healthcare',
  'Retail',
  'Other',
];

const employeeRangeOptions = ['1-50', '51-100', '101-500', '500+'];

const CompanyForm = ({ ownerId, companyId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    office_address: '',
    industry_type: '',
    employee_count_range: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (companyId) {
      (async () => {
        try {
          setLoading(true);
          const company = await getCompanyById(companyId);
          setFormData({
            name: company?.name || '',
            email: company?.email || '',
            phone: company?.phone || '',
            website: company?.website || '',
            office_address: company?.office_address || '',
            industry_type: company?.industry_type || '',
            employee_count_range: company?.employee_count_range || '',
          });
        } catch (err) {
          console.error(err);
          toast.error('Failed to load company details');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [companyId]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ownerId) {
      toast.error('Missing owner ID');
      return;
    }
    try {
      setLoading(true);
      if (companyId) {
        await updateCompany(companyId, formData);
        toast.success('Company updated successfully');
      } else {
        await createCompany(ownerId, formData);
        toast.success('Company added successfully');
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Stack spacing={2}>
        <TextField
          name="name"
          label="Company Name"
          value={formData.name}
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
        />
        <TextField
          name="website"
          label="Website"
          value={formData.website}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          name="office_address"
          label="Office Address"
          value={formData.office_address}
          onChange={handleChange}
          fullWidth
          multiline
          rows={2}
        />
        <TextField
          select
          name="industry_type"
          label="Industry Type"
          value={formData.industry_type}
          onChange={handleChange}
          fullWidth
        >
          {industryOptions.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          name="employee_count_range"
          label="Employee Count Range"
          value={formData.employee_count_range}
          onChange={handleChange}
          fullWidth
        >
          {employeeRangeOptions.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>

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
            {companyId ? 'Update' : 'Add'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default CompanyForm;
