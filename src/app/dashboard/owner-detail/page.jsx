import React from 'react';
import {
  Box,
  Card,
  Typography,
  Container,
  Avatar,
  Grid,
  Chip,
  TextField,
  CardContent,
  InputAdornment,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  Factory as FactoryIcon,
  MonetizationOn as MonetizationOnIcon,
} from '@mui/icons-material';

// Static owner data
const staticOwner = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@company.com',
  phone: '+1 234 567 8900',
  company: 'Tech Solutions Inc',
};

// Static associated company data
const staticCompany = {
  id: 1,
  companyName: 'Tech Solutions Inc',
  industryType: 'Information Technology',
  companyEmail: 'info@techsolutions.com',
  companyAddress: '123 Tech Street, Silicon Valley, CA 94025',
  employeeCount: '51-100',
  companyURL: 'https://www.techsolutions.com',
};

const App = () => {
  // Generate initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const ReadOnlyInput = ({ label, value, icon: Icon, isLink = false }) => (
    <TextField
      label={label}
      value={value}
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
          color: isLink ? '#10b981' : '#374151',
          fontWeight: 500,
          cursor: isLink ? 'pointer' : 'default',
        },
      }}
    />
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
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

      {/* Profile Header Card */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: '#374151',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: '#10b981',
                  fontSize: '2rem',
                  fontWeight: 700,
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              >
                {getInitials(staticOwner.firstName, staticOwner.lastName)}
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                    mb: 1,
                  }}
                >
                  {staticOwner.firstName} {staticOwner.lastName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon sx={{ color: '#10b981', fontSize: 20 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: 500,
                    }}
                  >
                    Owner
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} />
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {staticCompany?.companyAddress || 'Address not available'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Chip
              icon={<CheckCircleIcon />}
              label="Active"
              sx={{
                backgroundColor: '#10b981',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem',
                height: 40,
                '& .MuiChip-icon': {
                  color: 'white',
                },
              }}
            />
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
            <Grid item xs={12} md={3}>
              <ReadOnlyInput label="First Name" value={staticOwner.firstName} icon={PersonIcon} />
            </Grid>
            <Grid item xs={12} md={3}>
              <ReadOnlyInput label="Last Name" value={staticOwner.lastName} icon={PersonIcon} />
            </Grid>
            <Grid item xs={12} md={3}>
              <ReadOnlyInput
                label="Email Address"
                value={staticOwner.email}
                icon={EmailIcon}
                isLink
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <ReadOnlyInput
                label="Phone Number"
                value={staticOwner.phone}
                icon={PhoneIcon}
                isLink
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Company Information */}
      {staticCompany && (
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
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <ReadOnlyInput
                  label="Company Name"
                  value={staticCompany.companyName}
                  icon={BusinessIcon}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ReadOnlyInput
                  label="Industry Type"
                  value={staticCompany.industryType}
                  icon={FactoryIcon}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ReadOnlyInput
                  label="Employee Count"
                  value={staticCompany.employeeCount}
                  icon={PeopleIcon}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ReadOnlyInput
                  label="Company Email"
                  value={staticCompany.companyEmail}
                  icon={EmailIcon}
                  isLink
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyInput
                  label="Company Website"
                  value={staticCompany.companyURL}
                  icon={WebsiteIcon}
                  isLink
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyInput
                  label="Company Address"
                  value={staticCompany.companyAddress}
                  icon={LocationIcon}
                  rows={3}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plan */}
      <Card
        sx={{
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
            Pricing Plan
          </Typography>
          <Typography variant="body1" color="#666">
            Current subscription and billing information
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <ReadOnlyInput label="Plan Name" value="Pro Plan" icon={MonetizationOnIcon} />{' '}
            </Grid>
            <Grid item xs={12} md={4}>
              <ReadOnlyInput label="Price" value="$24.99/month" icon={CreditCardIcon} />
            </Grid>
            <Grid item xs={12} md={4}>
              <ReadOnlyInput label="Status" value="Active" icon={CheckCircleIcon} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default App;
