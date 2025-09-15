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
  Chip,
  Paper,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  sendOwnerOTP,
  verifyOwnerOTP,
  createCompany,
  updateOwner,
  updateCompany,
} from 'src/auth/services/ownerCompanyService';
import toast from 'react-hot-toast';

// Industry and employee count options
const industryOptions = [
  'IT Services',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Others',
];

const employeeCountOptions = ['1-50', '51-100', '101-500', '501-1000', '1000+'];

const steps = ['Owner Onboarding', 'Company Onboarding'];

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Safe initialization to avoid hydration errors
  const [activeStep, setActiveStep] = useState(0);
  const [createdOwnerId, setCreatedOwnerId] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editOwnerData, setEditOwnerData] = useState(null);
  const [hasExistingCompany, setHasExistingCompany] = useState(false); // Track if company exists
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Owner state
  const [ownerFormData, setOwnerFormData] = useState({
    fullName: '',
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

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize data from localStorage after component mounts to avoid hydration issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get active step from localStorage
      const savedActiveStep = localStorage.getItem('active_step');
      if (savedActiveStep) {
        setActiveStep(Number(savedActiveStep));
      }

      // Get created owner ID from localStorage
      const savedOwnerId = localStorage.getItem('created_owner_id');
      if (savedOwnerId) {
        setCreatedOwnerId(savedOwnerId);
      }

      setIsInitialized(true);
    }
  }, []);

  // Handle edit mode and load data
  useEffect(() => {
    if (!isInitialized) return;

    const editParam = searchParams.get('edit');
    if (editParam) {
      setIsEdit(true);

      // Load edit data from localStorage
      const editData = localStorage.getItem('edit_owner_data');
      if (editData) {
        try {
          const parsedEditData = JSON.parse(editData);
          setEditOwnerData(parsedEditData);

          // Check if company exists (has valid company ID)
          const companyExists = parsedEditData.company && parsedEditData.company.id;
          setHasExistingCompany(companyExists);

          // Populate owner form data
          setOwnerFormData({
            fullName: parsedEditData.owner.username || '',
            email: parsedEditData.owner.email || '',
            phone: parsedEditData.owner.phone || '',
          });

          // Populate company form data
          setCompanyFormData({
            companyName: parsedEditData.company?.name || '',
            industryType: parsedEditData.company?.industry_type || '',
            companyEmail: parsedEditData.company?.email || '',
            companyAddress: parsedEditData.company?.office_address || '',
            employeeCount: parsedEditData.company?.employee_count || '',
            companyURL: parsedEditData.company?.website || '',
          });

          // Skip OTP verification for edit mode
          setOtpState((prev) => ({ ...prev, isEmailVerified: true }));
        } catch (error) {
          console.error('Error parsing edit data:', error);
          toast.error('Error loading edit data');
          setError('Error loading edit data');
        }
      }
    } else {
      // Reset form for new creation
      setIsEdit(false);
      setEditOwnerData(null);
      setHasExistingCompany(false);
      setOwnerFormData({
        fullName: '',
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
      setOtpState({
        isEmailVerified: false,
        otpSent: false,
        otp: ['', '', '', '', '', ''],
        isVerifying: false,
        isSending: false,
        resendTimer: 0,
        otpError: '',
      });
    }
  }, [searchParams, isInitialized]);

  // Save active step to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('active_step', activeStep.toString());
    }
  }, [activeStep, isInitialized]);

  // Save created owner ID to localStorage
  useEffect(() => {
    if (createdOwnerId && isInitialized) {
      localStorage.setItem('created_owner_id', createdOwnerId);
    }
  }, [createdOwnerId, isInitialized]);

  // OTP timer effect
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

    // Clear general error
    if (error) {
      setError('');
    }
  };

  const handleSendOTP = async () => {
    if (!ownerFormData.email || !/\S+@\S+\.\S+/.test(ownerFormData.email)) {
      setOwnerErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    if (!ownerFormData.fullName.trim()) {
      setOwnerErrors((prev) => ({ ...prev, fullName: 'Please enter your full name' }));
      return;
    }

    if (!ownerFormData.phone.trim()) {
      setOwnerErrors((prev) => ({ ...prev, phone: 'Please enter your phone number' }));
      return;
    }

    setOtpState((prev) => ({ ...prev, isSending: true, otpError: '' }));
    setError('');

    try {
      const otpData = {
        username: ownerFormData.fullName.trim(),
        email: ownerFormData.email.trim(),
        phone: ownerFormData.phone.trim(),
      };

      await sendOwnerOTP(otpData);
      toast.success('OTP sent successfully');

      setOtpState((prev) => ({
        ...prev,
        otpSent: true,
        isSending: false,
        resendTimer: 60,
        otp: ['', '', '', '', '', ''],
      }));
    } catch (err) {
      console.error('OTP send error:', err);
      toast.error(`OTP send error: ${err.message}`);
      setError(err.message || 'Failed to send OTP. Please try again.');
      setOtpState((prev) => ({
        ...prev,
        isSending: false,
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
    setError('');

    try {
      const verifyData = {
        username: ownerFormData.fullName.trim(),
        email: ownerFormData.email.trim(),
        phone: ownerFormData.phone.trim(),
        otp: otpValue,
      };

      const response = await verifyOwnerOTP(verifyData);

      // Store the created owner ID for company creation
      if (response.owner_id) {
        setCreatedOwnerId(response.owner_id);
      }

      toast.success('Email verified successfully');

      setOtpState((prev) => ({
        ...prev,
        isEmailVerified: true,
        isVerifying: false,
      }));
    } catch (err) {
      console.error('OTP verification error:', err);
      toast.error(`OTP verification error: ${err.message}`);
      setOtpState((prev) => ({
        ...prev,
        isVerifying: false,
        otpError: err.message || 'Invalid OTP. Please try again.',
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

    if (!ownerFormData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
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
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFinalSubmit = async () => {
    // Validate company form before submitting
    if (!validateCompanyForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (isEdit) {
        // --- UPDATE FLOW ---

        // Update owner information
        const ownerUpdateData = {
          username: ownerFormData.fullName.trim(),
          email: ownerFormData.email,
          phone: ownerFormData.phone,
        };

        await updateOwner(editOwnerData.owner.id, ownerUpdateData);
        toast.success('Owner information updated successfully');

        // Handle company creation or update based on whether company exists
        if (hasExistingCompany && editOwnerData.company.id) {
          // Company exists - UPDATE it
          const companyUpdateData = {
            name: companyFormData.companyName,
            website: companyFormData.companyURL,
            phone: ownerFormData.phone, // Use owner phone as company phone
            email: companyFormData.companyEmail,
            office_address: companyFormData.companyAddress,
            employee_count: companyFormData.employeeCount,
            industry_type: companyFormData.industryType,
          };

          await updateCompany(editOwnerData.company.id, companyUpdateData);
          toast.success('Company information updated successfully');
        } else {
          // No company exists - CREATE it
          const companyData = {
            owner_id: editOwnerData.owner.id,
            name: companyFormData.companyName,
            website: companyFormData.companyURL,
            phone: ownerFormData.phone,
            email: companyFormData.companyEmail,
            office_address: companyFormData.companyAddress,
            employee_count: companyFormData.employeeCount,
            industry_type: companyFormData.industryType,
          };

          await createCompany(companyData);
          toast.success('Company created successfully');
        }
      } else {
        // --- CREATE FLOW ---
        const ownerId = createdOwnerId;
        if (!ownerId) {
          throw new Error('Owner ID not found. Please try the process again.');
        }

        const companyData = {
          owner_id: ownerId,
          name: companyFormData.companyName,
          website: companyFormData.companyURL,
          phone: ownerFormData.phone, // Use owner phone as company phone
          email: companyFormData.companyEmail,
          office_address: companyFormData.companyAddress,
          employee_count: companyFormData.employeeCount,
          industry_type: companyFormData.industryType,
        };

        await createCompany(companyData);
        toast.success('Owner and company created successfully');
      }

      // Clear localStorage items
      localStorage.removeItem('active_step');
      localStorage.removeItem('created_owner_id');
      localStorage.removeItem('edit_owner_data');

      // Redirect to owners list
      router.push('/dashboard/owners');
    } catch (err) {
      console.error('Error saving data:', err);
      toast.error(`Error saving data: ${err.message || err}`);
      setError(err.message || 'Failed to save data. Please try again.');
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

    // Clear general error
    if (error) {
      setError('');
    }
  };

  // Check if Continue button should be enabled
  const isContinueDisabled = () => {
    if (activeStep === 0) {
      // For owner step, check if email is verified (unless in edit mode)
      if (!isEdit && !otpState.isEmailVerified) {
        return true;
      }
      // Also check if basic required fields are filled
      return (
        !ownerFormData.fullName.trim() || !ownerFormData.email.trim() || !ownerFormData.phone.trim()
      );
    }
    return false;
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
            label="Full Name"
            value={ownerFormData.fullName}
            onChange={handleOwnerInputChange('fullName')}
            error={Boolean(ownerErrors.fullName)}
            helperText={ownerErrors.fullName}
            required
          />

          {/* Mobile Number */}
          <TextField
            fullWidth
            label="Mobile Number"
            value={ownerFormData.phone}
            onChange={handleOwnerInputChange('phone')}
            error={Boolean(ownerErrors.phone)}
            helperText={ownerErrors.phone}
            required
          />

          {/* Email with Send OTP Button */}
          <Box sx={{ position: 'relative' }}>
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
              sx={{
                '& .MuiInputBase-root': {
                  paddingRight: !isEdit ? '120px' : 'inherit',
                },
              }}
            />
            {!isEdit && (
              <Box
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                }}
              >
                {otpState.isEmailVerified ? (
                  <Chip
                    label="Verified"
                    color="success"
                    size="small"
                    icon={<CheckIcon />}
                    sx={{ fontWeight: 'medium' }}
                  />
                ) : !otpState.otpSent ? (
                  <Button
                    size="small"
                    onClick={handleSendOTP}
                    disabled={otpState.isSending || !ownerFormData.email}
                    variant="contained"
                    sx={{
                      minWidth: '90px',
                      height: '32px',
                      fontSize: '0.75rem',
                      fontWeight: 'medium',
                      textTransform: 'none',
                      borderRadius: '6px',
                    }}
                  >
                    {otpState.isSending ? (
                      <>
                        <CircularProgress size={14} sx={{ mr: 0.5 }} />
                        Sending...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                ) : null}
              </Box>
            )}
          </Box>

          {/* OTP Verification Section - Only show after OTP is sent and not in edit mode */}
          {!isEdit && otpState.otpSent && !otpState.isEmailVerified && (
            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
              <Paper
                sx={{
                  p: 3,
                  mt: 1,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Enter Verification Code
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please enter the 6-digit code sent to {ownerFormData.email}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 3 }}>
                  {otpState.otp.map((digit, index) => (
                    <TextField
                      key={index}
                      id={`otp-${index}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      inputProps={{
                        maxLength: 1,
                        style: {
                          textAlign: 'center',
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                        },
                      }}
                      sx={{
                        width: 48,
                        '& .MuiOutlinedInput-root': {
                          height: 48,
                          borderRadius: '8px',
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main',
                            },
                          },
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main',
                              borderWidth: '2px',
                            },
                          },
                        },
                      }}
                      error={Boolean(otpState.otpError)}
                    />
                  ))}
                </Box>

                {otpState.otpError && (
                  <Typography
                    color="error"
                    variant="body2"
                    sx={{ textAlign: 'center', mb: 2, fontWeight: 'medium' }}
                  >
                    {otpState.otpError}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={handleVerifyOTP}
                    disabled={otpState.isVerifying || otpState.otp.join('').length !== 6}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontWeight: 'medium',
                      textTransform: 'none',
                      borderRadius: '8px',
                    }}
                    startIcon={otpState.isVerifying ? <CircularProgress size={16} /> : null}
                  >
                    {otpState.isVerifying ? 'Verifying...' : 'Verify Code'}
                  </Button>

                  <Button
                    variant="text"
                    onClick={handleResendOTP}
                    disabled={otpState.resendTimer > 0}
                    sx={{
                      px: 2,
                      py: 1.5,
                      fontWeight: 'medium',
                      textTransform: 'none',
                      borderRadius: '8px',
                    }}
                  >
                    {otpState.resendTimer > 0
                      ? `Resend in ${otpState.resendTimer}s`
                      : 'Resend Code'}
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Show edit mode indicator */}
          {isEdit && (
            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
              <Alert severity="info" sx={{ mt: 2 }}>
                You are editing existing owner information.
                {!hasExistingCompany && ' No company found - a new company will be created.'}
                {hasExistingCompany && ' Existing company information will be updated.'}
              </Alert>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );

  const renderCompanyStep = () => (
    <Box>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Company Information
          {isEdit && !hasExistingCompany && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Creating new company for this owner
            </Typography>
          )}
          {isEdit && hasExistingCompany && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Updating existing company information
            </Typography>
          )}
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
            rows={2}
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

  // Don't render until initialized to avoid hydration errors
  if (!isInitialized) {
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

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
            endIcon={
              isSubmitting ? <CircularProgress size={16} /> : isEdit ? <SaveIcon /> : <CheckIcon />
            }
            variant="contained"
          >
            {isSubmitting
              ? isEdit
                ? hasExistingCompany
                  ? 'Updating...'
                  : 'Creating Company...'
                : 'Creating Account...'
              : isEdit
                ? hasExistingCompany
                  ? 'Update Account'
                  : 'Create Company & Update Owner'
                : 'Create Account'}
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained" disabled={isContinueDisabled()}>
            Continue
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default Page;
