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
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  sendOwnerOTP,
  verifyOwnerOTP,
  updateOwnerUsernameOnly,
  createCompany,
  updateCompany,
  getOwnerById,
  getCompanyById, // Add this import
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
  const [editCompanyData, setEditCompanyData] = useState(null); // Add this state
  const [hasExistingCompany, setHasExistingCompany] = useState(false);
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingEditData, setIsLoadingEditData] = useState(false);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false); // Add this state

  // Store original values for change detection
  const [originalOwnerData, setOriginalOwnerData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [originalCompanyData, setOriginalCompanyData] = useState({
    companyName: '',
    industryType: '',
    companyEmail: '',
    companyAddress: '',
    employeeCount: '',
    companyURL: '',
  }); // Add this state

  // Owner state
  const [ownerFormData, setOwnerFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [ownerErrors, setOwnerErrors] = useState({});

  // Enhanced OTP states
  const [otpState, setOtpState] = useState({
    isEmailVerified: false,
    isPhoneVerified: false,
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

  // Helper function to detect field changes
  const getChangedFields = () => {
    if (!isEdit) return { email: true, phone: true, username: true };

    return {
      email: originalOwnerData.email !== ownerFormData.email,
      phone: originalOwnerData.phone !== ownerFormData.phone,
      username: originalOwnerData.fullName !== ownerFormData.fullName,
    };
  };

  // Helper function to detect company field changes
  const getChangedCompanyFields = () => {
    if (!isEdit || !hasExistingCompany) return true; // All fields are new

    return {
      companyName: originalCompanyData.companyName !== companyFormData.companyName,
      industryType: originalCompanyData.industryType !== companyFormData.industryType,
      companyEmail: originalCompanyData.companyEmail !== companyFormData.companyEmail,
      companyAddress: originalCompanyData.companyAddress !== companyFormData.companyAddress,
      employeeCount: originalCompanyData.employeeCount !== companyFormData.employeeCount,
      companyURL: originalCompanyData.companyURL !== companyFormData.companyURL,
    };
  };

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

  // Load edit data from API when in edit mode
  const loadEditDataFromAPI = async (ownerId) => {
    try {
      setIsLoadingEditData(true);
      setError('');

      const ownerData = await getOwnerById(ownerId);

      if (!ownerData) {
        throw new Error('Owner not found');
      }

      setEditOwnerData(ownerData);

      // Check if company exists
      const companyExists = ownerData.companyData && ownerData.companyData.id;
      setHasExistingCompany(companyExists);

      // Populate owner form data
      const ownerFormValues = {
        fullName: ownerData.name || '',
        email: ownerData.email || '',
        phone: ownerData.phone || '',
      };

      setOwnerFormData(ownerFormValues);
      // Store original data for change detection
      setOriginalOwnerData(ownerFormValues);

      // Initialize company form data (will be populated later when company step is accessed)
      if (companyExists) {
        // Set initial company data from owner response as fallback
        const initialCompanyData = {
          companyName: ownerData.companyData.name || '',
          industryType: ownerData.companyData.industry_type || '',
          companyEmail: ownerData.companyData.email || '',
          companyAddress: ownerData.companyData.office_address || '',
          employeeCount:
            ownerData.companyData.employee_range || ownerData.companyData.employee_count || '',
          companyURL: ownerData.companyData.website || '',
        };
        setCompanyFormData(initialCompanyData);
        setOriginalCompanyData(initialCompanyData);
      } else {
        // Reset company form for owners without companies
        const newCompanyData = {
          companyName: '',
          industryType: '',
          companyEmail: ownerData.email || '', // Pre-fill with owner email
          companyAddress: '',
          employeeCount: '',
          companyURL: '',
        };
        setCompanyFormData(newCompanyData);
        setOriginalCompanyData(newCompanyData);
      }

      // For edit mode, initially assume verified (will change if fields are modified)
      setOtpState((prev) => ({
        ...prev,
        isEmailVerified: true,
        isPhoneVerified: true,
      }));
    } catch (error_) {
      console.error('Error loading edit data from API:', error_);
      toast.error(`Error loading owner data: ${error_.message}`);
      setError(error_.message || 'Failed to load owner data');

      // Redirect back to list if owner not found
      if (error_.code === 'NOT_FOUND' || error_.message.includes('not found')) {
        setTimeout(() => {
          router.push('/dashboard/owners');
        }, 2000);
      }
    } finally {
      setIsLoadingEditData(false);
    }
  };

  // Load company data specifically when accessing company step in edit mode
  const loadCompanyDataForEdit = async () => {
    if (!isEdit || !hasExistingCompany || !editOwnerData?.companyData?.id || editCompanyData) {
      return; // Skip if not edit mode, no company, or already loaded
    }

    try {
      setIsLoadingCompanyData(true);
      setError('');

      const companyData = await getCompanyById(editOwnerData.companyData.id);

      if (!companyData) {
        throw new Error('Company not found');
      }

      setEditCompanyData(companyData);

      // Populate company form data with fresh data from API
      const companyFormValues = {
        companyName: companyData.name || '',
        industryType: companyData.industry_type || '',
        companyEmail: companyData.email || '',
        companyAddress: companyData.office_address || '',
        employeeCount: companyData.employee_count_range || companyData.employee_count || '',
        companyURL: companyData.website || '',
      };

      setCompanyFormData(companyFormValues);
      setOriginalCompanyData(companyFormValues);
    } catch (error_) {
      console.error('Error loading company data from API:', error_);
      toast.error(`Error loading company data: ${error_.message}`);
      setError(error_.message || 'Failed to load company data');
    } finally {
      setIsLoadingCompanyData(false);
    }
  };

  // Handle edit mode and load data
  useEffect(() => {
    if (!isInitialized) return;

    const editParam = searchParams.get('edit');
    if (editParam) {
      setIsEdit(true);
      // Load data from API instead of localStorage
      loadEditDataFromAPI(editParam);
    } else {
      // Reset form for new creation
      setIsEdit(false);
      setEditOwnerData(null);
      setEditCompanyData(null);
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
      setOriginalOwnerData({
        fullName: '',
        email: '',
        phone: '',
      });
      setOriginalCompanyData({
        companyName: '',
        industryType: '',
        companyEmail: '',
        companyAddress: '',
        employeeCount: '',
        companyURL: '',
      });
      setOtpState({
        isEmailVerified: false,
        isPhoneVerified: false,
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
    }
  }, [searchParams, isInitialized]);

  // Load company data when stepping to company step in edit mode
  useEffect(() => {
    if (activeStep === 1 && isEdit && hasExistingCompany) {
      loadCompanyDataForEdit();
    }
  }, [activeStep, isEdit, hasExistingCompany]);

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

    // Enhanced change detection for edit mode
    if (isEdit) {
      const changedFields = {
        email:
          field === 'email'
            ? originalOwnerData.email !== value
            : originalOwnerData.email !== ownerFormData.email,
        phone:
          field === 'phone'
            ? originalOwnerData.phone !== value
            : originalOwnerData.phone !== ownerFormData.phone,
        username:
          field === 'fullName'
            ? originalOwnerData.fullName !== value
            : originalOwnerData.fullName !== ownerFormData.fullName,
      };

      // Reset verification status if email or phone changes
      if (
        (field === 'email' && changedFields.email) ||
        (field === 'phone' && changedFields.phone)
      ) {
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
    } else {
      // For new creation, reset verification if email or phone changes
      if (field === 'email' || field === 'phone') {
        setOtpState((prev) => ({
          ...prev,
          isEmailVerified: false,
          isPhoneVerified: false,
          otpSent: false,
          emailOtp: ['', '', '', '', '', ''],
          phoneOtp: ['', '', '', '', '', ''],
          otpError: '',
        }));
      }
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
    const changedFields = getChangedFields();

    // Validation
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

    // Check if OTP is actually needed
    if (isEdit && !changedFields.email && !changedFields.phone) {
      toast.info('No changes detected in email or phone number');
      return;
    }

    setOtpState((prev) => ({ ...prev, isSending: true, otpError: '' }));
    setError('');

    try {
      const otpData = {
        owner_id: isEdit ? editOwnerData.id : undefined,
      };

      if (!isEdit || changedFields.email) {
        otpData.email = ownerFormData.email.trim();
      }
      if (!isEdit || changedFields.phone) {
        otpData.phone = ownerFormData.phone.trim();
      }
      if (!isEdit || changedFields.username) {
        otpData.username = ownerFormData.fullName.trim();
      }

      await sendOwnerOTP(otpData);

      const message = isEdit
        ? `OTP sent for verification of changed ${Object.keys(changedFields)
            .filter((key) => changedFields[key])
            .join(' and ')}`
        : 'OTP sent to both email and phone successfully';

      toast.success(message);

      setOtpState((prev) => ({
        ...prev,
        otpSent: true,
        isSending: false,
        resendTimer: 60,
        emailOtp: ['', '', '', '', '', ''],
        phoneOtp: ['', '', '', '', '', ''],
        needsEmailVerification: !isEdit || changedFields.email,
        needsPhoneVerification: !isEdit || changedFields.phone,
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

  const handleVerifyOTP = async () => {
    const changedFields = getChangedFields();
    const emailOtpValue = otpState.emailOtp.join('');
    const phoneOtpValue = otpState.phoneOtp.join('');

    const needsEmailOTP = !isEdit || changedFields.email;
    const needsPhoneOTP = !isEdit || changedFields.phone;

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
      const verifyData = {
        owner_id: isEdit ? editOwnerData.id : undefined,
      };

      if (needsEmailOTP) {
        verifyData.email = ownerFormData.email.trim();
        verifyData.email_otp = emailOtpValue;
      }
      if (needsPhoneOTP) {
        verifyData.phone = ownerFormData.phone.trim();
        verifyData.phone_otp = phoneOtpValue;
      }
      if (!isEdit || changedFields.username) {
        verifyData.username = ownerFormData.fullName.trim();
      }

      const response = await verifyOwnerOTP(verifyData);

      if (response.owner_id) {
        setCreatedOwnerId(response.owner_id);
      }

      const message = isEdit
        ? 'Owner information updated and verified successfully'
        : 'Email and phone verified successfully';
      toast.success(message);

      setOtpState((prev) => ({
        ...prev,
        isEmailVerified: true,
        isPhoneVerified: true,
        isVerifying: false,
      }));

      setOriginalOwnerData({ ...ownerFormData });
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

    if (!isEdit) {
      if (!otpState.isEmailVerified || !otpState.isPhoneVerified) {
        if (!otpState.isEmailVerified) {
          newErrors.email = 'Please verify your email address';
        }
        if (!otpState.isPhoneVerified) {
          newErrors.phone = 'Please verify your phone number';
        }
      }
    } else {
      if (changedFields.email && !otpState.isEmailVerified) {
        newErrors.email = 'Please verify your new email address';
      }
      if (changedFields.phone && !otpState.isPhoneVerified) {
        newErrors.phone = 'Please verify your new phone number';
      }
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
      if (!validateOwnerForm()) {
        return;
      }

      if (isEdit) {
        const changedFields = getChangedFields();

        if (!changedFields.username && !changedFields.email && !changedFields.phone) {
          setActiveStep((prevActiveStep) => prevActiveStep + 1);
          return;
        }

        try {
          setIsSubmitting(true);

          if (changedFields.username && !changedFields.email && !changedFields.phone) {
            const ownerUpdateData = {
              owner_id: editOwnerData.id,
              username: ownerFormData.fullName.trim(),
            };

            await updateOwnerUsernameOnly(ownerUpdateData);
            toast.success('Owner name updated successfully');

            setOriginalOwnerData({ ...ownerFormData });
          } else if (changedFields.email || changedFields.phone) {
            if (!otpState.isEmailVerified || !otpState.isPhoneVerified) {
              toast.error('Please verify the changed email/phone with OTP before continuing');
              setIsSubmitting(false);
              return;
            }
            toast.success('Owner information updated successfully');
          }

          setIsSubmitting(false);
        } catch (err) {
          console.error('Error updating owner:', err);
          toast.error(`Error updating owner: ${err.message || err}`);
          setError(err.message || 'Failed to update owner. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFinalSubmit = async () => {
    if (!validateCompanyForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const changedCompanyFields = getChangedCompanyFields();
      const hasCompanyChanges =
        typeof changedCompanyFields === 'object'
          ? Object.values(changedCompanyFields).some(Boolean)
          : changedCompanyFields;

      if (isEdit) {
        if (hasExistingCompany && editOwnerData.companyData?.id) {
          if (hasCompanyChanges) {
            const companyUpdateData = {
              name: companyFormData.companyName,
              website: companyFormData.companyURL,
              phone: ownerFormData.phone,
              email: companyFormData.companyEmail,
              office_address: companyFormData.companyAddress,
              employee_count: companyFormData.employeeCount,
              industry_type: companyFormData.industryType,
            };

            await updateCompany(editOwnerData.companyData.id, companyUpdateData);
            toast.success('Company information updated successfully');
          } else {
            console.log('No changes detected in company information');
          }
        } else {
          const companyData = {
            owner_id: editOwnerData.id,
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
        const ownerId = createdOwnerId;
        if (!ownerId) {
          throw new Error('Owner ID not found. Please try the process again.');
        }

        const companyData = {
          owner_id: ownerId,
          name: companyFormData.companyName,
          website: companyFormData.companyURL,
          phone: ownerFormData.phone,
          email: companyFormData.companyEmail,
          office_address: companyFormData.companyAddress,
          employee_count: companyFormData.employeeCount,
          industry_type: companyFormData.industryType,
        };

        await createCompany(companyData);
        toast.success('Owner and company created successfully');
      }

      localStorage.removeItem('active_step');
      localStorage.removeItem('created_owner_id');
      localStorage.removeItem('edit_owner_data');

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

    if (error) {
      setError('');
    }
  };

  const isContinueDisabled = () => {
    if (activeStep === 0) {
      const changedFields = getChangedFields();

      if (
        !ownerFormData.fullName.trim() ||
        !ownerFormData.email.trim() ||
        !ownerFormData.phone.trim()
      ) {
        return true;
      }

      if (!isEdit) {
        return !otpState.isEmailVerified || !otpState.isPhoneVerified;
      } else {
        if (changedFields.email && !otpState.isEmailVerified) return true;
        if (changedFields.phone && !otpState.isPhoneVerified) return true;
        return false;
      }
    }
    return false;
  };

  const shouldShowOTP = () => {
    if (!isEdit) return true;

    const changedFields = getChangedFields();
    return changedFields.email || changedFields.phone;
  };

  const shouldShowSendOTPButton = () => {
    if (!isEdit) return !otpState.otpSent;

    const changedFields = getChangedFields();
    const hasRelevantChanges = changedFields.email || changedFields.phone;

    return hasRelevantChanges && !otpState.otpSent;
  };

  const renderOTPSection = () => {
    if (!shouldShowOTP() || !otpState.otpSent) return null;

    const changedFields = getChangedFields();
    const needsEmailOTP = (!isEdit || changedFields.email) && !otpState.isEmailVerified;
    const needsPhoneOTP = (!isEdit || changedFields.phone) && !otpState.isPhoneVerified;

    if (!needsEmailOTP && !needsPhoneOTP) return null;

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

          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              label="Mobile Number"
              value={ownerFormData.phone}
              onChange={handleOwnerInputChange('phone')}
              error={Boolean(ownerErrors.phone)}
              helperText={ownerErrors.phone}
              required
              disabled={!isEdit && otpState.isPhoneVerified}
              sx={{
                '& .MuiInputBase-root': {
                  paddingRight:
                    (!isEdit && otpState.isPhoneVerified) ||
                    (isEdit && otpState.isPhoneVerified && !getChangedFields().phone)
                      ? '120px'
                      : 'inherit',
                },
              }}
            />
            {((!isEdit && otpState.isPhoneVerified) ||
              (isEdit && otpState.isPhoneVerified && !getChangedFields().phone)) && (
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
              disabled={!isEdit && otpState.isEmailVerified}
              sx={{
                '& .MuiInputBase-root': {
                  paddingRight:
                    (!isEdit && otpState.isEmailVerified) ||
                    (isEdit && otpState.isEmailVerified && !getChangedFields().email)
                      ? '120px'
                      : 'inherit',
                },
              }}
            />
            {((!isEdit && otpState.isEmailVerified) ||
              (isEdit && otpState.isEmailVerified && !getChangedFields().email)) && (
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

          {shouldShowSendOTPButton() && (
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
                  !ownerFormData.fullName
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
          )}

          {renderOTPSection()}

          {isEdit && (
            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
              <Alert severity="info" sx={{ mt: 2 }}>
                You are editing existing owner information.
                {!hasExistingCompany && ' No company found - a new company will be created.'}
                {hasExistingCompany && ' Existing company information will be updated.'}
                <br />
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  Note: If you change email or phone number, you will need to verify them with OTP.
                </Typography>
              </Alert>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );

  const renderCompanyStep = () => (
    <Box>
      {isLoadingCompanyData && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading company data...
          </Typography>
        </Box>
      )}
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
            disabled={isLoadingCompanyData}
          />
          <FormControl fullWidth error={Boolean(companyErrors.industryType)} required>
            <InputLabel>Industry Type</InputLabel>
            <Select
              value={companyFormData.industryType}
              onChange={handleCompanyInputChange('industryType')}
              label="Industry Type"
              disabled={isLoadingCompanyData}
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
            disabled={isLoadingCompanyData}
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
            disabled={isLoadingCompanyData}
          />
          <FormControl fullWidth error={Boolean(companyErrors.employeeCount)} required>
            <InputLabel>Employee Count</InputLabel>
            <Select
              value={companyFormData.employeeCount}
              onChange={handleCompanyInputChange('employeeCount')}
              label="Employee Count"
              disabled={isLoadingCompanyData}
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
            disabled={isLoadingCompanyData}
          />
        </Box>
      </Card>
    </Box>
  );

  // Show loading screen while initializing or loading edit data
  if (!isInitialized || isLoadingEditData) {
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
          {isLoadingEditData ? 'Loading owner data...' : 'Initializing...'}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mb: 4 }}>
        {activeStep === 0 && renderOwnerStep()}
        {activeStep === 1 && renderCompanyStep()}
      </Box>

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
            disabled={isSubmitting || isLoadingCompanyData}
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
