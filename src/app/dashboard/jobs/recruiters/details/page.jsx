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
  Divider,
  Tab,
  Tabs,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
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
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card sx={{ p: 4 }}>
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
              label={jobData.employment
                ?.replace('_', ' ')
                ?.replace(/\b\w/g, (c) => c.toUpperCase())}
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
      </Grid>
    </Grid>
  );

  const renderCandidates = () => (
    <Stack spacing={2}>
      {applications.length === 0 && (
        <Card sx={{ p: 3 }}>
          <Typography>No applicants yet</Typography>
        </Card>
      )}
      {applications.map((app) => {
        const candidate = app.candidates;
        return (
          <Card key={app.id} sx={{ p: 3, position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">{candidate.full_name}</Typography>
              <Chip label={app.status} size="small" />
            </Box>

            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                {candidate.email}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                {candidate.phone}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                Exp: <strong>{candidate.years_experience} yrs</strong>
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}
              >
                Applied for: <span style={{ fontWeight: 500 }}>{app.job_openings?.title}</span>
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} mt={2}>
              {candidate.linkedin_url && (
                <Button
                  size="small"
                  variant="outlined"
                  href={candidate.linkedin_url}
                  target="_blank"
                >
                  LinkedIn
                </Button>
              )}
              {candidate.portfolio_url && (
                <Button
                  size="small"
                  variant="outlined"
                  href={candidate.portfolio_url}
                  target="_blank"
                >
                  Portfolio
                </Button>
              )}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
          sx={{ borderBottom: 1, borderColor: 'divider' }}
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
