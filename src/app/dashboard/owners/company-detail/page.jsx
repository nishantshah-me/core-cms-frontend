'use client';

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
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuList,
  MenuItem,
  IconButton,
  Chip,
  CircularProgress,
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
  AccountBalance as BillingIcon,
  TrendingUp as RevenueIcon,
  Groups as TeamIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Settings as SettingsIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { getOwnerById } from 'src/auth/services/ownerCompanyService';

import { CustomPopover } from 'src/components/custom-popover';

const CompanyDetailPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ownerId = searchParams?.get('owner_id');
  const companyId = searchParams?.get('company_id');

  // State for the module actions menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      if (!ownerId) {
        setError('No ownerId provided in URL');
        setLoading(false);
        return;
      }
      try {
        const data = await getOwnerById(ownerId);
        setOwnerData(data);
      } catch (err) {
        console.error('Error fetching owner data:', err);
        setError('Failed to load company details');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [ownerId]);

  // Mock data - replace with actual API data later
  const mockCompanyData = {
    id: 'TC-2025-001',
    company_id: 2, // from API
    name: 'Hexafold technologies',
    registered_name: 'Hexafold technologies', // from API
    industry: 'Technology Services', // keeping old
    industry_type: 'Finance', // from API
    registrationNumber: 'REG-2023-TC-4567',
    taxId: 'TAX-B0123456',
    pan: 'CGRPJ3475R', // from API
    gst: 'GHNBVGH8765N', // from API
    address: '123 Tech Street, Silicon Valley, CA 94105', // old
    office_address: 'Malad west', // from API
    about: 'Hexafold technologies', // from API
    phone: '8562565854', // from API
    email: 'hexa@gmail.com', // from API
    website: 'www.hexafold.com', // from API
    createdDate: 'January 15, 2025',
    founding_date: '2025-09-28', // from API
    status: 'Active',
    activeEmployees: 247,
    inactiveEmployees: 12,
    employee_count: '51-100', // from API
    no_of_employees: 20, // from API
    activeModules: 5,
    monthlyCost: 4940,
    owner: {
      name: 'John Mitchell',
      title: 'CEO & Founder',
      email: 'john.mitchell@techcorp.com',
      phone: '+1 (555) 987-8543',
      since: 'March 2023',
    },
    modules: [
      {
        name: 'Attendance Management',
        status: 'Active',
        lastUsed: '2 hours ago',
        users: 245,
        cost: 1225,
      },
      {
        name: 'Payroll Management',
        status: 'Active',
        lastUsed: '1 day ago',
        users: 189,
        cost: 945,
      },
      {
        name: 'Leave Management',
        status: 'Active',
        lastUsed: '3 hours ago',
        users: 234,
        cost: 1170,
      },
      {
        name: 'Performance Analytics',
        status: 'Active',
        lastUsed: '5 hours ago',
        users: 156,
        cost: 780,
      },
      {
        name: 'Training & Development',
        status: 'Active',
        lastUsed: '1 week ago',
        users: 98,
        cost: 490,
      },
      {
        name: 'Employee Directory',
        status: 'Inactive',
        lastUsed: '2 months ago',
        users: 0,
        cost: 0,
      },
    ],
    billingSnapshot: {
      contributingEmployees: 247,
      costPerEmployee: 20.0,
      monthlyTotal: 4940.0,
      lastPayment: 'Feb 1, 2025',
      nextPaymentDue: 'Mar 1, 2025',
      paymentStatus: 'Current',
    },
  };

  const handleBackToOwner = () => {
    router.push(`/dashboard/owners/owner-detail?owner_id=${ownerId}`);
  };

  const handleMenuOpen = (event, module) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedModule(module);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedModule(null);
  };

  const handleViewBillingHistory = () => {
    // Navigate to billing history page
    console.log('View billing history');
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
            onClick={() => router.push('/dashboard/owners')}
            sx={{ cursor: 'pointer' }}
          >
            Owners
          </Link>
          <Link
            component="button"
            color="inherit"
            onClick={handleBackToOwner}
            sx={{ cursor: 'pointer' }}
          >
            Owner Detail
          </Link>
          <Typography color="text.primary">Company Detail</Typography>
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
          No Company Data Available
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
        >
          No Company specified or unable to load details. Please go back to the owners list and
          select an Company to view their details.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToOwner}
          sx={{ minWidth: 200 }}
        >
          Go Back to Owners
        </Button>
      </Card>
    </Container>
  );

  if (error || !ownerData) {
    return <EmptyState />;
  }

  console.log(ownerData);
  console.log('ownerData');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* BreadCrumbs */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link
            component="button"
            color="inherit"
            onClick={() => router.push('/dashboard/owners')}
            sx={{ cursor: 'pointer' }}
          >
            Owners
          </Link>
          <Link
            component="button"
            color="inherit"
            onClick={handleBackToOwner}
            sx={{ cursor: 'pointer' }}
          >
            Owner Detail
          </Link>
          <Typography color="text.primary">Company Detail</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header Section */}
      <Box
        sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            {mockCompanyData.name}
          </Typography>
          <Typography variant="body1" color="#666" sx={{ fontWeight: 400, mb: 2 }}>
            Created: {mockCompanyData.createdDate}
          </Typography>
        </Box>
      </Box>

      {/* Quick Stats */}

      <Grid container spacing={2} sx={{ display: 'flex', mb: 4 }}>
        <Grid item xs={12} md={3} sx={{ flexGrow: 1 }}>
          <StatCard
            icon={PeopleIcon}
            label="Active Employees"
            value={mockCompanyData.activeEmployees}
            sx={{ height: '100%', border: '1px solid #e2e8f0' }}
          />
        </Grid>
        <Grid item xs={12} md={3} sx={{ flexGrow: 1 }}>
          <StatCard
            icon={PersonIcon}
            label="Inactive Employees"
            value={mockCompanyData.inactiveEmployees}
            sx={{ height: '100%', border: '1px solid #e2e8f0' }}
          />
        </Grid>
        <Grid item xs={12} md={3} sx={{ flexGrow: 1 }}>
          <StatCard
            icon={SettingsIcon}
            label="Active Modules"
            value={mockCompanyData.activeModules}
            sx={{ height: '100%', border: '1px solid #e2e8f0' }}
          />
        </Grid>
        <Grid item xs={12} md={3} sx={{ flexGrow: 1 }}>
          <StatCard
            icon={RevenueIcon}
            label="Monthly Cost"
            value={`$${mockCompanyData.monthlyCost.toLocaleString()}`}
            sx={{ height: '100%', border: '1px solid #e2e8f0' }}
          />
        </Grid>
      </Grid>

      {/* Company + owner */}

      {/* <Grid container spacing={2} sx={{ display: 'flex', mb: 4 }}>
        <Grid item xs={12} md={3} sx={{ flexGrow: 1 }}>
          <Card
            sx={{
              mb: 4,
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              flexGrow: 1,
              height: '100%',
            }}
          >
            <Box
              sx={{
                p: 3,
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Company Information
              </Typography>
              <Typography variant="body2" color="#64748b">
                Basic company details and contact information
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} sx={{ flexGrow: 1 }}>
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                      Registered Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {ownerData.registered_name}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                      Industry Type
                    </Typography>
                    <Typography variant="body1">{ownerData.industry_type}</Typography>
                  </Box>

                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                      Phone
                    </Typography>
                    <Typography variant="body1">{ownerData.phone}</Typography>
                  </Box>

                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                      Email
                    </Typography>
                    <Typography variant="body1" color="primary" sx={{ cursor: 'pointer' }}>
                      {ownerData.email}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                      Website
                    </Typography>
                    <Typography variant="body1" color="primary" sx={{ cursor: 'pointer' }}>
                      {ownerData.website}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                      Employee Count
                    </Typography>
                    <Typography variant="body1">{ownerData.no_of_employees}</Typography>
                  </Box>

                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                      PAN
                    </Typography>
                    <Typography variant="body1">{ownerData.pan}</Typography>
                  </Box>

                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                      GST
                    </Typography>
                    <Typography variant="body1">{ownerData.gst}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                      Office Address
                    </Typography>
                    <Typography variant="body1">{ownerData.office_address}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3} sx={{ flexGrow: 1 }}>
          <Card
            sx={{
              mb: 4,
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              flexGrow: 1,
              height: '100%',
            }}
          >
            <Box
              sx={{
                p: 3,
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Linked Owner
              </Typography>
              <Typography variant="body2" color="#64748b">
                Owner information and contact details
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} sx={{ flexGrow: 1 }}>
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                      Full Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {ownerData.owner.name}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                      Email Address
                    </Typography>
                    <Typography variant="body1" color="primary" sx={{ cursor: 'pointer' }}>
                      {ownerData.owner.email}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                      Phone Number
                    </Typography>
                    <Typography variant="body1"> {ownerData.owner.phone}</Typography>
                  </Box>

                  <Box sx={{ width: '100%' }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleBackToOwner}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      View Owner Profile
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      {/* Enabled Modules */}
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
            Enabled Modules
          </Typography>
          <Typography variant="body2" color="#64748b">
            Active and inactive modules for this company
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table aria-label="modules table">
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#4a5568' }}>Module</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4a5568' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4a5568' }}>Users</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4a5568' }}>Last Used</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4a5568' }}>Cost</TableCell>
                  <TableCell width={88} sx={{ fontWeight: 700, color: '#4a5568' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockCompanyData.modules.map((module, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            backgroundColor: `${getStatusColor(module.status)}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {getModuleIcon(module.name)}
                        </Box> */}
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {module.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={module.status}
                        size="small"
                        sx={{
                          backgroundColor: module.status === 'Active' ? '#dcfce7' : '#fee2e2',
                          color: module.status === 'Active' ? '#166534' : '#dc2626',
                          fontWeight: 600,
                          border: 'none',
                        }}
                      />
                    </TableCell>
                    <TableCell>{module.users}</TableCell>
                    <TableCell>{module.lastUsed}</TableCell>
                    <TableCell>${module.cost}</TableCell>
                    <TableCell>
                      <IconButton onClick={(e) => handleMenuOpen(e, module)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Billing Snapshot */}
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
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Billing Snapshot
              </Typography>
              <Typography variant="body2" color="#64748b">
                Current billing information and payment status
              </Typography>
            </Box>
            {/* <Button
              variant="outlined"
              onClick={handleViewBillingHistory}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              View Billing History
            </Button> */}
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} sx={{ flexGrow: 1 }}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                  Contributing Employees
                </Typography>
                <Typography
                  sx={{
                    color: '#1e293b',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                  }}
                >
                  {mockCompanyData.billingSnapshot.contributingEmployees}
                </Typography>
              </Box>

              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                  Cost per Employee
                </Typography>
                <Typography
                  sx={{
                    color: '#1e293b',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                  }}
                >
                  ${mockCompanyData.billingSnapshot.costPerEmployee.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                  Monthly Total
                </Typography>
                <Typography
                  sx={{
                    color: '#1e293b',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                  }}
                >
                  ${mockCompanyData.billingSnapshot.monthlyTotal.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                  Last Payment
                </Typography>
                <Typography
                  sx={{
                    color: '#1e293b',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                  }}
                >
                  {mockCompanyData.billingSnapshot.lastPayment}
                </Typography>
              </Box>

              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                  Next Payment Due
                </Typography>
                <Typography
                  sx={{
                    color: '#1e293b',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                  }}
                >
                  {mockCompanyData.billingSnapshot.nextPaymentDue}
                </Typography>
              </Box>

              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                  Payment Status
                </Typography>
                <Chip
                  label={mockCompanyData.billingSnapshot.paymentStatus}
                  sx={{
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleViewBillingHistory}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  View Billing History
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Menu for Modules */}
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
          <MenuItem onClick={handleMenuClose}>
            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
            View Details
          </MenuItem>

          {selectedModule?.status === 'Active' ? (
            <MenuItem onClick={handleMenuClose}>
              <CancelIcon fontSize="small" sx={{ mr: 1 }} />
              Deactivate
            </MenuItem>
          ) : (
            <MenuItem onClick={handleMenuClose}>
              <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
              Activate
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>
    </Container>
  );
};

export default CompanyDetailPage;
