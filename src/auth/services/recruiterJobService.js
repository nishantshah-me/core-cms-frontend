import { apiClient } from 'src/api/apiClient';
import { endpoints } from 'src/api/endpoints';

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REST_BASE = `${SUPABASE_URL}/rest/v1`;

// handle Error
export function handleApiError(err) {
  let errorInfo = {
    message: 'Unexpected error occurred',
    raw: err,
  };

  if (err.response) {
    const data = err.response.data;

    errorInfo.status = err.response.status || null;
    errorInfo.message = data?.message || err.message;
  } else if (err.request) {
    // Request was made but no response
    errorInfo.message = 'No response from server. Please check your network.';
  } else {
    // Something happened before request was made
    errorInfo.message = err.message || String(err);
  }

  // Log full context for debugging
  console.error('API Error:', {
    message: errorInfo.message,
  });

  throw errorInfo;
}

// Build headers
function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('access_token');
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

// Create Job
export async function createJob(jobData) {
  try {
    const response = await apiClient({
      method: 'POST',
      url: `${REST_BASE}${endpoints.jobs.create}`,
      data: jobData,
      headers: getAuthHeaders(),
    });
    return Array.isArray(response) ? response[0] : response;
  } catch (err) {
    handleApiError(err);
  }
}

// Update Job
export async function updateJob(jobId, jobData) {
  try {
    const response = await apiClient({
      method: 'PATCH',
      url: `${REST_BASE}${endpoints.jobs.update(jobId)}`,
      data: jobData,
      headers: getAuthHeaders(),
    });
    return Array.isArray(response) ? response[0] : response;
  } catch (err) {
    handleApiError(err);
  }
}

// Get Jobs
export async function getJobs({ status = 'all', order = 'created_at.desc' } = {}) {
  try {
    const jobs = await apiClient({
      method: 'GET',
      url: `${REST_BASE}${endpoints.jobs.list}?order=${order}`,
      headers: getAuthHeaders(),
    });

    const applications = await apiClient({
      method: 'GET',
      url: `${REST_BASE}${endpoints.jobs.applications}`,
      headers: getAuthHeaders(),
    });

    // count applicants per job
    const applicantCountMap = {};
    (applications || []).forEach((app) => {
      const jid = app.job_id;
      applicantCountMap[jid] = (applicantCountMap[jid] || 0) + 1;
    });

    const jobsWithCounts = (jobs || []).map((j) => ({
      ...j,
      applicant_count: applicantCountMap[j.id] || 0,
    }));

    const totalCount = jobsWithCounts.length;
    const publishedCount = jobsWithCounts.filter((j) => j.is_published).length;
    const draftCount = jobsWithCounts.filter((j) => !j.is_published).length;
    const totalApplicants = Object.values(applicantCountMap).reduce((s, n) => s + n, 0);

    let filtered = jobsWithCounts;
    if (status === 'published') filtered = jobsWithCounts.filter((j) => j.is_published);
    else if (status === 'draft') filtered = jobsWithCounts.filter((j) => !j.is_published);

    // Always return structured object
    return {
      jobs: filtered,
      totalCount,
      publishedCount,
      draftCount,
      totalApplicants,
    };
  } catch (err) {
    handleApiError(err);
    // Prevent undefined return
    return { jobs: [], totalCount: 0, publishedCount: 0, draftCount: 0, totalApplicants: 0 };
  }
}

// Get Job Details
export async function getJobById(jobId) {
  try {
    const response = await apiClient({
      method: 'GET',
      url: `${REST_BASE}${endpoints.jobs.details(jobId)}`,
      headers: getAuthHeaders(),
    });
    return Array.isArray(response) ? response[0] : response;
  } catch (err) {
    handleApiError(err);
  }
}

// Get Applications
export async function getJobApplications({ job_id = null } = {}) {
  try {
    const url = job_id
      ? `${REST_BASE}${endpoints.jobs.applicationsByJob(job_id)}`
      : `${REST_BASE}${endpoints.jobs.applications}`;
    const response = await apiClient({
      method: 'GET',
      url,
      headers: getAuthHeaders(),
    });
    return Array.isArray(response) ? response : [];
  } catch (err) {
    handleApiError(err);
  }
}
