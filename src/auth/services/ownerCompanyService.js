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
 * Get a single owner with company data by owner ID
 * @param {string} ownerId - Owner UUID
 */
export async function getOwnerById(ownerId) {
  try {
    // First get all owners with companies and find the specific one
    // This is a temporary solution - ideally you'd create a specific API endpoint
    const ownersData = await getOwnersWithCompanies(0, 1000);
    const owner = ownersData.data.find((o) => o.id === ownerId);

    if (!owner) {
      throw new Error('Owner not found');
    }

    return owner;
  } catch (error) {
    console.error('Error fetching owner by ID:', error);
    throw error;
  }
}

/**
 * Combine owners and companies data for display with proper pagination
 * @param {number} skip - Number of records to skip
 * @param {number} limit - Number of records to fetch (default 10)
 */
export async function getOwnersWithCompanies(skip = 0, limit = 10) {
  try {
    const [ownersResponse, companiesResponse] = await Promise.all([
      getCompanyOwners(skip, limit),
      getCompanyList(0, 1000), // Get all companies to map with owners
    ]);

    const owners = ownersResponse?.data || [];
    const companies = companiesResponse?.data || [];
    const totalCount = ownersResponse?.total || 0;

    // If no data, return empty array with count
    if (owners.length === 0) {
      return {
        data: [],
        total: totalCount,
      };
    }

    // Create a map of companies for quick lookup by owner_id
    const companyMap = companies.reduce((map, company) => {
      map[company.owner_id] = company;
      return map;
    }, {});

    // Combine owner data with company information
    const combinedData = owners.map((owner) => {
      const company = companyMap[owner.id] || {};

      return {
        // Owner information
        id: owner.id, // Owner UUID
        firstName: owner.username?.split(' ')[0] || '',
        lastName: owner.username?.split(' ').slice(1).join(' ') || '',
        name: owner.username || '-',
        email: owner.email || '-',
        phone: owner.phone || '-',

        // Company information
        companyId: company.id || null, // Company ID (number) - can be null
        company: company.name || 'No Company',
        companyData: company.id
          ? {
              id: company.id,
              name: company.name || '',
              website: company.website || '',
              email: company.email || '',
              phone: company.phone || '',
              office_address: company.office_address || '',
              industry_type: company.industry_type || '',
              employee_count: company.employee_count || '',
            }
          : null, // Set to null if no company exists

        // Store complete owner and company data for editing
        ownerData: owner,
      };
    });

    return {
      data: combinedData,
      total: totalCount,
    };
  } catch (error) {
    console.error('Error fetching owners with companies:', error);
    // Return empty array with 0 count instead of throwing error for initial empty state
    return {
      data: [],
      total: 0,
    };
  }
}
