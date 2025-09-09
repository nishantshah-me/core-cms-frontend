/* eslint-disable perfectionist/sort-imports */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Card,
  Button,
  Typography,
  Container,
  Breadcrumbs,
  Link,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

// Industry and employee count options
const industryOptions = [
  'Information Technology',
  'Healthcare',
  'Education',
  'Real Estate',
  'Banking',
  'Finance',
  'Manufacturing',
  'Retail',
  'Marketing & Advertising',
  'Research & Development',
  'Financial Services',
  'Construction',
  'Transportation',
  'Energy',
  'Entertainment',
  'Food & Beverage',
  'Consulting',
  'Non-profit',
  'Government',
  'Other',
];

const employeeCountOptions = ['1-50', '51-100', '101-500', '501-1000', '1000+'];

// Pricing plans data
const pricingPlans = [
  {
    id: 'free',
    name: 'Free Plans',
    monthlyPrice: 0,
    yearlyPrice: 0,
    originalMonthlyPrice: 20.99,
    originalYearlyPrice: 20.99,
    description: 'Basic features for up to 5 users with unlimited projects and reporting',
    features: [
      'Max 10 A & production features',
      'Adjust for local languages & loc data',
      'Manage online payments',
      'Set up automated payment reminders',
    ],
    isRecommended: false,
    color: 'primary',
  },
  {
    id: 'basic',
    name: 'Basic Plans',
    monthlyPrice: 14.99,
    yearlyPrice: 134.99,
    originalMonthlyPrice: 34.99,
    originalYearlyPrice: 334.99,
    description: 'Basic features for up to 25 users with unlimited projects and reporting',
    features: [
      'Create quotes and RFP compliant',
      'Adjust for local languages & loc data',
      'Perfect multi-currency transactions',
      'Manage online payments',
      'Set up automated payment reminders',
    ],
    isRecommended: false,
    color: 'info',
  },
  {
    id: 'pro',
    name: 'Pro Plans',
    monthlyPrice: 24.99,
    yearlyPrice: 234.99,
    originalMonthlyPrice: 54.99,
    originalYearlyPrice: 534.99,
    description: 'Basic features for up to 100 users with unlimited projects and reporting',
    features: [
      'Create quotes and RFP compliant bookings',
      'Adjust for local languages & loc data',
      'Perfect multi-currency transactions',
      'Manage online payments',
      'Set up automated payment reminders',
      'Offer a zero direct API service custom graphics',
      'Automate your transaction templates',
      'Use custom domains',
    ],
    isRecommended: true,
    color: 'warning',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plans',
    monthlyPrice: 34.99,
    yearlyPrice: 334.99,
    originalMonthlyPrice: 54.99,
    originalYearlyPrice: 534.99,
    description: 'Basic features for up to unlimited users with unlimited projects and reporting',
    features: [
      'Create quotes and RFP compliant bookings',
      'Adjust for local languages & loc data',
      'Perfect multi-currency transactions',
      'Manage online payments',
      'Set up automated payment reminders',
      'Offer a zero direct API service custom graphics',
      'Guarantee plus transaction templates',
      'Enterprise business workflows',
      'Generate detailed 24/7 reports',
    ],
    isRecommended: false,
    color: 'success',
  },
];

const steps = ['Owner Onboarding', 'Company Onboarding', 'Pricing Plan'];

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  // Owner state
  const [ownerFormData, setOwnerFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [ownerErrors, setOwnerErrors] = useState({});

  const [otpState, setOtpState] = useState({
    isEmailVerified: false,
    otpSent: false,
    otp: ['', '', '', '', '', ''],
    isVerifying: false,
    isSending: false,
    resendTimer: 0,
    otpError: '',
  });

  // Company state
  const [companyFormData, setCompanyFormData] = useState({
    companyName: '',
    industryType: '',
    companyEmail: '',
    companyAddress: '',
    employeeCount: '',
    companyURL: '',
  });
  const [companyErrors, setCompanyErrors] = useState({});

  // Pricing state
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let interval;
    if (otpState.resendTimer > 0) {
      interval = setInterval(() => {
        setOtpState((prev) => ({
          ...prev,
          resendTimer: prev.resendTimer - 1,
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpState.resendTimer]);

  // Check if edit mode and load data
  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam) {
      setIsEdit(true);
      setEditId(Number.parseInt(editParam));

      // Load edit data from localStorage
      const editData = localStorage.getItem('edit_owner_data');
      if (editData) {
        try {
          const parsedEditData = JSON.parse(editData);

          // Populate owner form data
          setOwnerFormData({
            firstName: parsedEditData.owner.firstName || '',
            lastName: parsedEditData.owner.lastName || '',
            email: parsedEditData.owner.email || '',
            phone: parsedEditData.owner.phone || '',
          });

          // Populate company form data
          setCompanyFormData({
            companyName: parsedEditData.company.companyName || '',
            industryType: parsedEditData.company.industryType || '',
            companyEmail: parsedEditData.company.companyEmail || parsedEditData.owner.email || '',
            companyAddress: parsedEditData.company.companyAddress || '',
            employeeCount: parsedEditData.company.employeeCount || '',
            companyURL: parsedEditData.company.companyURL || '',
          });

          // Populate pricing data
          setSelectedPlan(parsedEditData.pricing.selectedPlan || 'pro');
          setBillingCycle(parsedEditData.pricing.billingCycle || 'monthly');
        } catch (error) {
          console.error('Error parsing edit data:', error);
        }
      }
    } else {
      // Reset form for new creation
      setIsEdit(false);
      setEditId(null);
      setOwnerFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      });
      setCompanyFormData({
        companyName: '',
        industryType: '',
        companyEmail: '',
        companyAddress: '',
        employeeCount: '',
        companyURL: '',
      });
      setSelectedPlan('pro');
      setBillingCycle('monthly');
    }
  }, [searchParams]);

  const handleOwnerInputChange = (field) => (event) => {
    const value = event.target.value;
    setOwnerFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === 'email' && !isEdit) {
      setOtpState((prev) => ({
        ...prev,
        isEmailVerified: false,
        otpSent: false,
        otp: ['', '', '', '', '', ''],
        otpError: '',
      }));
    }

    if (ownerErrors[field]) {
      setOwnerErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSendOTP = async () => {
    if (!ownerFormData.email || !/\S+@\S+\.\S+/.test(ownerFormData.email)) {
      setOwnerErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    setOtpState((prev) => ({ ...prev, isSending: true, otpError: '' }));

    try {
      // Simulate API call to send OTP
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setOtpState((prev) => ({
        ...prev,
        otpSent: true,
        isSending: false,
        resendTimer: 60,
        otp: ['', '', '', '', '', ''],
      }));
    } catch (error) {
      setOtpState((prev) => ({
        ...prev,
        isSending: false,
        otpError: 'Failed to send OTP. Please try again.',
      }));
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = [...otpState.otp];
    newOtp[index] = value;

    setOtpState((prev) => ({
      ...prev,
      otp: newOtp,
      otpError: '',
    }));

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpState.otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otpState.otp.join('');
    if (otpValue.length !== 6) {
      setOtpState((prev) => ({ ...prev, otpError: 'Please enter complete 6-digit OTP' }));
      return;
    }

    setOtpState((prev) => ({ ...prev, isVerifying: true, otpError: '' }));

    try {
      // Simulate API call to verify OTP
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For demo purposes, accept any 6-digit OTP
      setOtpState((prev) => ({
        ...prev,
        isEmailVerified: true,
        isVerifying: false,
      }));
    } catch (error) {
      setOtpState((prev) => ({
        ...prev,
        isVerifying: false,
        otpError: 'Invalid OTP. Please try again.',
      }));
    }
  };

  const handleResendOTP = () => {
    if (otpState.resendTimer === 0) {
      handleSendOTP();
    }
  };

  const validateOwnerForm = () => {
    const newErrors = {};

    if (!ownerFormData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!ownerFormData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!ownerFormData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(ownerFormData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!ownerFormData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!isEdit && !otpState.isEmailVerified) {
      newErrors.email = 'Please verify your email address';
    }

    setOwnerErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCompanyForm = () => {
    const newErrors = {};

    if (!companyFormData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!companyFormData.industryType) {
      newErrors.industryType = 'Industry type is required';
    }

    if (!companyFormData.companyEmail.trim()) {
      newErrors.companyEmail = 'Company email is required';
    } else if (!/\S+@\S+\.\S+/.test(companyFormData.companyEmail)) {
      newErrors.companyEmail = 'Email is invalid';
    }

    if (!companyFormData.companyAddress.trim()) {
      newErrors.companyAddress = 'Company address is required';
    }

    if (!companyFormData.employeeCount) {
      newErrors.employeeCount = 'Employee count is required';
    }

    if (!companyFormData.companyURL.trim()) {
      newErrors.companyURL = 'Company URL is required';
    } else {
      try {
        new URL(companyFormData.companyURL);
      } catch {
        newErrors.companyURL = 'Please enter a valid URL (e.g., https://example.com)';
      }
    }

    setCompanyErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      // Validate owner data
      if (!validateOwnerForm()) {
        return;
      }
    } else if (activeStep === 1) {
      // Validate company data
      if (!validateCompanyForm()) {
        return;
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleBillingCycleChange = (event, newBillingCycle) => {
    if (newBillingCycle !== null) {
      setBillingCycle(newBillingCycle);
    }
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (isEdit) {
        // Update existing owner
        const existingOwners = JSON.parse(localStorage.getItem('owners') || '[]');
        const updatedOwners = existingOwners.map((owner) => {
          if (owner.id === editId) {
            return {
              ...owner,
              firstName: ownerFormData.firstName,
              lastName: ownerFormData.lastName,
              email: ownerFormData.email,
              phone: ownerFormData.phone,
              company: companyFormData.companyName,
              planId: selectedPlan,
              billingCycle: billingCycle,
              companyData: companyFormData,
            };
          }
          return owner;
        });

        localStorage.setItem('owners', JSON.stringify(updatedOwners));

        // Clean up edit data
        localStorage.removeItem('edit_owner_data');
      } else {
        // Create new owner - save as completed onboarding
        const onboardingData = {
          owner: ownerFormData,
          company: companyFormData,
          selectedPlan,
          billingCycle,
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem('completed_onboarding', JSON.stringify(onboardingData));
      }

      // Clean up temporary data
      localStorage.removeItem('onboarding_owners');
      localStorage.removeItem('onboarding_companies');

      // Redirect to owners list
      router.push('/dashboard/owners');
    } catch (error) {
      console.error('Error saving owner data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompanyInputChange = (field) => (event) => {
    const value = event.target.value;
    setCompanyFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (companyErrors[field]) {
      setCompanyErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const renderOwnerStep = () => (
    <Box>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Owner Information
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            label="First Name"
            value={ownerFormData.firstName}
            onChange={handleOwnerInputChange('firstName')}
            error={Boolean(ownerErrors.firstName)}
            helperText={ownerErrors.firstName}
            required
          />
          <TextField
            fullWidth
            label="Last Name"
            value={ownerFormData.lastName}
            onChange={handleOwnerInputChange('lastName')}
            error={Boolean(ownerErrors.lastName)}
            helperText={ownerErrors.lastName}
            required
          />
          <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
            <TextField
              fullWidth
              label="Working Email"
              type="email"
              value={ownerFormData.email}
              onChange={handleOwnerInputChange('email')}
              error={Boolean(ownerErrors.email)}
              helperText={ownerErrors.email}
              required
              disabled={!isEdit && otpState.isEmailVerified}
              InputProps={{
                endAdornment: !isEdit && (
                  <Box sx={{ ml: 1 }}>
                    {otpState.isEmailVerified ? (
                      <Chip label="Verified" color="success" size="small" icon={<CheckIcon />} />
                    ) : (
                      <Button
                        size="small"
                        onClick={handleSendOTP}
                        disabled={otpState.isSending || !ownerFormData.email}
                        variant="outlined"
                      >
                        {otpState.isSending
                          ? 'Sending...'
                          : otpState.otpSent
                            ? 'Resend OTP'
                            : 'Send OTP'}
                      </Button>
                    )}
                  </Box>
                ),
              }}
            />
          </Box>

          {!isEdit && otpState.otpSent && !otpState.isEmailVerified && (
            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
              <Paper sx={{ p: 3, mt: 2, backgroundColor: '#f8f9fa' }}>
                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                  Please Enter The 6-Digit(OTP) Sent To The Email Address
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                  {otpState.otp.map((digit, index) => (
                    <TextField
                      key={index}
                      id={`otp-${index}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      inputProps={{
                        maxLength: 1,
                        style: { textAlign: 'center', fontSize: '1.5rem' },
                      }}
                      sx={{
                        width: 56,
                        '& .MuiOutlinedInput-root': {
                          height: 56,
                        },
                      }}
                      error={Boolean(otpState.otpError)}
                    />
                  ))}
                </Box>

                {otpState.otpError && (
                  <Typography color="error" variant="body2" sx={{ textAlign: 'center', mb: 2 }}>
                    {otpState.otpError}
                  </Typography>
                )}

                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Didn't receive OTP code?{' '}
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleResendOTP}
                      disabled={otpState.resendTimer > 0}
                      sx={{ p: 0, minWidth: 'auto', textDecoration: 'underline' }}
                    >
                      {otpState.resendTimer > 0 ? `Resend in ${otpState.resendTimer}s` : 'Resend'}
                    </Button>
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={handleVerifyOTP}
                    disabled={otpState.isVerifying || otpState.otp.join('').length !== 6}
                    sx={{
                      backgroundColor: '#ff6b35',
                      '&:hover': { backgroundColor: '#e55a2b' },
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    {otpState.isVerifying ? 'Verifying...' : 'Verify & Continue'}
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

          <TextField
            fullWidth
            label="Phone Number"
            value={ownerFormData.phone}
            onChange={handleOwnerInputChange('phone')}
            error={Boolean(ownerErrors.phone)}
            helperText={ownerErrors.phone}
            required
          />
        </Box>
      </Card>
    </Box>
  );

  const renderCompanyStep = () => (
    <Box>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Company Information
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            label="Company Name"
            value={companyFormData.companyName}
            onChange={handleCompanyInputChange('companyName')}
            error={Boolean(companyErrors.companyName)}
            helperText={companyErrors.companyName}
            required
          />
          <FormControl fullWidth error={Boolean(companyErrors.industryType)} required>
            <InputLabel>Industry Type</InputLabel>
            <Select
              value={companyFormData.industryType}
              onChange={handleCompanyInputChange('industryType')}
              label="Industry Type"
            >
              {industryOptions.map((industry) => (
                <MenuItem key={industry} value={industry}>
                  {industry}
                </MenuItem>
              ))}
            </Select>
            {companyErrors.industryType && (
              <FormHelperText>{companyErrors.industryType}</FormHelperText>
            )}
          </FormControl>
          <TextField
            fullWidth
            label="Company Email"
            type="email"
            value={companyFormData.companyEmail}
            onChange={handleCompanyInputChange('companyEmail')}
            error={Boolean(companyErrors.companyEmail)}
            helperText={companyErrors.companyEmail}
            required
          />
          <TextField
            fullWidth
            label="Company Address"
            value={companyFormData.companyAddress}
            onChange={handleCompanyInputChange('companyAddress')}
            error={Boolean(companyErrors.companyAddress)}
            helperText={companyErrors.companyAddress}
            required
            multiline
          />
          <FormControl fullWidth error={Boolean(companyErrors.employeeCount)} required>
            <InputLabel>Employee Count</InputLabel>
            <Select
              value={companyFormData.employeeCount}
              onChange={handleCompanyInputChange('employeeCount')}
              label="Employee Count"
            >
              {employeeCountOptions.map((count) => (
                <MenuItem key={count} value={count}>
                  {count}
                </MenuItem>
              ))}
            </Select>
            {companyErrors.employeeCount && (
              <FormHelperText>{companyErrors.employeeCount}</FormHelperText>
            )}
          </FormControl>
          <TextField
            fullWidth
            label="Company URL"
            value={companyFormData.companyURL}
            onChange={handleCompanyInputChange('companyURL')}
            error={Boolean(companyErrors.companyURL)}
            helperText={companyErrors.companyURL}
            required
            placeholder="https://example.com"
          />
        </Box>
      </Card>
    </Box>
  );

  const renderPricingStep = () => (
    <Box>
      <Card sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Pricing Plan
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Please select your pricing plan
          </Typography>

          {/* Billing Cycle Toggle */}
          <ToggleButtonGroup
            value={billingCycle}
            exclusive
            onChange={handleBillingCycleChange}
            sx={{ mb: 4 }}
          >
            <ToggleButton value="monthly" sx={{ px: 3, py: 1 }}>
              Monthly
            </ToggleButton>
            <ToggleButton value="yearly" sx={{ px: 3, py: 1 }}>
              Yearly
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Pricing Cards */}
        <Grid container spacing={3}>
          {pricingPlans.map((plan) => (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <Paper
                elevation={selectedPlan === plan.id ? 8 : 2}
                sx={{
                  p: 3,
                  height: '100%',
                  position: 'relative',
                  border: selectedPlan === plan.id ? 2 : 1,
                  borderColor: selectedPlan === plan.id ? `${plan.color}.main` : 'divider',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.isRecommended && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <Chip
                      label="Recommend for you"
                      color="warning"
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                )}

                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="h4" component="span" color={`${plan.color}.main`}>
                      ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    </Typography>
                    {plan.monthlyPrice > 0 && (
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ textDecoration: 'line-through', ml: 1, color: 'text.secondary' }}
                      >
                        $
                        {billingCycle === 'monthly'
                          ? plan.originalMonthlyPrice
                          : plan.originalYearlyPrice}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {plan.description}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant={selectedPlan === plan.id ? 'contained' : 'outlined'}
                  color={plan.color}
                  sx={{ mb: 2 }}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  Select Plan
                </Button>

                <List dense>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <CheckIcon fontSize="small" color={plan.color} />
                      </ListItemIcon>
                      <ListItemText
                        primary={feature}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/owners">
            Owner
          </Link>
          <Typography color="text.primary">{isEdit ? 'Edit' : 'Create'}</Typography>
        </Breadcrumbs>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Box sx={{ mb: 4 }}>
        {activeStep === 0 && renderOwnerStep()}
        {activeStep === 1 && renderCompanyStep()}
        {activeStep === 2 && renderPricingStep()}
      </Box>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back
        </Button>

        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            endIcon={<CheckIcon />}
            variant="contained"
          >
            {isSubmitting
              ? isEdit
                ? 'Updating...'
                : 'Creating Account...'
              : isEdit
                ? 'Update Account'
                : 'Create Account'}
          </Button>
        ) : (
          <Button onClick={handleNext} endIcon={<ArrowForwardIcon />} variant="contained">
            Continue
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default Page;
