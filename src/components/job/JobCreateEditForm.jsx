'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Stack,
  Button,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import * as jobService from 'src/auth/services/recruiterJobService';
import { signOut } from 'src/auth/services/authService';

const JOB_CREATE_DEFAULT = {
  title: '',
  slug: '',
  department_id: null,
  location_id: null,
  employment: 'full_time',
  description_md: '',
  requirements_md: '',
  compensation_range: '',
  is_published: false,
};

const JobCreateEditForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = !!searchParams.get('id');
  const jobId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(JOB_CREATE_DEFAULT);

  const employmentOptions = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
  ];

  useEffect(() => {
    if (isEdit && jobId) {
      loadJobForEdit(jobId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, jobId]);

  const loadJobForEdit = async (id) => {
    try {
      setLoading(true);
      setError('');
      const job = await jobService.getJobById(id);
      setFormData({
        title: job.title || '',
        slug: job.slug || '',
        department_id: job.department_id || null,
        location_id: job.location_id || null,
        employment: job.employment || 'full_time',
        description_md: job.description_md || '',
        requirements_md: job.requirements_md || '',
        compensation_range: job.compensation_range || '',
        is_published: job.is_published || false,
      });
    } catch (err) {
      if (err?.code === 'UNAUTHORIZED') {
        toast.error('Session expired. Please sign in again.');
        signOut();
        router.push('/auth/signin');
        return;
      }
      console.error('Error loading job data:', err);
      setError(err.message || 'Failed to load job data for editing');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) =>
    title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'title' && { slug: generateSlug(value) }),
    }));
  };

  const handleSwitchChange = (field) => (event) =>
    setFormData((prev) => ({ ...prev, [field]: event.target.checked }));

  const validateForm = () => {
    const errors = [];
    if (!formData.title.trim()) errors.push('Job title is required');
    if (!formData.slug.trim()) errors.push('Job slug is required');
    if (!formData.description_md.trim()) errors.push('Job description is required');
    if (!formData.requirements_md.trim()) errors.push('Job requirements are required');
    if (!formData.compensation_range.trim()) errors.push('Compensation range is required');
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isEdit && jobId) {
        await jobService.updateJob(jobId, formData);
        toast.success('Job updated successfully!');
      } else {
        // create
        await jobService.createJob(formData);
        toast.success('Job created successfully!');
      }
      router.push('/dashboard/jobs/recruiters');
    } catch (err) {
      if (err?.code === 'UNAUTHORIZED') {
        toast.error('Session expired. Please sign in again.');
        signOut();
        router.push('/auth/signin');
        return;
      }
      console.error('Error saving job:', err);
      setError(err.message || 'Failed to save job');
      toast.error('Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/jobs/recruiters');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/jobs/recruiters">
            List
          </Link>
          <Typography color="text.primary">{isEdit ? 'Edit Job' : 'Create Job'}</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Edit Job' : 'Create New Job'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isEdit ? 'Update job details' : 'Fill details to create new job'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Stack spacing={3}>
              <TextField
                label="Job Title"
                placeholder="e.g., Senior React Developer"
                value={formData.title}
                onChange={handleInputChange('title')}
                fullWidth
                required
              />
              <TextField
                label="Job Slug"
                placeholder="e.g., senior-react-developer"
                value={formData.slug}
                onChange={handleInputChange('slug')}
                fullWidth
                required
                helperText="URL-friendly version of the job title (auto-generated)"
              />
              <FormControl fullWidth>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={formData.employment}
                  onChange={handleInputChange('employment')}
                  label="Employment Type"
                >
                  {employmentOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Compensation Range"
                placeholder="e.g., INR 15L–25L"
                value={formData.compensation_range}
                onChange={handleInputChange('compensation_range')}
                fullWidth
                required
                helperText="Salary range or compensation details"
              />
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Description
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <TextField
              label="Description"
              placeholder="Describe the role..."
              value={formData.description_md}
              onChange={handleInputChange('description_md')}
              fullWidth
              multiline
              rows={6}
              required
              helperText="You can use Markdown"
            />
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Requirements
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <TextField
              label="Requirements"
              placeholder="List required skills..."
              value={formData.requirements_md}
              onChange={handleInputChange('requirements_md')}
              fullWidth
              multiline
              rows={6}
              required
              helperText="You can use Markdown"
            />
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Publishing Options
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_published}
                  onChange={handleSwitchChange('is_published')}
                />
              }
              label="Publish job immediately"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {formData.is_published ? 'Visible to candidates' : 'Saved as draft'}
            </Typography>
          </Card>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={handleCancel} disabled={loading} size="large">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                size="large"
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading
                  ? isEdit
                    ? 'Updating...'
                    : 'Creating...'
                  : isEdit
                    ? 'Update Job'
                    : 'Create Job'}
              </Button>
            </Box>
          </Paper>
        </Stack>
      </form>
    </Container>
  );
};

export default JobCreateEditForm;
