import { useEffect, useState } from 'react';

// В реальном проекте здесь будет логика получения пользователя из localStorage, cookie или контекста
export type UserRole = 'guest' | 'job_seeker' | 'employer';

export function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  
  // exp в JWT хранится в секундах, а Date.now() возвращает миллисекунды
  return decoded.exp * 1000 < Date.now();
}

export function useUser(): { role: UserRole; logout: () => void; isLoading: boolean } {
  const [role, setRole] = useState<UserRole>('guest');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function updateRole() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const userType = typeof window !== 'undefined' ? localStorage.getItem('user_type') : null;
      
      // Проверяем наличие и валидность токена
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_type');
        setRole('guest');
        setIsLoading(false);
        return;
      }

      if (!userType) {
        setRole('guest');
        setIsLoading(false);
        return;
      }
      if (userType === 'job_seeker') setRole('job_seeker');
      else if (userType === 'employer') setRole('employer');
      else setRole('guest');
      
      setIsLoading(false);
    }
    updateRole();
    window.addEventListener('storage', updateRole);
    return () => window.removeEventListener('storage', updateRole);
  }, []);

  // Для обновления роли после логина/логаута в этом же окне
  useEffect(() => {
    const interval = setInterval(() => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const userType = typeof window !== 'undefined' ? localStorage.getItem('user_type') : null;
      
      // Проверяем наличие и валидность токена
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_type');
        setRole('guest');
        return;
      }

      const newRole: UserRole =
        !userType ? 'guest' :
        userType === 'job_seeker' ? 'job_seeker' :
        userType === 'employer' ? 'employer' : 'guest';
      setRole(prev => prev !== newRole ? newRole : prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    setRole('guest');
  }

  return { role, logout, isLoading };
}