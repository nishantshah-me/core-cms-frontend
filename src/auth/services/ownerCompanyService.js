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
    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
  };
};

/**
 * Send OTP to both email and phone for owner verification
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
 * Verify OTP and create/update owner
 * @param {Object} data - { username, email, phone, email_otp, phone_otp, owner_id? }
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
 * Update owner (username only - no OTP required)
 * @param {Object} data - { owner_id, username }
 */
export async function updateOwnerUsernameOnly(data) {
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
    throw new Error('Failed to update owner. Please try again.');
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
 * Get list of company owners with pagination
 * @param {number} skip - Number of records to skip
 * @param {number} limit - Number of records to fetch
 */
export async function getCompanyOwners(skip = 0, limit = 100) {
  try {
    const response = await apiClient({
      method: 'GET',
      url: `${BASE_URL}${endpoints.company.get_company_owners}?skip=${skip}&limit=${limit}`,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    throw new Error('Failed to fetch owners. Please try again.');
  }
}

/**
 * Get list of companies with pagination
 * @param {number} skip - Number of records to skip
 * @param {number} limit - Number of records to fetch
 */
export async function getCompanyList(skip = 0, limit = 100) {
  try {
    const response = await apiClient({
      method: 'GET',
      url: `${BASE_URL}${endpoints.company.company_list}?skip=${skip}&limit=${limit}`,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    throw new Error('Failed to fetch companies. Please try again.');
  }
}

/**
 * Delete owner
 * @param {string} ownerId - Owner UUID
 */
export async function deleteOwner(ownerId) {
  try {
    const response = await apiClient({
      method: 'DELETE',
      url: `${BASE_URL}${endpoints.company.delete_company_owner}/${ownerId}`,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    if (error?.detail) {
      throw new Error(error.detail);
    }
    throw new Error('Failed to delete owner. Please try again.');
  }
}

/**
 * Update company information
 * @param {number} companyId - Company ID
 * @param {Object} data - Company data
 */
export async function updateCompany(companyId, data) {
  try {
    const response = await apiClient({
      method: 'PATCH',
      url: `${BASE_URL}${endpoints.company.update_company}/${companyId}`,
      data,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    if (error?.detail) {
      throw new Error(error.detail);
    }
    throw new Error('Failed to update company. Please try again.');
  }
}

/**
 * Delete company
 * @param {number} companyId - Company ID
 */
export async function deleteCompany(companyId) {
  try {
    const response = await apiClient({
      method: 'DELETE',
      url: `${BASE_URL}${endpoints.company.delete_company}/${companyId}`,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    if (error?.detail) {
      throw new Error(error.detail);
    }
    throw new Error('Failed to delete company. Please try again.');
  }
}

/**
 * Fetch owner by id using new endpoint and map to UI-friendly structure
 * @param {string} ownerId
 */
export async function getOwnerById(ownerId) {
  if (!ownerId) throw new Error('ownerId is required');

  try {
    const response = await apiClient({
      method: 'GET',
      url: `${BASE_URL}${endpoints.company.get_company_owner(ownerId)}`,
      headers: getAuthHeaders(),
    });

    // response is the raw owner object
    const owner = response;
    if (!owner || !owner.id) {
      const e = new Error('Owner not found');
      e.code = 'NOT_FOUND';
      throw e;
    }

    // take first company (if any) as default
    const firstCompany = Array.isArray(owner.companies) ? owner.companies[0] : null;

    const formatted = {
      id: owner.id,
      name: owner.username || '-',
      firstName: owner.username?.split(' ')[0] || '',
      lastName: owner.username?.split(' ').slice(1).join(' ') || '',
      email: owner.email || '-',
      phone: owner.phone || '-',
      isEmailVerified: owner.is_email_verified || false,
      isPhoneVerified: owner.is_phone_verified || false,
      companyCount: owner.company_count || 0,
      totalEmployeeCount: owner.total_employee_count || 0,
      companyId: firstCompany?.company_id ?? firstCompany?.id ?? null,
      companyData: firstCompany
        ? {
            id: firstCompany.company_id ?? firstCompany.id,
            name: firstCompany.name ?? '',
            phone: firstCompany.phone ?? '',
            email: firstCompany.email ?? '',
            office_address: firstCompany.office_address ?? '',
            website: firstCompany.website ?? firstCompany.created_at ?? '',
            industry_type: firstCompany.industry_type ?? '',
            employee_range: firstCompany.employee_count_range ?? '',
            employee_count: firstCompany.employees_count ?? firstCompany.employee_count ?? 0,
          }
        : null,
      ownerData: owner,
    };

    return formatted;
  } catch (err) {
    // bubble up (you may customize error handling)
    console.error('getOwnerById error', err);
    throw err;
  }
}

export async function getCompanyById(companyId) {
  if (!companyId) throw new Error('companyId is required');

  try {
    const response = await apiClient({
      method: 'GET',
      url: `${BASE_URL}${endpoints.company.get_company(companyId)}`,
      headers: getAuthHeaders(),
    });
    return response;
  } catch (err) {
    console.error('getCompanyById error', err);
    throw err;
  }
}

/**
 * Fetch owners with their companies (backend now includes companies in the response)
 * @param {number} skip - Number of records to skip
 * @param {number} limit - Number of records per page
 */
export async function getOwnersWithCompanies(skip = 0, limit = 10) {
  try {
    const response = await apiClient({
      method: 'GET',
      url: `${BASE_URL}${endpoints.company.get_company_owners}?skip=${skip}&limit=${limit}`,
      headers: getAuthHeaders(),
    });

    const { data = [], total = 0 } = response || {};

    const formattedData = data.map((owner) => ({
      id: owner.id,
      name: owner.username || '-',
      email: owner.email || '-',
      phone: owner.phone || '-',
      companyCount: owner.company_count || 0,
      ownerData: owner,
    }));

    return {
      data: formattedData,
      total,
    };
  } catch (error) {
    console.error('Error fetching owners with companies:', error);
    return {
      data: [],
      total: 0,
    };
  }
}
