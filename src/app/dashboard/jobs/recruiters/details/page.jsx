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
  Chip,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { fDate } from 'src/utils/format-time';
import * as jobService from 'src/auth/services/recruiterJobService';
import { signOut } from 'src/auth/services/authService';
import toast from 'react-hot-toast';

const JobDetailsView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobData, setJobData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [currentTab, setCurrentTab] = useState('content');

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const job = await jobService.getJobById(jobId);
      const apps = await jobService.getJobApplications({ job_id: jobId });
      setJobData(job);
      setApplications(apps || []);
    } catch (err) {
      if (err?.code === 'UNAUTHORIZED') {
        toast.error('Session expired. Please sign in again.');
        signOut();
        router.push('/auth/signin');
        return;
      }
      console.error('Error loading job details:', err);
      setError(err.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/jobs/recruiters');
  };

  const handleEdit = () => {
    if (jobData) {
      router.push(`/dashboard/jobs/recruiters/edit?id=${jobData.id}`);
    }
  };

  const handleTabChange = (event, newValue) => setCurrentTab(newValue);

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
        <CircularProgress />
      </Box>
    );
  }

  if (error || !jobData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Job not found'}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to Jobs
        </Button>
      </Container>
    );
  }

  const renderJobContent = () => (
    <Card sx={{ p: 4, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        {jobData.title}
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Job Description
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
          {jobData.description_md}
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Requirements
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
          {jobData.requirements_md}
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Date posted
        </Typography>
        <Typography variant="subtitle2">{fDate(jobData.created_at)}</Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Employment type
        </Typography>
        <Chip
          label={jobData.employment?.replace('_', ' ')?.replace(/\b\w/g, (c) => c.toUpperCase())}
          variant="soft"
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Offered salary
        </Typography>
        <Typography variant="subtitle2">{jobData.compensation_range}</Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Status
        </Typography>
        <Chip
          label={jobData.is_published ? 'Published' : 'Draft'}
          variant="soft"
          color={jobData.is_published ? 'success' : 'default'}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Last updated
        </Typography>
        <Typography variant="subtitle2">{fDate(jobData.updated_at)}</Typography>
      </Box>
    </Card>
  );

  const renderCandidates = () => (
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
                      No applicants yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No candidates have applied to this job opening yet.
                    </Typography>
                  </Card>
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow
                  key={app.id}
                  hover
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
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Breadcrumbs>
            <Link color="inherit" href="/dashboard">
              Dashboard
            </Link>
            <Link color="inherit" href="/dashboard/jobs/recruiters">
              List
            </Link>
            <Typography color="text.primary">Job Details</Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit}>
              Edit
            </Button>
          </Box>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}
        >
          <Tab label="Job content" value="content" />
          <Tab label={`Candidates (${applications.length})`} value="candidates" />
        </Tabs>
      </Card>

      {currentTab === 'content' && renderJobContent()}
      {currentTab === 'candidates' && renderCandidates()}
    </Container>
  );
};

export default function JobDetailsPage() {
  return <JobDetailsView />;
}
