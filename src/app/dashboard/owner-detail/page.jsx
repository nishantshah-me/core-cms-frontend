'use client';
import { Box, Card, Typography, Container, Avatar, Grid, Chip, Paper, Stack } from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
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

const Page = () => {
  // Generate initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Mock date - can be adjusted as needed
  const joinDate = '08/09/2025';

  const InfoItem = ({ icon: Icon, label, value, isLink = false }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: '#f9fafb',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      }}
    >
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1.5,
              backgroundColor: '#10b981',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Typography
            variant="caption"
            color="#6b7280"
            fontWeight="500"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            {label}
          </Typography>
        </Box>
        <Typography
          variant="body1"
          fontWeight="600"
          color={isLink ? '#10b981' : '#374151'}
          sx={{
            cursor: isLink ? 'pointer' : 'default',
            '&:hover': isLink ? { textDecoration: 'underline' } : {},
          }}
        >
          {value}
        </Typography>
      </Stack>
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="700" color="#1f2937">
          Owner Profile
        </Typography>
        <Typography variant="body1" color="#6b7280" sx={{ mt: 1 }}>
          Comprehensive owner information and company details
        </Typography>
      </Box>

      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
        }}
      >
        <Box
          sx={{
            background: '#374151',
            p: 4,
            color: 'white',
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                backgroundColor: '#10b981',
                fontSize: '2rem',
                fontWeight: '600',
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              {getInitials(staticOwner.firstName, staticOwner.lastName)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="600" gutterBottom>
                {staticOwner.firstName} {staticOwner.lastName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon fontSize="small" />
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: '400' }}>
                  Owner
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon fontSize="small" />
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  {staticCompany?.companyAddress || 'Address not available'}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Chip
            label="Active"
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              backgroundColor: '#10b981',
              color: 'white',
              fontWeight: '500',
              '& .MuiChip-label': { px: 2 },
            }}
          />
        </Box>
      </Card>

      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
        }}
      >
        <Box
          sx={{
            p: 4,
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
          }}
        >
          <Typography variant="h5" fontWeight="600" color="#1f2937">
            Personal Information
          </Typography>
          <Typography variant="body2" color="#6b7280" sx={{ mt: 1 }}>
            Personal details and contact information
          </Typography>
        </Box>

        <Box sx={{ p: 4, backgroundColor: '#f9fafb' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <InfoItem icon={PersonIcon} label="First Name" value={staticOwner.firstName} />
            </Grid>
            <Grid item xs={12} md={3}>
              <InfoItem icon={PersonIcon} label="Last Name" value={staticOwner.lastName} />
            </Grid>
            <Grid item xs={12} md={3}>
              <InfoItem icon={EmailIcon} label="Email Address" value={staticOwner.email} isLink />
            </Grid>
            <Grid item xs={12} md={3}>
              <InfoItem icon={PhoneIcon} label="Phone Number" value={staticOwner.phone} isLink />
            </Grid>
          </Grid>
        </Box>
      </Card>

      {staticCompany && (
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
          }}
        >
          <Box
            sx={{
              p: 4,
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
            }}
          >
            <Typography variant="h5" fontWeight="600" color="#1f2937">
              Company Information
            </Typography>
            <Typography variant="body2" color="#6b7280" sx={{ mt: 1 }}>
              Business details and company information
            </Typography>
          </Box>

          <Box sx={{ p: 4, backgroundColor: '#f9fafb' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <InfoItem
                  icon={BusinessIcon}
                  label="Company Name"
                  value={staticCompany.companyName}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InfoItem
                  icon={BusinessIcon}
                  label="Industry Type"
                  value={staticCompany.industryType}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InfoItem
                  icon={PeopleIcon}
                  label="Employee Count"
                  value={staticCompany.employeeCount}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InfoItem
                  icon={EmailIcon}
                  label="Company Email"
                  value={staticCompany.companyEmail}
                  isLink
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InfoItem
                  icon={WebsiteIcon}
                  label="Company Website"
                  value={staticCompany.companyURL}
                  isLink
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InfoItem
                  icon={LocationIcon}
                  label="Company Address"
                  value={staticCompany.companyAddress}
                />
              </Grid>
            </Grid>
          </Box>
        </Card>
      )}

      {staticCompany && (
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            mt: 4,
          }}
        >
          <Box
            sx={{
              p: 4,
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
            }}
          >
            <Typography variant="h5" fontWeight="600" color="#1f2937">
              Pricing Plan
            </Typography>
            <Typography variant="body2" color="#6b7280" sx={{ mt: 1 }}>
              Current subscription and billing information
            </Typography>
          </Box>

          <Box sx={{ p: 4, backgroundColor: '#f9fafb' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <InfoItem icon={BusinessIcon} label="Plan Name" value="Pro Plan" />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem icon={CalendarIcon} label="Price" value="$24.99/month" />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem icon={PersonIcon} label="Status" value="Active" />
              </Grid>
            </Grid>
          </Box>
        </Card>
      )}
    </Container>
  );
};

export default Page;
