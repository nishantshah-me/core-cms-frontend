'use client';

import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Box,
  Card,
  Typography,
  Container,
  Grid,
  CardContent,
  Breadcrumbs,
  Link,
  CircularProgress,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuList,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Factory as FactoryIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  AccountBalance as BillingIcon,
  TrendingUp as RevenueIcon,
  Groups as TeamIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

import { CustomPopover } from 'src/components/custom-popover';

import { getOwnerById } from 'src/auth/services/ownerCompanyService';

const OwnerDetailPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ownerId = searchParams?.get('owner_id');
  const companyIdParam = searchParams?.get('company_id');

  const [ownerData, setOwnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the company actions menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    async function load() {
      if (!ownerId) {
        setError('No owner specified');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const fetched = await getOwnerById(ownerId);

        // Ensure companies are available as a list in ownerData
        const companies = fetched.ownerData?.companies || [];

        // If a company_id was provided, find the matching company.
        let selectedCompanyData = null;
        if (companyIdParam && companies.length > 0) {
          selectedCompanyData =
            companies.find(
              (c) =>
                String(c.company_id ?? c.id) === String(companyIdParam) ||
                String(c.id ?? c.company_id) === String(companyIdParam)
            ) || null;
        }

        setOwnerData({
          ...fetched,
          companies: companies, // Store the full list of companies
          companyData: selectedCompanyData, // Keep the selected company for other uses if needed
        });
      } catch (err) {
        console.error('Error fetching owner by id:', err);
        setError(err?.message || 'Failed to load owner details');
        toast.error('Failed to load owner details');
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, companyIdParam]);

  // Updated: Handle edit action for a specific company
  const handleEdit = (company) => {
    if (!ownerData || !company) return;

    // Close the popover
    handleMenuClose();

    // Navigate to company management page for editing
    router.push(
      `/dashboard/company-management?owner_id=${ownerData.id}&company_id=${company.company_id || company.id}`
    );
  };

  // Updated: Function to add a new company
  const handleAddCompany = () => {
    if (!ownerData) return;

    // Navigate to company management page for creating new company
    router.push(`/dashboard/company-management?owner_id=${ownerData.id}`);
  };

  // Updated: Handle Edit Owner button
  const handleEditOwner = () => {
    if (!ownerData) return;

    try {
      // Navigate to owner management page in edit mode
      router.push(`/dashboard/owner-management?owner_id=${ownerData.id}`);
    } catch (error_) {
      console.error('Error preparing edit data:', error_);
      toast.error('Failed to prepare edit data');
    }
  };

  const handleMenuOpen = (event, company) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCompany(company);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCompany(null);
  };

  const handleBackToOwners = () => {
    router.push('/dashboard/owners');
  };

  const StatCard = ({ icon: Icon, label, value, color = '#0369a1', sx = {} }) => (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid #f1f5f9',
        backgroundColor: '#fefefe',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)',
        },
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            backgroundColor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${color}25`,
          }}
        >
          <Icon sx={{ fontSize: 24, color }} />
        </Box>
        <Box>
          <Typography
            variant="body2"
            sx={{
              color: '#64748b',
              fontSize: '0.875rem',
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              color: '#1e293b',
              fontWeight: 600,
              fontSize: '1.1rem',
            }}
          >
            {value}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

  const EmptyState = () => (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link
            component="button"
            color="inherit"
            onClick={handleBackToOwners}
            sx={{ cursor: 'pointer' }}
          >
            Owners
          </Link>
          <Typography color="text.primary">Owner Detail</Typography>
        </Breadcrumbs>
      </Box>

      <Card
        sx={{
          textAlign: 'center',
          py: 8,
          px: 4,
          borderRadius: 4,
          border: '2px dashed #e0e0e0',
          backgroundColor: '#fafafa',
        }}
      >
        <WarningIcon sx={{ fontSize: 64, color: '#ffc107', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#424242' }}>
          No Owner Data Available
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
        >
          No owner specified or unable to load details. Please go back to the owners list and select
          an owner to view their details.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToOwners}
          sx={{ minWidth: 200 }}
        >
          Go Back to Owners
        </Button>
      </Card>
    </Container>
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
          width: '100%',
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading owner details...
        </Typography>
      </Box>
    );
  }

  if (error || !ownerData) {
    return <EmptyState />;
  }

  const hasCompanies = !!(ownerData.companies && ownerData.companies.length > 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link
            component="button"
            color="inherit"
            onClick={handleBackToOwners}
            sx={{ cursor: 'pointer' }}
          >
            Owners
          </Link>
          <Typography color="text.primary">Owner Detail</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            Owner Profile
          </Typography>
          <Typography variant="h6" color="#666" sx={{ fontWeight: 400 }}>
            Owner details and company information
          </Typography>
        </Box>
      </Box>

      {/* Personal Information */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Box
          sx={{
            p: 3,
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
              Personal Information
            </Typography>
            <Button
              variant="outlined"
              onClick={handleEditOwner}
              startIcon={<EditIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Edit Owner
            </Button>
          </Box>
          <Typography variant="body2" color="#64748b">
            Personal details and contact information
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={2} sx={{ display: 'flex' }}>
            <Grid item xs={12} md={4} sx={{ flexGrow: 1 }}>
              <StatCard
                icon={PersonIcon}
                label="Full Name"
                value={ownerData.name}
                sx={{ height: '100%', border: '1px solid #e2e8f0' }}
              />
            </Grid>

            <Grid item xs={12} md={4} sx={{ flexGrow: 1 }}>
              <StatCard
                icon={EmailIcon}
                label="Email Address"
                value={ownerData.email}
                sx={{ height: '100%', border: '1px solid #e2e8f0' }}
              />
            </Grid>

            <Grid item xs={12} md={4} sx={{ flexGrow: 1 }}>
              <StatCard
                icon={PhoneIcon}
                label="Phone Number"
                value={ownerData.phone}
                sx={{ height: '100%', border: '1px solid #e2e8f0' }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ p: 3, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
              Company Information
            </Typography>
            <Button
              variant="outlined"
              onClick={handleAddCompany}
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Add Company
            </Button>
          </Box>
          <Typography variant="body2" color="#64748b">
            Business details and company information
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {hasCompanies ? (
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table aria-label="companies table">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#4a5568' }}>Company Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#4a5568' }}>Industry Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#4a5568' }}>Employee Count</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#4a5568' }}>Email</TableCell>
                    <TableCell width={88} sx={{ fontWeight: 700, color: '#4a5568' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ownerData.companies.map((company, index) => (
                    <TableRow
                      key={index}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>{company.name}</TableCell>
                      <TableCell>{company.industry_type || 'N/A'}</TableCell>
                      <TableCell>{company.employees_count}</TableCell>
                      <TableCell>
                        <Link href={`mailto:${company.email}`} underline="none" color="primary">
                          {company.email}
                        </Link>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <IconButton onClick={(e) => handleMenuOpen(e, company)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6, px: 4 }}>
              <BusinessIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" color="#64748b" gutterBottom sx={{ fontWeight: 600 }}>
                No Company Information
              </Typography>
              <Typography variant="body2" color="#94a3b8" sx={{ mb: 3 }}>
                This owner has not completed company onboarding yet.
              </Typography>
              <Button
                variant="outlined"
                onClick={handleAddCompany}
                startIcon={<AddIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Add Company Info
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ p: 3, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
              Billing Information
            </Typography>
            <Button
              variant="outlined"
              onClick={handleAddCompany}
              startIcon={<EditIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Edit Billing
            </Button>
          </Box>
          <Typography variant="body2" color="#64748b">
            Billing details and subscription information
          </Typography>
        </Box>
        <CardContent sx={{ p: 4 }}>
          {!hasCompanies ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <BillingIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" color="#64748b" gutterBottom sx={{ fontWeight: 600 }}>
                No Billing Information
              </Typography>
              <Typography variant="body2" color="#94a3b8" sx={{ mb: 3 }}>
                Billing information will be available after company setup.
              </Typography>
              <Button
                variant="outlined"
                onClick={handleAddCompany}
                startIcon={<AddIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Complete Setup
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ display: 'flex' }}>
              <Grid item xs={12} md={4} sx={{ flexGrow: 1 }}>
                <StatCard
                  icon={TeamIcon}
                  label="Total Active Employees"
                  value="346"
                  sx={{ height: '100%', border: '1px solid #e2e8f0' }}
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{ flexGrow: 1 }}>
                <StatCard
                  icon={BillingIcon}
                  label="Current Plan"
                  value="Enterprise"
                  sx={{ height: '100%', border: '1px solid #e2e8f0' }}
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{ flexGrow: 1 }}>
                <StatCard
                  icon={RevenueIcon}
                  label="Monthly Revenue"
                  value="$2,123"
                  sx={{ height: '100%', border: '1px solid #e2e8f0' }}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Action Menu for Companies */}
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
          <MenuItem onClick={() => handleEdit(selectedCompany)}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </Container>
  );
};

export default OwnerDetailPage;
