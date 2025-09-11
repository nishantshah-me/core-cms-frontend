import toast from 'react-hot-toast';
import { apiClient } from 'src/api/apiClient';
import { endpoints } from 'src/api/endpoints';

const BASE_URL = 'https://api-dev.hexafoldtech.com';

/**
 * Get authentication headers with token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Send OTP to email for owner verification
 * @param {Object} data - { username, email, phone }
 */
export async function sendOwnerOTP(data) {
  try {
    const response = await apiClient({
      method: 'POST',
      url: `${BASE_URL}${endpoints.company.send_otp}`,
      data,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    // Handle specific error cases
    if (error?.detail === 'Email already exist') {
      throw new Error(
        'This email is already registered. Please use a different email or try to login.'
      );
    }
    throw error;
  }
}

/**
 * Verify OTP and create owner
 * @param {Object} data - { username, email, phone, otp }
 */
export async function verifyOwnerOTP(data) {
  try {
    const response = await apiClient({
      method: 'POST',
      url: `${BASE_URL}${endpoints.company.verify_otp}`,
      data,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    if (error?.detail) {
      throw new Error(error.detail);
    }
    throw new Error('OTP verification failed. Please try again.');
  }
}

/**
 * Create company information
 * @param {Object} data - Company data with owner_id
 */
export async function createCompany(data) {
  try {
    const response = await apiClient({
      method: 'POST',
      url: `${BASE_URL}${endpoints.company.create_company}`,
      data,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    if (error?.detail) {
      throw new Error(error.detail);
    }
    throw new Error('Failed to create company. Please try again.');
  }
}

/**
 * Get list of company owners
 */
export async function getCompanyOwners() {
  try {
    const response = await apiClient({
      method: 'GET',
      url: `${BASE_URL}${endpoints.company.get_company_owners}`,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    throw new Error('Failed to fetch owners. Please try again.');
  }
}

/**
 * Get list of companies
 */
export async function getCompanyList() {
  try {
    const response = await apiClient({
      method: 'GET',
      url: `${BASE_URL}${endpoints.company.company_list}`,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    throw new Error('Failed to fetch companies. Please try again.');
  }
}

/**
 * Combine owners and companies data for display
 */
export async function getOwnersWithCompanies() {
  try {
    const [ownersResponse, companiesResponse] = await Promise.all([
      getCompanyOwners(),
      getCompanyList(),
    ]);

    const owners = Array.isArray(ownersResponse) ? ownersResponse : [];
    const companies = Array.isArray(companiesResponse) ? companiesResponse : [];

    // If no owners, return empty array
    if (owners.length === 0) {
      return [];
    }

    // Create a map of companies for quick lookup
    const companyMap = companies.reduce((map, company) => {
      map[company.id] = company.name;
      return map;
    }, {});

    // Combine owner data with company names
    const combinedData = owners.map((owner) => ({
      id: owner.id,
      firstName: owner.username?.split(' ')[0] || '',
      lastName: owner.username?.split(' ').slice(1).join(' ') || '',
      name: owner.username || '-',
      email: owner.email || '-',
      phone: owner.phone || '-',
      company: companyMap[owner.company_id] || 'Unknown Company',
      companyId: owner.company_id,
      // Store complete owner data for potential future use
      ownerData: owner,
    }));

    return combinedData;
  } catch (error) {
    toast.error(`Error fetching owners with companies: ${error}`);
    // Return empty array instead of throwing error for initial empty state
    return [];
  }
}

/**
 * Delete owner (if delete endpoint is available)
 * Note: Add delete endpoint to backend if needed
 */
export async function deleteOwner(ownerId) {
  try {
    // This endpoint might need to be implemented in the backend
    const response = await apiClient({
      method: 'DELETE',
      url: `${BASE_URL}/company/company-owner/${ownerId}`,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    throw new Error('Failed to delete owner. Please try again.');
  }
}

/**
 * Update owner (if update endpoint is available)
 * Note: Add update endpoint to backend if needed
 */
export async function updateOwner(ownerId, data) {
  try {
    // This endpoint might need to be implemented in the backend
    const response = await apiClient({
      method: 'PUT',
      url: `${BASE_URL}/company/company-owner/${ownerId}`,
      data,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    throw new Error('Failed to update owner. Please try again.');
  }
}
