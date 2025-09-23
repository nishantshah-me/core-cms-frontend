'use client';

import { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Chip,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { CustomPopover } from 'src/components/custom-popover';
import { fDate } from 'src/utils/format-time';
import toast from 'react-hot-toast';
import { LogoLoader } from 'src/components/loading-screen/LogoLoader';
import * as jobService from 'src/auth/services/recruiterJobService';
import { signOut } from 'src/auth/services/authService';

const JobListView = () => {
  const router = useRouter();
  const [allJobs, setAllJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('all');

  // counts
  const [totalCount, setTotalCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    loadJobsData();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [currentTab, allJobs]);

  const loadJobsData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await jobService.getJobs(); // single call without status filter
      const jobsData = res.jobs || [];

      // save all jobs in state
      setAllJobs(jobsData);

      // counts
      setTotalCount(jobsData.length);
      setPublishedCount(jobsData.filter((j) => j.is_published).length);
      setDraftCount(jobsData.filter((j) => !j.is_published).length);
    } catch (err) {
      if (err?.code === 'UNAUTHORIZED') {
        toast.error('Session expired. Please sign in again.');
        signOut();
        router.push('/auth/signin');
        return;
      }
      console.error('Error loading jobs:', err);
      setError(err.message || 'Failed to load jobs data');
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    if (currentTab === 'all') {
      setJobs(allJobs);
    } else if (currentTab === 'published') {
      setJobs(allJobs.filter((j) => j.is_published));
    } else if (currentTab === 'draft') {
      setJobs(allJobs.filter((j) => !j.is_published));
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
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
    router.push(`/dashboard/jobs/recruiters/details?id=${job.id}`);
  };

  const handleAdd = () => {
    router.push('/dashboard/jobs/recruiters/new');
  };

  const handleEdit = () => {
    if (selectedJob) {
      router.push(`/dashboard/jobs/recruiters/edit?id=${selectedJob.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteSingle = async () => {
    setDeleteDialog(false);
    setSelectedJob(null);
    toast('Delete API not implemented yet', { icon: '⚠️' });
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <LogoLoader />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/jobs/recruiters">
            Recruiter
          </Link>
          <Typography color="text.primary">List</Typography>
        </Breadcrumbs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Job Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          New Job
        </Button>
      </Box>

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
              {jobs.length === 0 ? (
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
                            ? 'No published jobs available.'
                            : 'No draft jobs available.'}
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
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
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
                        label={job.employment
                          ?.replace('_', ' ')
                          ?.replace(/\b\w/g, (c) => c.toUpperCase())}
                        size="small"
                        variant="soft"
                        color="primary"
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
          <MenuItem
            onClick={() => {
              handleRowClick(selectedJob);
              handleMenuClose();
            }}
          >
            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
            View
          </MenuItem>

          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>

          <MenuItem sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>{selectedJob?.title}</strong>? Delete API not
            implemented currently.
          </Typography>
          <Typography variant="" color="text.secondary">
            Delete API not implemented currently.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClose={() => setDeleteDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button color="error" variant="contained">
            Delete
          </Button>
          {/* <Button onClick={handleDeleteSingle} color="error" variant="contained">
            Delete
          </Button> */}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default function JobsListPage() {
  return <JobListView />;
}
