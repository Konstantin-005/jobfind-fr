'use client';

import { useState, useEffect, useRef, ChangeEvent, useRef as useReactRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '../../config/api';
import { uploadFile } from '../../utils/api';
import CityAutocomplete from '../../components/CityAutocomplete';


interface Industry {
  industry_id: number;
  name: string;
}

export default function AddCompanyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Auth check effect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking employer auth...');
        
        // Check token first
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Check if company profile exists
        const response = await fetch(API_ENDPOINTS.companies.profile, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        console.log('Company profile check status:', response.status);
        
        // If we get a 404, it means the user is authenticated as an employer but has no company profile
        if (response.status === 404) {
          console.log('No company profile found - allowing access to add company');
          setIsAuthorized(true);
          return;
        }

        // If we get a 200, the user already has a company profile
        if (response.ok) {
          console.log('Company profile exists, redirecting...');
          router.push('/employer/mycompany');
          return;
        }

        // For any other status, treat as unauthorized
        console.error('Unexpected status when checking company profile:', response.status);
        throw new Error('Not authorized');
      } catch (error) {
        console.error('Auth check failed:', error);
        // Redirect to login with a return URL
        if (typeof window !== 'undefined') {
          const returnUrl = encodeURIComponent(window.location.pathname);
          router.push(`/login?returnUrl=${returnUrl}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);
  
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    industry_id: [] as string[],
    website: '',
    logo: null as { path: string; originalName: string; uuid: string; url: string } | null,
    employees_count: '',
    founded_year: '',
    phone: '',
    email: '',
    inn: '',
    company_type: 'Организация',
    is_it_company: false,
    brand_name: ''
  });
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useReactRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addresses, setAddresses] = useState<{ city_id: string; address: string }[]>([
    { city_id: '', address: '' }
  ]);

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.dictionaries.industries);
        if (!response.ok) throw new Error('Не удалось загрузить индустрии');
        const data = await response.json();
        setIndustries(data);
      } catch (error) {
        console.error('Ошибка при загрузке индустрий:', error);
        setError('Не удалось загрузить список индустрий');
      }
    };

    fetchIndustries();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'industry_id') {
      // This will be handled by the checkbox change handler
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIndustryToggle = (industryId: string) => {
    setFormData(prev => {
      const currentIndustries = prev.industry_id as string[];
      const newIndustries = currentIndustries.includes(industryId)
        ? currentIndustries.filter(id => id !== industryId)
        : [...currentIndustries, industryId];
      
      return {
        ...prev,
        industry_id: newIndustries,
      };
    });
  };

  const handleAddAddress = () => {
    setAddresses(prev => [...prev, { city_id: '', address: '' }]);
  };

  const handleRemoveAddress = (index: number) => {
    setAddresses(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddressChange = (index: number, field: 'city_id' | 'address', value: string) => {
    setAddresses(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const getSelectedIndustryNames = () => {
    if (!formData.industry_id.length) return 'Выберите отрасли';
    return formData.industry_id
      .map(id => industries.find(i => i.industry_id.toString() === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Неподдерживаемый формат файла. Допустимы: JPEG, PNG, SVG, PDF');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Файл слишком большой. Максимальный размер: 5MB');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const result = await uploadFile(file);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data?.filePath) {
        throw new Error('Не удалось получить путь к загруженному файлу');
      }

setFormData(prev => ({
        ...prev,
        logo: {
          path: result.data.filePath,
          originalName: result.data.originalName,
          uuid: result.data.uuid,
          url: result.data.filePath,
        },
      }));
      
      setSuccess('Файл успешно загружен');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset file input to allow selecting the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      logo: null,
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const requestData = {
        company_name: formData.company_name,
        description: formData.description,
        website_url: formData.website || undefined,
        logo_url: formData.logo?.path ? formData.logo.path : undefined,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : undefined,
        company_size: formData.employees_count || undefined,
        inn: formData.inn || undefined,
        company_type: formData.company_type || 'Организация',
        is_it_company: formData.is_it_company || false,
        email: formData.email || undefined,
        brand_name: formData.brand_name || undefined,
        industries: formData.industry_id.length > 0 
          ? formData.industry_id.map(industry_id => ({ industry_id: Number(industry_id) })) 
          : undefined,
        addresses: addresses
          .filter(a => a.city_id && a.address)
          .map(a => ({ city_id: Number(a.city_id), address: a.address }))
      };

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(API_ENDPOINTS.companies.profile, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Ошибка при создании компании');
      }

      setSuccess('Компания успешно создана!');
      // Redirect to my company page after 2 seconds
      setTimeout(() => {
        router.push('/employer/mycompany');
      }, 2000);
    } catch (err) {
      console.error('Ошибка при создании компании:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании компании');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Добавление компании</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                Название компании *
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                required
                value={formData.company_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>

            <div>
              <label htmlFor="industry_id" className="block text-sm font-medium text-gray-700">
                Отрасль
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="mt-1 flex justify-between items-center w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                >
                  <span className="truncate">{getSelectedIndustryNames()}</span>
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto">
                    <div className="py-1">
                      {industries.map((industry) => (
                        <div key={industry.industry_id} className="px-4 py-2 hover:bg-gray-100">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.industry_id.includes(industry.industry_id.toString())}
                              onChange={() => handleIndustryToggle(industry.industry_id.toString())}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-3 block truncate">
                              {industry.name}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Адреса компании
              </label>
              <div className="space-y-4 mt-2">
                {addresses.map((item, index) => (
                  <div key={index} className="p-4 border rounded-md bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">Город</span>
                        <CityAutocomplete
                          value={item.city_id}
                          onChange={(cityId) => handleAddressChange(index, 'city_id', cityId)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Адрес</label>
                        <input
                          type="text"
                          value={item.address}
                          onChange={(e) => handleAddressChange(index, 'address', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                          placeholder="Улица, дом, офис"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between">
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(index)}
                        className="text-red-600 text-sm hover:underline"
                        disabled={addresses.length === 1}
                      >
                        Удалить адрес
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleAddAddress}
                  className="text-blue-600 text-sm hover:underline"
                >
                  + Добавить ещё адрес
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Описание компании
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_it_company"
                name="is_it_company"
                checked={formData.is_it_company}
                onChange={(e) => setFormData({...formData, is_it_company: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_it_company" className="ml-2 block text-sm text-gray-700">
                IT-компания
              </label>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Веб-сайт
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
                Логотип компании
              </label>
              
              {formData.logo ? (
                <div className="flex items-center space-x-4">
                  <div className="flex-1 p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700 truncate max-w-xs">
                          {formData.logo?.originalName || 'Файл не выбран'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-red-500 hover:text-red-700"
                        disabled={isUploading}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    {isUploading && uploadProgress > 0 && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="logo"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Загрузить файл</span>
                        <input
                          id="logo"
                          name="logo"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept="image/jpeg, image/png, image/svg+xml, application/pdf"
                          ref={fileInputRef}
                          disabled={isUploading}
                        />
                      </label>
                      <p className="pl-1">или перетащите</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, SVG, PDF до 5MB
                    </p>
                  </div>
                </div>
              )}
              
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              {success && !error && (
                <p className="mt-2 text-sm text-green-600">{success}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="employees_count" className="block text-sm font-medium text-gray-700">
                  Количество сотрудников
                </label>
                <select
                  id="employees_count"
                  name="employees_count"
                  value={formData.employees_count}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  <option value="">Выберите количество сотрудников</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1001-5000">1001-5000</option>
                  <option value="5000+">5000+</option>
                </select>
              </div>

              <div>
                <label htmlFor="founded_year" className="block text-sm font-medium text-gray-700">
                  Год основания
                </label>
                <input
                  type="number"
                  id="founded_year"
                  name="founded_year"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.founded_year}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Телефон
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Сохранение...' : 'Сохранить компанию'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
