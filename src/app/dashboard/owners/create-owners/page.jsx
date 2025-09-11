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
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Check as CheckIcon } from '@mui/icons-material';
import { sendOwnerOTP, verifyOwnerOTP, createCompany } from 'src/auth/services/ownerCompanyService';
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
  const [activeStep, setActiveStep] = useState(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem('active_step')) || 0;
    }
    return 0;
  });

  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [createdOwnerId, setCreatedOwnerId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('created_owner_id') || null;
    }
    return null;
  });

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

          // For edit mode, combine first and last name into fullName
          const fullName =
            `${parsedEditData.owner.firstName || ''} ${parsedEditData.owner.lastName || ''}`.trim();

          // Populate owner form data
          setOwnerFormData({
            fullName: fullName,
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

          // Skip OTP verification for edit mode
          setOtpState((prev) => ({ ...prev, isEmailVerified: true }));
        } catch (error) {
          toast.error(`Error parsing edit data: ${error}`);
          setError('Error loading edit data');
        }
      }
    } else {
      // Reset form for new creation
      setIsEdit(false);
      setEditId(null);
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
      setActiveStep(0);
      localStorage.setItem('active_step', 0);
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

      setOtpState((prev) => ({
        ...prev,
        otpSent: true,
        isSending: false,
        resendTimer: 60,
        otp: ['', '', '', '', '', ''],
      }));
    } catch (err) {
      toast.error(`OTP send error: ${err}`);
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

      setOtpState((prev) => ({
        ...prev,
        isEmailVerified: true,
        isVerifying: false,
      }));
    } catch (err) {
      toast.error(`OTP verification error: ${err}`);
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

  useEffect(() => {
    if (createdOwnerId) {
      localStorage.setItem('created_owner_id', createdOwnerId);
    }
  }, [createdOwnerId]);

  useEffect(() => {
    localStorage.setItem('active_step', activeStep);
  }, [activeStep]);

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
        const existingOwners = JSON.parse(localStorage.getItem('owners') || '[]');
        const nameParts = ownerFormData.fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const updatedOwners = existingOwners.map((owner) => {
          if (owner.id === editId) {
            return {
              ...owner,
              firstName: firstName,
              lastName: lastName,
              name: ownerFormData.fullName,
              email: ownerFormData.email,
              phone: ownerFormData.phone,
              company: companyFormData.companyName,
              companyData: companyFormData,
            };
          }
          return owner;
        });

        localStorage.setItem('owners', JSON.stringify(updatedOwners));
        localStorage.removeItem('edit_owner_data');

        toast.success('Owner updated successfully');
      } else {
        // --- CREATE FLOW ---
        const ownerId = createdOwnerId || localStorage.getItem('created_owner_id');
        if (!ownerId) {
          throw new Error('Owner ID not found. Please try the process again.');
        }

        // Save createdOwnerId to localStorage for persistence
        localStorage.setItem('created_owner_id', ownerId);

        const companyData = {
          name: companyFormData.companyName,
          owner_id: ownerId,
          website: companyFormData.companyURL,
          email: companyFormData.companyEmail,
          office_address: companyFormData.companyAddress,
          employee_count: companyFormData.employeeCount,
          industry_type: companyFormData.industryType,
        };

        await createCompany(companyData);

        toast.success('Owner created successfully');
      }
      localStorage.removeItem('active_step');
      // Redirect to owners list after toast
      router.push('/dashboard/owners');
    } catch (err) {
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
            disabled={isEdit}
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
            disabled={isEdit}
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
              disabled={(!isEdit && otpState.isEmailVerified) || isEdit}
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
                  // Only show Send OTP button when OTP hasn't been sent yet
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
                    {otpState.isSending ? 'Sending...' : 'Send OTP'}
                  </Button>
                ) : null}
              </Box>
            )}
          </Box>

          {/* Verified OTP - Only show after OTP is sent */}
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
          <Button onClick={handleNext} variant="contained" disabled={isContinueDisabled()}>
            Continue
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default Page;
