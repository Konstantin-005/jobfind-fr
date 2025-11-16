import { API_ENDPOINTS } from '../config/api';
import { 
  LoginRequest, 
  RegisterRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  AuthResponse,
  MessageResponse
} from '../types/auth';

type FileUploadResponse = {
  filePath: string;
  originalName: string;
  uuid: string;
  size: number;
  mimeType: string;
  fileName?: string;
};

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Get token from localStorage if we're in the browser
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include', // Changed from 'same-origin' to 'include' for CORS
      mode: 'cors',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        error: errorData.message || `Ошибка сервера: ${response.status} ${response.statusText}`,
        status: response.status
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return { 
        error: 'Сервер недоступен. Пожалуйста, проверьте подключение к интернету и убедитесь, что сервер запущен.' 
      };
    }
    return { 
      error: error instanceof Error ? error.message : 'Произошла неизвестная ошибка' 
    };
  }
}

export async function uploadFile(
  file: File,
  folder: 'companyLogo' | 'photo' = 'companyLogo'
): Promise<ApiResponse<FileUploadResponse>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  try {
    const response = await fetch(API_ENDPOINTS.upload, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let the browser set it with the correct boundary
      headers: {},
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        error: errorData.error || `Ошибка загрузки файла: ${response.status} ${response.statusText}` 
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('File upload error:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return { 
        error: 'Сервер недоступен. Пожалуйста, проверьте подключение к интернету.' 
      };
    }
    return { 
      error: error instanceof Error ? error.message : 'Произошла неизвестная ошибка при загрузке файла' 
    };
  }
}

export const authApi = {
  async login({ email, password }: LoginRequest) {
    return apiRequest<AuthResponse>(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register({ email, password, user_type }: RegisterRequest) {
    return apiRequest<AuthResponse>(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: JSON.stringify({ email, password, user_type }),
    });
  },

  async forgotPassword({ email }: ForgotPasswordRequest) {
    return apiRequest<MessageResponse>(API_ENDPOINTS.auth.forgotPassword, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword({ token, password }: ResetPasswordRequest) {
    return apiRequest<MessageResponse>(API_ENDPOINTS.auth.resetPassword, {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
};

export async function getMyResumes(token: string) {
  return apiRequest<any[]>(API_ENDPOINTS.resumes.my, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Jobs API
export type JobPosting = {
  job_id?: number;
  title: string;
  description?: string;
  // IDs/примитивы из swagger
  company_id?: number;
  company_address_id?: number;
  profession_id?: number;
  publication_city_id?: number;
  posted_by?: string; // UUID
  posted_date?: string;
  expiration_date?: string;

  // Статус и флаги
  is_active?: boolean;
  is_contract_possible?: boolean;

  // Зарплата
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_frequency?: string;
  salary_period?: string;
  salary_type?: string;

  // Условия труда
  employment_type?: string;
  experience_level?: string;
  work_experience?: string;
  work_format?: string;
  work_schedule?: string;
  hours_per_day?: string;
  shifts?: string;

  // Прочее
  created_at?: string;
  updated_at?: string;
};

export const jobsApi = {
  async listCompanyJobs(params?: { page?: number; page_size?: number; search?: string }) {
    const url = new URL(API_ENDPOINTS.companies.jobs);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
      });
    }
    return apiRequest<JobPosting[]>(url.toString(), { method: 'GET' });
  },

  async get(jobId: number) {
    return apiRequest<JobPosting>(API_ENDPOINTS.jobById(jobId), { method: 'GET' });
  },

  async create(data: JobPosting) {
    return apiRequest<JobPosting>(API_ENDPOINTS.jobs, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(jobId: number, data: Partial<JobPosting>) {
    return apiRequest<JobPosting>(API_ENDPOINTS.jobById(jobId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async remove(jobId: number) {
    return apiRequest<{}>(API_ENDPOINTS.jobById(jobId), { method: 'DELETE' });
  },
  async getCompanyJob(jobId: number) {
    return apiRequest<JobPosting>(API_ENDPOINTS.companies.jobById(jobId), { method: 'GET' });
  },
};