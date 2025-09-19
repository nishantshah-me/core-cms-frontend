'use client';

import { useState, useEffect, useCallback } from 'react';
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
  TableContainer,
  MenuList,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Visibility as VisibilityIcon,
  Work as WorkIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { CustomPopover } from 'src/components/custom-popover';
import { fDate } from 'src/utils/format-time';
import toast from 'react-hot-toast';
import { LogoLoader } from 'src/components/loading-screen/LogoLoader';

// Local storage key for jobs
const JOBS_STORAGE_KEY = 'recruiter_jobs';

const JobListView = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTab, setCurrentTab] = useState('all'); // Changed default to 'all'

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Helper function to get jobs from localStorage
  const getJobsFromStorage = () => {
    try {
      const storedJobs = localStorage.getItem(JOBS_STORAGE_KEY);
      return storedJobs ? JSON.parse(storedJobs) : [];
    } catch (error) {
      console.error('Error reading jobs from localStorage:', error);
      return [];
    }
  };

  // Helper function to save jobs to localStorage
  const saveJobsToStorage = (jobsData) => {
    try {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobsData));
    } catch (error) {
      console.error('Error saving jobs to localStorage:', error);
    }
  };

  // Load jobs data
  useEffect(() => {
    loadJobsData();
  }, [currentTab, page, rowsPerPage]);

  const loadJobsData = async () => {
    try {
      setLoading(true);
      setError('');

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      const allJobs = getJobsFromStorage();

      // Filter jobs based on current tab
      let filteredJobs = allJobs;
      if (currentTab === 'published') {
        filteredJobs = allJobs.filter((job) => job.is_published);
      } else if (currentTab === 'draft') {
        filteredJobs = allJobs.filter((job) => !job.is_published);
      }
      // For 'all' tab, show all jobs without filtering

      setJobs(filteredJobs);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err.message || 'Failed to load jobs data');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setPage(0); // Reset to first page when switching tabs
  };

  const handleMenuOpen = (event, job) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJob(null);
  };

  const handleRowClick = (job) => {
    // Save job data to localStorage for details page
    try {
      localStorage.setItem('job_details_data', JSON.stringify(job));
      router.push(`/dashboard/jobs/recruiters/job/details?id=${job.id}`);
    } catch (error) {
      console.error('Error saving job details:', error);
      toast.error('Failed to load job details');
    }
  };

  const handleAdd = () => {
    // Clear any existing job data
    localStorage.removeItem('job_edit_data');
    localStorage.removeItem('job_details_data');
    router.push('/dashboard/jobs/recruiters/job/new');
  };

  const handleEdit = () => {
    if (selectedJob) {
      try {
        // Save job data for editing
        localStorage.setItem('job_edit_data', JSON.stringify(selectedJob));
        router.push(`/dashboard/jobs/recruiters/job/edit?id=${selectedJob.id}`);
      } catch (error) {
        console.error('Error saving job edit data:', error);
        toast.error('Failed to load job for editing');
      }
    }
    handleMenuClose();
  };

  const handleViewDetails = () => {
    if (selectedJob) {
      handleRowClick(selectedJob);
    }
    handleMenuClose();
  };

  const handleDeleteSingle = async () => {
    if (!selectedJob) return;

    try {
      setIsDeleting(true);
      setError('');

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get all jobs from localStorage
      const allJobs = getJobsFromStorage();

      // Remove the selected job
      const updatedJobs = allJobs.filter((job) => job.id !== selectedJob.id);

      // Save back to localStorage
      saveJobsToStorage(updatedJobs);

      // Refresh the data
      await loadJobsData();

      setDeleteDialog(false);
      setSelectedJob(null);

      toast.success('Job deleted successfully');
    } catch (err) {
      console.error('Error deleting job:', err);
      setError(err.message || 'Failed to delete job');
      toast.error('Failed to delete job');
    } finally {
      setIsDeleting(false);
    }
    handleMenuClose();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getEmploymentTypeLabel = (employment) => {
    const types = {
      full_time: 'Full Time',
      part_time: 'Part Time',
      contract: 'Contract',
      internship: 'Internship',
    };
    return types[employment] || employment;
  };

  const getEmploymentTypeColor = (employment) => {
    const colors = {
      full_time: 'success',
      part_time: 'warning',
      contract: 'info',
      internship: 'primary',
    };
    return colors[employment] || 'default';
  };

  // Get counts for tabs and summary cards
  const allStorageJobs = getJobsFromStorage();
  const totalCount = allStorageJobs.length;
  const publishedCount = allStorageJobs.filter((job) => job.is_published).length;
  const draftCount = allStorageJobs.filter((job) => !job.is_published).length;
  const totalApplicants = allStorageJobs.reduce((sum, job) => sum + (job.applicant_count || 0), 0);

  if (loading && page === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
          width: '100%',
        }}
      >
        <LogoLoader />
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
          <Link color="inherit" href="/dashboard/jobs">
            Jobs
          </Link>
          <Typography color="text.primary">List</Typography>
        </Breadcrumbs>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Header with Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Job Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          New Job
        </Button>
      </Box>

      {/* Summary Cards */}
      {/* <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 3,
        }}
      >
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WorkIcon sx={{ color: 'grey.600', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {totalCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Jobs
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'success.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VisibilityIcon sx={{ color: 'success.main', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {publishedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Published
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'warning.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <EditIcon sx={{ color: 'warning.main', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {draftCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drafts
              </Typography>
            </Box>
          </Box>
        </Card>

        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'info.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PeopleIcon sx={{ color: 'info.main', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {totalApplicants}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Applicants
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box> */}

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All (${totalCount})`} value="all" />
          <Tab label={`Published (${publishedCount})`} value="published" />
          <Tab label={`Draft (${draftCount})`} value="draft" />
        </Tabs>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Job Title</TableCell>
                <TableCell>Employment Type</TableCell>
                <TableCell>Compensation</TableCell>
                <TableCell>Applicants</TableCell>
                <TableCell>Posted Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell width={88}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && page > 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Card sx={{ textAlign: 'center', py: 7, boxShadow: 'none' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No jobs added yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {currentTab === 'all'
                          ? 'No jobs available. Create your first job posting to get started.'
                          : currentTab === 'published'
                            ? 'No published jobs available. Create your first job posting to attract candidates.'
                            : 'No draft jobs available. Create a draft to save your work in progress.'}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        size="large"
                      >
                        Create Job
                      </Button>
                    </Card>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow
                    key={job.id}
                    hover
                    onClick={() => handleRowClick(job)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {job.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {job.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getEmploymentTypeLabel(job.employment)}
                        color={getEmploymentTypeColor(job.employment)}
                        size="small"
                        variant="soft"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{job.compensation_range}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary.main" fontWeight="medium">
                        {job.applicant_count || 0} applicants
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{fDate(job.created_at)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.is_published ? 'Published' : 'Draft'}
                        color={job.is_published ? 'success' : 'default'}
                        size="small"
                        variant="soft"
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <IconButton onClick={(e) => handleMenuOpen(e, job)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
            placement: 'right-center',
            offset: 14,
            size: 15,
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
          <MenuItem onClick={handleViewDetails}>
            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
            View
          </MenuItem>

          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>

          <MenuItem
            onClick={() => setDeleteDialog(true)}
            sx={{ color: 'error.main' }}
            disabled={isDeleting}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>{selectedJob?.title}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. The job posting and all associated data will be
            permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} variant="outlined" disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSingle}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default function JobsListPage() {
  return <JobListView />;
}
