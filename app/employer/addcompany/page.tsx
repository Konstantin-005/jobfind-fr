'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '../../config/api';
import CompanyForm from '../components/CompanyForm';

export default function AddCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Check if company profile exists
        const response = await fetch(API_ENDPOINTS.companies.profile, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (response.status === 404) {
          // No profile found - good, can create one
          setAuthorized(true);
        } else if (response.ok) {
          // Profile exists - redirect to edit
          router.push('/employer/mycompany');
        } else if (response.status === 401) {
          router.push('/login');
        } else {
           // Some other error, assume authorized to try
           setAuthorized(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Проверка доступа...</div>;
  }

  if (!authorized) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
         <CompanyForm mode="create" />
      </div>
    </div>
  );
}
