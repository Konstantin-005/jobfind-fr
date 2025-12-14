export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone_number?: string;
  password: string;
  user_type: 'job_seeker' | 'employer';
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
  new_email?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    user_id: string; // UUID
    email: string;
    user_type?: 'job_seeker' | 'employer';
  };
  user_type?: 'job_seeker' | 'employer';
}

export interface MessageResponse {
  message: string;
}

export interface LoginResponse {
  token: string;
  user: {
    user_id: string; // UUID
    name: string;
    email: string;
    user_type?: 'job_seeker' | 'employer';
  };
}

export interface RegisterResponse {
  token: string;
  user: {
    user_id: string; // UUID
    name: string;
    email: string;
    user_type?: 'job_seeker' | 'employer';
  };
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
} 