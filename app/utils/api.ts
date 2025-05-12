import { API_ENDPOINTS } from '../config/api';
import { 
  LoginRequest, 
  RegisterRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  AuthResponse,
  MessageResponse
} from '../types/auth';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'same-origin',
      mode: 'cors',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        error: errorData.message || `Ошибка сервера: ${response.status} ${response.statusText}` 
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