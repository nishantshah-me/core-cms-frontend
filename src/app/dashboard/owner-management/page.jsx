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
  TextField,
  Chip,
  Paper,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  sendOwnerOTP,
  verifyOwnerOTP,
  updateOwnerUsernameOnly,
  getOwnerById,
} from 'src/auth/services/ownerCompanyService';

const OwnerManagementPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ownerId = searchParams.get('owner_id');

  // State management
  const [ownerFormData, setOwnerFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [originalOwnerData, setOriginalOwnerData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [ownerErrors, setOwnerErrors] = useState({});
  const [otpState, setOtpState] = useState({
    isEmailVerified: true, // Assume verified initially in edit mode
    isPhoneVerified: true,
    otpSent: false,
    emailOtp: ['', '', '', '', '', ''],
    phoneOtp: ['', '', '', '', '', ''],
    isVerifying: false,
    isSending: false,
    resendTimer: 0,
    otpError: '',
    needsEmailVerification: false,
    needsPhoneVerification: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch owner data on mount
  useEffect(() => {
    async function loadOwnerData() {
      if (!ownerId) {
        setError('No owner specified');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const ownerData = await getOwnerById(ownerId);

        if (!ownerData) {
          throw new Error('Owner not found');
        }

        const ownerFormValues = {
          fullName: ownerData.name || '',
          email: ownerData.email || '',
          phone: ownerData.phone || '',
        };

        setOwnerFormData(ownerFormValues);
        setOriginalOwnerData(ownerFormValues);
      } catch (err) {
        console.error('Error loading owner data:', err);
        toast.error(`Error loading owner data: ${err.message}`);
        setError(err.message || 'Failed to load owner data');
        router.push('/dashboard/owners');
      } finally {
        setLoading(false);
      }
    }

    loadOwnerData();
  }, [ownerId, router]);

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

  // Helper function to detect field changes
  const getChangedFields = () => ({
    email: originalOwnerData.email !== ownerFormData.email,
    phone: originalOwnerData.phone !== ownerFormData.phone,
    username: originalOwnerData.fullName !== ownerFormData.fullName,
  });

  // Handle input changes
  const handleOwnerInputChange = (field) => (event) => {
    const value = event.target.value;
    setOwnerFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    const changedFields = getChangedFields();
    if ((field === 'email' && changedFields.email) || (field === 'phone' && changedFields.phone)) {
      setOtpState((prev) => ({
        ...prev,
        isEmailVerified: !changedFields.email,
        isPhoneVerified: !changedFields.phone,
        otpSent: false,
        emailOtp: ['', '', '', '', '', ''],
        phoneOtp: ['', '', '', '', '', ''],
        otpError: '',
      }));
    }

    if (ownerErrors[field]) {
      setOwnerErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }

    if (error) {
      setError('');
    }
  };

  // Send OTP
  const handleSendOTP = async () => {
    const changedFields = getChangedFields();

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

    if (!changedFields.email && !changedFields.phone) {
      toast.info('No changes detected in email or phone number');
      return;
    }

    setOtpState((prev) => ({ ...prev, isSending: true, otpError: '' }));
    setError('');

    try {
      const otpData = { owner_id: ownerId };
      if (changedFields.email) otpData.email = ownerFormData.email.trim();
      if (changedFields.phone) otpData.phone = ownerFormData.phone.trim();
      if (changedFields.username) otpData.username = ownerFormData.fullName.trim();

      await sendOwnerOTP(otpData);

      toast.success(
        `OTP sent for verification of changed ${Object.keys(changedFields)
          .filter((key) => changedFields[key])
          .join(' and ')}`
      );

      setOtpState((prev) => ({
        ...prev,
        otpSent: true,
        isSending: false,
        resendTimer: 60,
        emailOtp: ['', '', '', '', '', ''],
        phoneOtp: ['', '', '', '', '', ''],
        needsEmailVerification: changedFields.email,
        needsPhoneVerification: changedFields.phone,
      }));
    } catch (err) {
      console.error('OTP send error:', err);
      toast.error(`OTP send error: ${err.message}`);
      setError(err.message || 'Failed to send OTP. Please try again.');
      setOtpState((prev) => ({ ...prev, isSending: false }));
    }
  };

  // Handle OTP input
  const handleOtpChange = (type, index, value) => {
    if (value.length > 1) return;
    const otpKey = type === 'email' ? 'emailOtp' : 'phoneOtp';
    const newOtp = [...otpState[otpKey]];
    newOtp[index] = value;

    setOtpState((prev) => ({
      ...prev,
      [otpKey]: newOtp,
      otpError: '',
    }));

    if (value && index < 5) {
      const nextInput = document.getElementById(`${type}-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (type, index, event) => {
    const otpKey = type === 'email' ? 'emailOtp' : 'phoneOtp';
    if (event.key === 'Backspace' && !otpState[otpKey][index] && index > 0) {
      const prevInput = document.getElementById(`${type}-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const changedFields = getChangedFields();
    const emailOtpValue = otpState.emailOtp.join('');
    const phoneOtpValue = otpState.phoneOtp.join('');

    const needsEmailOTP = changedFields.email && !otpState.isEmailVerified;
    const needsPhoneOTP = changedFields.phone && !otpState.isPhoneVerified;

    if (needsEmailOTP && emailOtpValue.length !== 6) {
      setOtpState((prev) => ({
        ...prev,
        otpError: 'Please enter complete 6-digit email OTP',
      }));
      return;
    }

    if (needsPhoneOTP && phoneOtpValue.length !== 6) {
      setOtpState((prev) => ({
        ...prev,
        otpError: 'Please enter complete 6-digit phone OTP',
      }));
      return;
    }

    setOtpState((prev) => ({ ...prev, isVerifying: true, otpError: '' }));
    setError('');

    try {
      const verifyData = { owner_id: ownerId };
      if (needsEmailOTP) {
        verifyData.email = ownerFormData.email.trim();
        verifyData.email_otp = emailOtpValue;
      }
      if (needsPhoneOTP) {
        verifyData.phone = ownerFormData.phone.trim();
        verifyData.phone_otp = phoneOtpValue;
      }
      if (changedFields.username) {
        verifyData.username = ownerFormData.fullName.trim();
      }

      await verifyOwnerOTP(verifyData);
      toast.success('Owner information updated and verified successfully');

      setOtpState((prev) => ({
        ...prev,
        isEmailVerified: true,
        isPhoneVerified: true,
        isVerifying: false,
      }));
      setOriginalOwnerData({ ...ownerFormData });
      router.push(`/dashboard/owner-detail?owner_id=${ownerId}`);
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

  // Resend OTP
  const handleResendOTP = () => {
    if (otpState.resendTimer === 0) {
      handleSendOTP();
    }
  };

  // Validate form
  const validateOwnerForm = () => {
    const newErrors = {};
    const changedFields = getChangedFields();

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

    if (changedFields.email && !otpState.isEmailVerified) {
      newErrors.email = 'Please verify your new email address';
    }
    if (changedFields.phone && !otpState.isPhoneVerified) {
      newErrors.phone = 'Please verify your new phone number';
    }

    setOwnerErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateOwnerForm()) {
      return;
    }

    const changedFields = getChangedFields();
    if (!changedFields.username && !changedFields.email && !changedFields.phone) {
      toast.info('No changes detected');
      router.push(`/dashboard/owner-detail?owner_id=${ownerId}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (changedFields.username && !changedFields.email && !changedFields.phone) {
        await updateOwnerUsernameOnly({
          owner_id: ownerId,
          username: ownerFormData.fullName.trim(),
        });
        toast.success('Owner name updated successfully');
        setOriginalOwnerData({ ...ownerFormData });
        router.push(`/dashboard/owner-detail?owner_id=${ownerId}`);
      } else if (changedFields.email || changedFields.phone) {
        if (!otpState.isEmailVerified || !otpState.isPhoneVerified) {
          toast.error('Please verify the changed email/phone with OTP before continuing');
        } else {
          toast.success('Owner information updated successfully');
          router.push(`/dashboard/owner-detail?owner_id=${ownerId}`);
        }
      }
    } catch (err) {
      console.error('Error updating owner:', err);
      toast.error(`Error updating owner: ${err.message || err}`);
      setError(err.message || 'Failed to update owner. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render OTP section
  const renderOTPSection = () => {
    const changedFields = getChangedFields();
    const needsEmailOTP = changedFields.email && !otpState.isEmailVerified;
    const needsPhoneOTP = changedFields.phone && !otpState.isPhoneVerified;

    if (!otpState.otpSent || (!needsEmailOTP && !needsPhoneOTP)) return null;

    return (
      <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
        <Paper
          sx={{
            p: 4,
            mt: 2,
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>
              Enter Verification Code{needsEmailOTP && needsPhoneOTP ? 's' : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {needsEmailOTP && needsPhoneOTP
                ? 'Please enter the 6-digit codes sent to your email and phone'
                : needsEmailOTP
                  ? 'Please enter the 6-digit code sent to your email'
                  : 'Please enter the 6-digit code sent to your phone'}
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {needsEmailOTP && (
              <Grid item xs={12} md={needsPhoneOTP ? 6 : 8}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'medium' }}>
                    Email OTP
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Sent to: {ownerFormData.email}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                    {otpState.emailOtp.map((digit, index) => (
                      <TextField
                        key={index}
                        id={`email-otp-${index}`}
                        value={digit}
                        onChange={(e) => handleOtpChange('email', index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown('email', index, e)}
                        inputProps={{
                          maxLength: 1,
                          style: { textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold' },
                        }}
                        sx={{
                          width: 40,
                          '& .MuiOutlinedInput-root': { height: 40, borderRadius: '6px' },
                        }}
                        error={Boolean(otpState.otpError)}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}

            {needsPhoneOTP && (
              <Grid item xs={12} md={needsEmailOTP ? 6 : 8}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'medium' }}>
                    Phone OTP
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Sent to: {ownerFormData.phone}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                    {otpState.phoneOtp.map((digit, index) => (
                      <TextField
                        key={index}
                        id={`phone-otp-${index}`}
                        value={digit}
                        onChange={(e) => handleOtpChange('phone', index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown('phone', index, e)}
                        inputProps={{
                          maxLength: 1,
                          style: { textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold' },
                        }}
                        sx={{
                          width: 40,
                          '& .MuiOutlinedInput-root': { height: 40, borderRadius: '6px' },
                        }}
                        error={Boolean(otpState.otpError)}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>

          {otpState.otpError && (
            <Typography
              color="error"
              variant="body2"
              sx={{ textAlign: 'center', mb: 3, fontWeight: 'medium' }}
            >
              {otpState.otpError}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleVerifyOTP}
              disabled={
                otpState.isVerifying ||
                (needsEmailOTP && otpState.emailOtp.join('').length !== 6) ||
                (needsPhoneOTP && otpState.phoneOtp.join('').length !== 6)
              }
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 'medium',
                textTransform: 'none',
                borderRadius: '8px',
              }}
              startIcon={otpState.isVerifying ? <CircularProgress size={16} /> : null}
            >
              {otpState.isVerifying
                ? 'Verifying...'
                : `Verify ${needsEmailOTP && needsPhoneOTP ? 'Both Codes' : 'Code'}`}
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
              {otpState.resendTimer > 0 ? `Resend in ${otpState.resendTimer}s` : 'Resend Code'}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  };

  // Handle back navigation
  const handleBack = () => {
    router.push(`/dashboard/owner-detail?owner_id=${ownerId}`);
  };

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
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading owner data...
        </Typography>
      </Box>
    );
  }

  if (error) {
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
              onClick={handleBack}
              sx={{ cursor: 'pointer' }}
            >
              Owners
            </Link>
            <Typography color="text.primary">Edit Owner</Typography>
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
            Error
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ minWidth: 200 }}
          >
            Go Back to Owner Details
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link component="button" color="inherit" onClick={handleBack} sx={{ cursor: 'pointer' }}>
            Owners
          </Link>
          <Typography color="text.primary">Edit Owner</Typography>
        </Breadcrumbs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Edit Owner Information
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
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="Mobile Number"
                value={ownerFormData.phone}
                onChange={handleOwnerInputChange('phone')}
                error={Boolean(ownerErrors.phone)}
                helperText={ownerErrors.phone}
                required
                disabled={otpState.isPhoneVerified && !getChangedFields().phone}
                sx={{
                  '& .MuiInputBase-root': {
                    paddingRight:
                      otpState.isPhoneVerified && !getChangedFields().phone ? '120px' : 'inherit',
                  },
                }}
              />
              {otpState.isPhoneVerified && !getChangedFields().phone && (
                <Box
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                  }}
                >
                  <Chip
                    label="Verified"
                    color="success"
                    size="small"
                    icon={<CheckIcon />}
                    sx={{ fontWeight: 'medium' }}
                  />
                </Box>
              )}
            </Box>
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
                disabled={otpState.isEmailVerified && !getChangedFields().email}
                sx={{
                  '& .MuiInputBase-root': {
                    paddingRight:
                      otpState.isEmailVerified && !getChangedFields().email ? '120px' : 'inherit',
                  },
                }}
              />
              {otpState.isEmailVerified && !getChangedFields().email && (
                <Box
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                  }}
                >
                  <Chip
                    label="Verified"
                    color="success"
                    size="small"
                    icon={<CheckIcon />}
                    sx={{ fontWeight: 'medium' }}
                  />
                </Box>
              )}
            </Box>
            {getChangedFields().email || getChangedFields().phone ? (
              <Box
                sx={{
                  gridColumn: { xs: 'span 1', md: 'span 2' },
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleSendOTP}
                  disabled={
                    otpState.isSending ||
                    !ownerFormData.email ||
                    !ownerFormData.phone ||
                    !ownerFormData.fullName ||
                    otpState.otpSent
                  }
                  sx={{
                    minWidth: '200px',
                    height: '48px',
                    fontSize: '1rem',
                    fontWeight: 'medium',
                    textTransform: 'none',
                    borderRadius: '8px',
                  }}
                >
                  {otpState.isSending ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Sending OTP...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </Box>
            ) : null}
            {renderOTPSection()}
            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
              <Alert severity="info" sx={{ mt: 2 }}>
                You are editing existing owner information.
                <br />
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  Note: If you change email or phone number, you will need to verify them with OTP.
                </Typography>
              </Alert>
            </Box>
          </Box>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
          endIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          {isSubmitting ? 'Updating...' : 'Update Owner'}
        </Button>
      </Box>
    </Container>
  );
};

export default OwnerManagementPage;
