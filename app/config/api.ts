export const API_BASE_URL = '';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
  },
  locations: `${API_BASE_URL}/api/locations/`,
  jobs: `${API_BASE_URL}/api/jobs`,
  jobById: (jobId: number) => `${API_BASE_URL}/api/jobs/${jobId}`,
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
    copy: (resumeId: number) => `${API_BASE_URL}/api/resumes/${resumeId}/copy`,
    delete: (resumeId: number) => `${API_BASE_URL}/api/resumes/${resumeId}`,
    workExperience: (resumeId: number, experienceId: number) => `${API_BASE_URL}/api/resumes/${resumeId}/work-experiences/${experienceId}`,
    createWorkExperience: (resumeId: number) => `${API_BASE_URL}/api/resumes/${resumeId}/work-experiences`,
    education: (resumeId: number, educationId: number) => `${API_BASE_URL}/api/resumes/${resumeId}/educations/${educationId}`,
    educations: (resumeId: number) => `${API_BASE_URL}/api/resumes/${resumeId}/educations`,
    createEducation: (resumeId: number) => `${API_BASE_URL}/api/resumes/${resumeId}/educations`,
  },
  jobSeekerProfile: {
    create: `${API_BASE_URL}/api/job-seeker-profiles`,
    me: `${API_BASE_URL}/api/job-seeker-profiles/me`,
    update: `${API_BASE_URL}/api/job-seeker-profiles/me`,
  },
  companies: {
    profile: `${API_BASE_URL}/api/companies/profile`,
    jobs: `${API_BASE_URL}/api/companies/jobs`,
    jobById: (jobId: number) => `${API_BASE_URL}/api/companies/jobs/${jobId}`,
  },
  // For Next.js API routes, we don't need to include the API_BASE_URL
  // as they are handled by the same server
  upload: '/api/upload',
  citiesSearch: `${API_BASE_URL}/api/locations/cities/search`,
};
 