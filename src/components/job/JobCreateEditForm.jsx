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
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

// Local storage key for jobs
const JOBS_STORAGE_KEY = 'recruiter_jobs';

const JobCreateEditForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = !!searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state based on backend structure
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    department_id: null,
    location_id: null,
    employment: 'full_time',
    description_md: '',
    requirements_md: '',
    compensation_range: '',
    is_published: false,
  });

  // Employment type options
  const employmentOptions = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
  ];

  // Load job data for editing
  useEffect(() => {
    if (isEdit) {
      loadJobForEdit();
    }
  }, [isEdit]);

  const loadJobForEdit = () => {
    try {
      const jobData = localStorage.getItem('job_edit_data');
      if (jobData) {
        const job = JSON.parse(jobData);
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
      } else {
        setError('Job data not found. Please go back and try again.');
      }
    } catch (error) {
      console.error('Error loading job data:', error);
      setError('Failed to load job data for editing');
    }
  };

  // Generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handle form field changes
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Auto-generate slug when title changes
      ...(field === 'title' && { slug: generateSlug(value) }),
    }));
  };

  // Handle switch change
  const handleSwitchChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  // Get jobs from localStorage
  const getJobsFromStorage = () => {
    try {
      const storedJobs = localStorage.getItem(JOBS_STORAGE_KEY);
      return storedJobs ? JSON.parse(storedJobs) : [];
    } catch (error) {
      console.error('Error reading jobs from localStorage:', error);
      return [];
    }
  };

  // Save jobs to localStorage
  const saveJobsToStorage = (jobsData) => {
    try {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobsData));
    } catch (error) {
      console.error('Error saving jobs to localStorage:', error);
      throw new Error('Failed to save job data');
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!formData.title.trim()) {
      errors.push('Job title is required');
    }

    if (!formData.slug.trim()) {
      errors.push('Job slug is required');
    }

    if (!formData.description_md.trim()) {
      errors.push('Job description is required');
    }

    if (!formData.requirements_md.trim()) {
      errors.push('Job requirements are required');
    }

    if (!formData.compensation_range.trim()) {
      errors.push('Compensation range is required');
    }

    return errors;
  };

  // Handle form submission
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

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const currentJobs = getJobsFromStorage();

      if (isEdit) {
        // Update existing job
        const jobId = searchParams.get('id');
        const updatedJobs = currentJobs.map((job) => {
          if (job.id === jobId) {
            return {
              ...job,
              ...formData,
              updated_at: new Date().toISOString(),
            };
          }
          return job;
        });

        saveJobsToStorage(updatedJobs);
        toast.success('Job updated successfully!');
      } else {
        // Create new job
        const newJob = {
          id: uuidv4(),
          ...formData,
          hiring_manager_id: null,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          applicant_count: 0,
        };

        const updatedJobs = [...currentJobs, newJob];
        saveJobsToStorage(updatedJobs);
        toast.success('Job created successfully!');
      }

      // Clear localStorage and navigate back
      localStorage.removeItem('job_edit_data');
      router.push('/dashboard/jobs/recruiters/job');
    } catch (error) {
      console.error('Error saving job:', error);
      setError(error.message || 'Failed to save job');
      toast.error('Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    localStorage.removeItem('job_edit_data');
    router.push('/dashboard/jobs/recruiters/job');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/jobs">
            Jobs
          </Link>
          <Link color="inherit" href="/dashboard/jobs/recruiters/job">
            List
          </Link>
          <Typography color="text.primary">{isEdit ? 'Edit Job' : 'Create Job'}</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Edit Job' : 'Create New Job'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isEdit
            ? 'Update the job details and requirements'
            : 'Fill in the details to create a new job posting'}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          {/* Basic Information */}
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

          {/* Job Description */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Description
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <TextField
              label="Description"
              placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
              value={formData.description_md}
              onChange={handleInputChange('description_md')}
              fullWidth
              multiline
              rows={6}
              required
              helperText="You can use Markdown formatting"
            />
          </Card>

          {/* Requirements */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Requirements
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <TextField
              label="Requirements"
              placeholder="List the required skills, experience, and qualifications..."
              value={formData.requirements_md}
              onChange={handleInputChange('requirements_md')}
              fullWidth
              multiline
              rows={6}
              required
              helperText="You can use Markdown formatting (e.g., - Python\n- FastAPI\n- 3+ years experience)"
            />
          </Card>

          {/* Publishing Options */}
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
              sx={{ mt: 1 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {formData.is_published
                ? 'Job will be visible to candidates immediately'
                : 'Job will be saved as draft and can be published later'}
            </Typography>
          </Card>

          {/* Action Buttons */}
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
