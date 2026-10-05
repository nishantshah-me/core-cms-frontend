// ----------------------------------------------------------------------

export function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message || error.name || 'An error occurred';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const errorMessage = error.message;
    if (typeof errorMessage === 'string') {
      return errorMessage;
    }
  }

  return `Unknown error: ${error}`;
}

// ----------------------------------------------------------------------

/**
 * Message for an axios error from the HRMS API: FastAPI's `detail` (string, or a list of validation
 * errors) when the server answered, a connectivity hint when it didn't, otherwise `fallback`.
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response) {
    const detail = error.response.data?.detail;

    if (typeof detail === 'string' && detail) return detail;
    if (Array.isArray(detail) && typeof detail[0]?.msg === 'string') return detail[0].msg;

    return fallback;
  }

  if (error?.request) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
