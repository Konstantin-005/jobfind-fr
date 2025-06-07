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
    professionsSearch: `${API_BASE_URL}/api/dictionaries/professions/search`,
    industries: `${API_BASE_URL}/api/dictionaries/industries`,
    citiesByIds: `${API_BASE_URL}/api/dictionaries/cities-by-ids`,
    regionsByIds: `${API_BASE_URL}/api/dictionaries/regions-by-ids`,
    companiesSearch: `${API_BASE_URL}/api/dictionaries/companies/search`,
    educationalInstitutionsSearch: `${API_BASE_URL}/api/dictionaries/educational-institutions/search`,
    specializationsSearch: `${API_BASE_URL}/api/dictionaries/specializations/search`,
  },
  resumes: {
    my: `${API_BASE_URL}/api/resumes/my`,
    create: `${API_BASE_URL}/api/resumes`,
    update: (resumeId: number) => `${API_BASE_URL}/api/resumes/${resumeId}`,
  },
  jobSeekerProfile: {
    create: `${API_BASE_URL}/api/job-seeker-profiles`,
    me: `${API_BASE_URL}/api/job-seeker-profiles/me`,
    update: `${API_BASE_URL}/api/job-seeker-profiles/me`,
  },
  citiesSearch: `${API_BASE_URL}/api/locations/cities/search`,
  RESUME_DELETE: (resumeId: number) => `/api/resumes/${resumeId}`,
}; 