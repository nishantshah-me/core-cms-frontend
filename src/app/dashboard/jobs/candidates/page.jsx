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
  Chip,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { CustomPopover } from 'src/components/custom-popover';
import { fDate } from 'src/utils/format-time';
import toast from 'react-hot-toast';
import { LogoLoader } from 'src/components/loading-screen/LogoLoader';
import * as jobService from 'src/auth/services/recruiterJobService';
import { signOut } from 'src/auth/services/authService';

const CandidatesListView = () => {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplicationsData();
  }, []);

  const loadApplicationsData = async () => {
    try {
      setLoading(true);
      setError('');
      const applicationsData = await jobService.getJobApplications();

      // Sort by submitted_at descending (latest first)
      const sortedApplications = (applicationsData || []).sort(
        (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)
      );

      setApplications(sortedApplications);
    } catch (err) {
      if (err?.code === 'UNAUTHORIZED') {
        toast.error('Session expired. Please sign in again.');
        signOut();
        router.push('/auth/signin');
        return;
      }
      console.error('Error loading applications:', err);
      setError(err.message || 'Failed to load applications data');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedApplication(null);
  };

  const handleRowClick = (application) => {
    setSelectedApplication(application);
    setDetailsDialog(true);
  };

  const handleViewDetails = () => {
    setDetailsDialog(true);
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    const statusColors = {
      applied: 'info',
      screening: 'warning',
      interview: 'primary',
      offered: 'success',
      rejected: 'error',
      withdrawn: 'default',
    };
    return statusColors[status] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <LogoLoader />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/jobs/candidates">
            Candidates
          </Link>
          <Typography color="text.primary">Applications</Typography>
        </Breadcrumbs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Job Applications</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Total {applications.length} applications
          </Typography>
        </Box>
      </Box>

      <Card>
        <TableContainer sx={{ p: 2, overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow>
                <TableCell>Candidate</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Social Links</TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>Job Applied</TableCell>
                <TableCell>Employment Type</TableCell>
                <TableCell>Compensation</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Applied Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <Card sx={{ textAlign: 'center', py: 7, boxShadow: 'none' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No applications found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No candidates have applied to your job openings yet.
                      </Typography>
                    </Card>
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow
                    key={app.id}
                    hover
                    // onClick={() => handleRowClick(app)}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {app.candidates?.full_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {app.candidate_id?.slice(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon
                            fontSize="small"
                            sx={{ fontSize: 18, color: 'text.secondary' }}
                          />
                          <Typography variant="body2">{app.candidates?.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon
                            fontSize="small"
                            sx={{ fontSize: 18, color: 'text.secondary' }}
                          />
                          <Typography variant="body2">{app.candidates?.phone}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5}>
                        {app.candidates?.linkedin_url && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LinkedInIcon
                              fontSize="small"
                              sx={{ fontSize: 18, color: 'text.secondary' }}
                            />
                            <Link
                              href={app.candidates.linkedin_url}
                              target="_blank"
                              rel="noopener"
                              underline="hover"
                            >
                              <Typography variant="body2">LinkedIn</Typography>
                            </Link>
                          </Box>
                        )}
                        {app.candidates?.portfolio_url && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LanguageIcon
                              fontSize="small"
                              sx={{ fontSize: 18, color: 'text.secondary' }}
                            />
                            <Link
                              href={app.candidates.portfolio_url}
                              target="_blank"
                              rel="noopener"
                              underline="hover"
                            >
                              <Typography variant="body2">Portfolio</Typography>
                            </Link>
                          </Box>
                        )}
                        {!app.candidates?.linkedin_url && !app.candidates?.portfolio_url && (
                          <Typography variant="caption" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={`${app.candidates?.years_experience || 0} years`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {app.job_openings?.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {app.job_openings?.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={app.job_openings?.employment
                          ?.replace('_', ' ')
                          ?.replace(/\b\w/g, (c) => c.toUpperCase())}
                        size="small"
                        variant="soft"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {app.job_openings?.compensation_range}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={app.status?.replace('_', ' ')?.toUpperCase()}
                        size="small"
                        color={getStatusColor(app.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={app.source?.replace('_', ' ') || 'N/A'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{fDate(app.submitted_at)}</Typography>
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
            View Details
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/* Application Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>Application Details</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedApplication && (
            <Stack spacing={3}>
              {/* Candidate Information */}
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5 }}>
                  Candidate Information
                </Typography>
                <Box>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {selectedApplication.candidates?.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedApplication.candidates?.years_experience} years of experience
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {selectedApplication.candidates?.email}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {selectedApplication.candidates?.phone}
                      </Typography>
                    </Box>
                    {selectedApplication.candidates?.linkedin_url && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinkedInIcon fontSize="small" color="action" />
                        <Link
                          href={selectedApplication.candidates.linkedin_url}
                          target="_blank"
                          rel="noopener"
                        >
                          <Typography variant="body2">LinkedIn Profile</Typography>
                        </Link>
                      </Box>
                    )}
                    {selectedApplication.candidates?.portfolio_url && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LanguageIcon fontSize="small" color="action" />
                        <Link
                          href={selectedApplication.candidates.portfolio_url}
                          target="_blank"
                          rel="noopener"
                        >
                          <Typography variant="body2">Portfolio</Typography>
                        </Link>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Box>

              {/* Job Information */}
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5 }}>
                  Job Applied For
                </Typography>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {selectedApplication.job_openings?.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 1.5 }}
                  >
                    {selectedApplication.job_openings?.slug}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={selectedApplication.job_openings?.employment
                        ?.replace('_', ' ')
                        ?.toUpperCase()}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={selectedApplication.job_openings?.compensation_range}
                      size="small"
                      variant="outlined"
                      color="success"
                    />
                  </Box>
                </Card>
              </Box>

              {/* Application Status */}
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5 }}>
                  Application Status
                </Typography>
                <Stack spacing={1.5}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Status:
                    </Typography>
                    <Chip
                      label={selectedApplication.status?.replace('_', ' ')?.toUpperCase()}
                      color={getStatusColor(selectedApplication.status)}
                      size="small"
                    />
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Source:
                    </Typography>
                    <Chip
                      label={selectedApplication.source?.replace('_', ' ') || 'N/A'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Submitted:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {fDate(selectedApplication.submitted_at)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Last Updated:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {fDate(selectedApplication.updated_at)}
                    </Typography>
                  </Box>
                  {selectedApplication.stage_notes && (
                    <Box sx={{ pt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Notes:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}
                      >
                        {selectedApplication.stage_notes}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDetailsDialog(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default function CandidatesListPage() {
  return <CandidatesListView />;
}
