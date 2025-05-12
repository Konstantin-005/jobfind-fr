export const API_BASE_URL = 'http://localhost:3000';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
  },
  locations: `${API_BASE_URL}/api/locations`,
  jobs: `${API_BASE_URL}/api/jobs`,
  dictionaries: {
    professions: `${API_BASE_URL}/api/dictionaries/professions`,
    industries: `${API_BASE_URL}/api/dictionaries/industries`,
    citiesByIds: `${API_BASE_URL}/api/dictionaries/cities-by-ids`,
    regionsByIds: `${API_BASE_URL}/api/dictionaries/regions-by-ids`,
  },
  resumes: {
    my: `${API_BASE_URL}/api/resumes/my`,
  },
}; 