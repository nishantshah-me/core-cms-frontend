'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  Typography,
  Container,
  Avatar,
  Grid,
  TextField,
  CardContent,
  InputAdornment,
  Breadcrumbs,
  Link,
  CircularProgress,
  Button,
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
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const OwnerDetailPage = () => {
  const router = useRouter();
  const [ownerData, setOwnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load owner data from localStorage
  useEffect(() => {
    loadOwnerFromStorage();
  }, []);

  const loadOwnerFromStorage = () => {
    try {
      setLoading(true);
      setError('');

      // Get owner data from localStorage
      const storedData = localStorage.getItem('details_page_data');

      if (!storedData) {
        setError('No owner data found');
        setOwnerData(null);
        return;
      }

      const parsedData = JSON.parse(storedData);

      // Validate the data structure
      if (!parsedData || !parsedData.id) {
        setError('Invalid owner data');
        setOwnerData(null);
        return;
      }

      setOwnerData(parsedData);
      console.log('Owner data loaded from localStorage:', parsedData);
    } catch (err) {
      console.error('Error loading owner data from localStorage:', err);
      setError('Failed to load owner details');
      setOwnerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!ownerData) return;

    try {
      // Clear any existing edit data and localStorage items
      localStorage.removeItem('edit_owner_data');
      localStorage.removeItem('active_step');
      localStorage.removeItem('created_owner_id');

      // Prepare the edit data with both owner and company information
      const editData = {
        isEdit: true,
        owner: {
          id: ownerData.id,
          username: ownerData.name,
          firstName: ownerData.firstName,
          lastName: ownerData.lastName,
          email: ownerData.email,
          phone: ownerData.phone,
        },
        company: {
          id: ownerData.companyId,
          name: ownerData.companyData?.name || '',
          website: ownerData.companyData?.website || '',
          email: ownerData.companyData?.email || ownerData.email,
          phone: ownerData.companyData?.phone || '',
          office_address: ownerData.companyData?.office_address || '',
          industry_type: ownerData.companyData?.industry_type || '',
          employee_count: ownerData.companyData?.employee_count || '',
        },
      };

      // Store the edit data
      localStorage.setItem('edit_owner_data', JSON.stringify(editData));

      // Navigate to edit page
      router.push(`/dashboard/owners/create-owners?edit=${ownerData.id}`);
    } catch (error) {
      console.error('Error preparing edit data:', error);
      toast.error('Failed to prepare edit data');
    }
  };

  const handleBackToOwners = () => {
    // Clean up localStorage before navigating back
    localStorage.removeItem('details_page_data');
    router.push('/dashboard/owners');
  };

  // Add cleanup when component unmounts (when user navigates away)
  useEffect(() => {
    return () => {
      // Only cleanup when actually unmounting/navigating away
      const currentPath = window.location.pathname;
      if (currentPath !== '/dashboard/owner-detail/') {
        localStorage.removeItem('details_page_data');
      }
    };
  }, []);

  // Generate initials for avatar
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'NA';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const ReadOnlyInput = ({ label, value, icon: Icon, isLink = false }) => (
    <TextField
      label={label}
      value={value || 'Not provided'}
      variant="outlined"
      fullWidth
      InputProps={{
        readOnly: true,
        startAdornment: (
          <InputAdornment position="start">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Icon sx={{ fontSize: 18 }} />
            </Box>
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#f9fafb',
          '& fieldset': {
            borderColor: '#e5e7eb',
          },
          '&:hover fieldset': {
            borderColor: '#10b981',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#10b981',
          },
        },
        '& .MuiInputLabel-root': {
          color: '#6b7280',
          fontSize: '0.875rem',
          fontWeight: 500,
        },
        '& .MuiInputBase-input': {
          color: isLink && value ? '#10b981' : '#374151',
          fontWeight: 500,
          cursor: isLink && value ? 'pointer' : 'default',
        },
      }}
      onClick={
        isLink && value
          ? () => {
              if (label.includes('Email')) {
                window.location.href = `mailto:${value}`;
              } else if (label.includes('Phone')) {
                window.location.href = `tel:${value}`;
              } else if (label.includes('URL') || label.includes('Website')) {
                window.open(value.startsWith('http') ? value : `https://${value}`, '_blank');
              }
            }
          : undefined
      }
    />
  );

  // Empty state when no data
  const EmptyState = () => (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/owners">
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
          It seems like you navigated directly to this page without selecting an owner. Please go
          back to the owners list and select an owner to view their details.
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

  // Loading state
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

  // Error state or no data
  if (error || !ownerData) {
    return <EmptyState />;
  }

  const hasCompanyData = ownerData.companyId && ownerData.companyData?.name;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>

          {/* ✅ Use onClick instead of href */}
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

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 1,
            }}
          >
            Owner Profile
          </Typography>
          <Typography variant="h6" color="#666" sx={{ fontWeight: 400 }}>
            Comprehensive owner information and company details
          </Typography>
        </Box>
      </Box>

      {/* Profile Header Card */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: '#374151',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 3,
              width: '100%',
            }}
          >
            <Avatar
              sx={{
                width: 70,
                height: 70,
                backgroundColor: '#10b981',
                fontSize: '1.75rem',
                fontWeight: 700,
                border: '3px solid rgba(255,255,255,0.2)',
                flexShrink: 0,
              }}
            >
              {getInitials(ownerData.firstName, ownerData.lastName)}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                }}
              >
                {ownerData.name || 'No Name'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <PersonIcon sx={{ color: '#10b981', fontSize: 18 }} />
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: 500,
                    fontSize: '1rem',
                  }}
                >
                  Owner
                </Typography>
              </Box>
              {(ownerData.companyData?.office_address || ownerData.email) && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {ownerData.companyData?.office_address && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} />
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '0.875rem',
                        }}
                      >
                        {ownerData.companyData.office_address}
                      </Typography>
                    </Box>
                  )}
                  {ownerData.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} />
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '0.875rem',
                        }}
                      >
                        {ownerData.email}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <Box sx={{ textAlign: 'right', minWidth: '120px' }}>
              {ownerData.phone && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      mb: 0.5,
                    }}
                  >
                    Phone
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    {ownerData.phone}
                  </Typography>
                </Box>
              )}
              {hasCompanyData && ownerData.companyData?.employee_count && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      mb: 0.5,
                    }}
                  >
                    Team Size
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#10b981',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    {ownerData.companyData.employee_count}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 4,
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <Box
          sx={{
            p: 4,
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 1,
            }}
          >
            Personal Information
          </Typography>
          <Typography variant="body1" color="#666">
            Personal details and contact information
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ReadOnlyInput label="Full Name" value={ownerData.name} icon={PersonIcon} />
            </Grid>
            <Grid item xs={12}>
              <ReadOnlyInput
                label="Email Address"
                value={ownerData.email}
                icon={EmailIcon}
                isLink
              />
            </Grid>
            <Grid item xs={12}>
              <ReadOnlyInput label="Phone Number" value={ownerData.phone} icon={PhoneIcon} isLink />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 4,
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <Box
          sx={{
            p: 4,
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 1,
            }}
          >
            Company Information
          </Typography>
          <Typography variant="body1" color="#666">
            Business details and company information
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {!hasCompanyData ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <BusinessIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Company Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                This owner hasn't completed company onboarding yet.
              </Typography>
              <Button variant="contained" onClick={handleEdit} startIcon={<EditIcon />}>
                Add Company Information
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <ReadOnlyInput
                  label="Company Name"
                  value={ownerData.companyData.name}
                  icon={BusinessIcon}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ReadOnlyInput
                  label="Industry Type"
                  value={ownerData.companyData.industry_type}
                  icon={FactoryIcon}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ReadOnlyInput
                  label="Employee Count"
                  value={ownerData.companyData.employee_count}
                  icon={PeopleIcon}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ReadOnlyInput
                  label="Company Email"
                  value={ownerData.companyData.email}
                  icon={EmailIcon}
                  isLink
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyInput
                  label="Company Website"
                  value={ownerData.companyData.website}
                  icon={WebsiteIcon}
                  isLink
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyInput
                  label="Company Address"
                  value={ownerData.companyData.office_address}
                  icon={LocationIcon}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default OwnerDetailPage;
