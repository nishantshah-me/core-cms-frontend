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
  Avatar,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { fDate } from 'src/utils/format-time';

// Mock candidates data
const MOCK_CANDIDATES = [
  {
    id: 1,
    status: 'applied',
    candidate: {
      full_name: 'Akshay',
      email: 'akshay@gmail.com',
      phone: '9898989898',
      years_experience: 5,
      linkedin_url: 'https://linkedin.com/in/akshay',
      portfolio_url: 'https://akshayportfolio.com',
    },
    job: {
      title: 'Senior React Developer',
    },
  },
  {
    id: 2,
    status: 'shortlisted',
    candidate: {
      full_name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876543210',
      years_experience: 3,
      linkedin_url: 'https://linkedin.com/in/priyasharma',
      portfolio_url: '',
    },
    job: {
      title: 'UI/UX Designer',
    },
  },
  {
    id: 3,
    status: 'interviewed',
    candidate: {
      full_name: 'Ravi Kumar',
      email: 'ravi@example.com',
      phone: '9988776655',
      years_experience: 7,
      linkedin_url: '',
      portfolio_url: 'https://ravidesign.com',
    },
    job: {
      title: 'Backend Engineer',
    },
  },
];

const JobDetailsView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobData, setJobData] = useState(null);
  const [currentTab, setCurrentTab] = useState('content');

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Try to get job data from localStorage first
      const storedJobData = localStorage.getItem('job_details_data');
      if (storedJobData) {
        const job = JSON.parse(storedJobData);
        setJobData({
          ...job,
          candidates: MOCK_CANDIDATES,
        });
      } else {
        // Fallback: try to find job in stored jobs
        const allJobs = JSON.parse(localStorage.getItem('recruiter_jobs') || '[]');
        const job = allJobs.find((j) => j.id === jobId);

        if (job) {
          setJobData({
            ...job,
            candidates: MOCK_CANDIDATES,
          });
        } else {
          setError('Job not found');
        }
      }
    } catch (err) {
      console.error('Error loading job details:', err);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    localStorage.removeItem('job_details_data');
    router.push('/dashboard/jobs/recruiters');
  };

  const handleEdit = () => {
    if (jobData) {
      localStorage.setItem('job_edit_data', JSON.stringify(jobData));
      router.push(`/dashboard/jobs/recruiters/edit?id=${jobData.id}`);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
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

  if (loading) {
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
      {/* Main Content */}
      <Grid item xs={12} md={8}>
        <Card sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            {jobData.title}
          </Typography>

          {/* Job Description */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Job Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {jobData.description_md}
            </Typography>
          </Box>

          {/* Requirements */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Requirements
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {jobData.requirements_md}
            </Typography>
          </Box>

          {/* Date Posted */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Date posted
            </Typography>
            <Typography variant="subtitle2">{fDate(jobData.created_at)}</Typography>
          </Box>

          {/* Employment Type */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Employment type
            </Typography>
            <Chip
              label={getEmploymentTypeLabel(jobData.employment)}
              color={getEmploymentTypeColor(jobData.employment)}
              variant="soft"
            />
          </Box>

          {/* Compensation */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Offered salary
            </Typography>
            <Typography variant="subtitle2">{jobData.compensation_range}</Typography>
          </Box>

          {/* Status */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Status
            </Typography>
            <Chip
              label={jobData.is_published ? 'Published' : 'Draft'}
              color={jobData.is_published ? 'success' : 'default'}
              variant="soft"
            />
          </Box>

          {/* Last Updated */}
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
      {MOCK_CANDIDATES.map((application) => {
        const candidate = application.candidate;
        return (
          <Card key={application.id} sx={{ p: 3, position: 'relative' }}>
            {/* Candidate Name + Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">{candidate.full_name}</Typography>
              <Chip label={application.status} size="small" color="info" />
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
                sx={{ color: 'text.disabled', fontSize: 12, display: 'block', mt: 0.5 }}
              >
                Applied for: <span style={{ fontWeight: 500 }}>{application.job.title}</span>
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
      {/* Header */}
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

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Job content" value="content" />
          <Tab label={`Candidates (${jobData.candidates?.length || 0})`} value="candidates" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {currentTab === 'content' && renderJobContent()}
      {currentTab === 'candidates' && renderCandidates()}
    </Container>
  );
};

export default function JobDetailsPage() {
  return <JobDetailsView />;
}
