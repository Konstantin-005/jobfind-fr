/**
 * @file: app/employer/components/CompanyForm.tsx
 * @description: Reusable form component for creating and editing company profile.
 * @dependencies: API_ENDPOINTS, apiRequest, uploadFile, CityAutocomplete
 * @created: 2025-12-14
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '../../config/api';
import { apiRequest, uploadFile } from '../../utils/api';
import { CompanyProfile, Industry } from '../../types/company';
import CityAutocomplete from '../../components/CityAutocomplete';

interface CompanyFormProps {
  mode: 'create' | 'edit';
}

interface CompanyFormState {
  company_name: string;
  brand_name: string;
  description: string;
  industry_id: string[];
  website: string;
  logo: {
    path: string;
    originalName: string;
    uuid: string;
    url: string;
  } | null;
  employees_count: string;
  founded_year: string;
  email: string;
  inn: string;
  company_type: string;
  is_it_company: boolean;
}

interface AddressFormState {
  city_id: string;
  city_name?: string;
  address: string;
}

interface CityDictionaryItem {
  city_id: number;
  name: string;
}

export default function CompanyForm({ mode }: CompanyFormProps) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false); // Initial loading
  const [saving, setSaving] = useState(false);   // Saving state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CompanyFormState>({
    company_name: '',
    brand_name: '',
    description: '',
    industry_id: [],
    website: '',
    logo: null,
    employees_count: '',
    founded_year: '',
    email: '',
    inn: '',
    company_type: 'Организация',
    is_it_company: false,
  });

  const [addresses, setAddresses] = useState<AddressFormState[]>([
    { city_id: '', address: '' },
  ]);

  // Industries
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pendingIndustryIds, setPendingIndustryIds] = useState<string[]>([]);
  const industriesDropdownRef = useRef<HTMLDivElement>(null);

  // File Upload
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<{ url: string; isPdf: boolean } | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false); // Track if logo was explicitly removed in edit mode

  // Load dictionaries (Industries)
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.dictionaries.industries);
        if (response.ok) {
          const data = await response.json();
          setIndustries(data);
        }
      } catch (err) {
        console.error('Failed to load industries:', err);
      }
    };
    fetchIndustries();
  }, []);

  // Load Company Data if Edit Mode
  useEffect(() => {
    if (mode === 'edit') {
      const fetchCompany = async () => {
        setLoading(true);
        try {
          const response = await apiRequest<CompanyProfile>(
            API_ENDPOINTS.companies.profile,
            { method: 'GET' }
          );

          if (response.error) {
            if (response.status === 404) {
              // Should create instead? Or redirect?
              // If we are in edit mode but no company, maybe redirect to create
              router.replace('/employer/addcompany');
              return;
            }
            setError(response.error);
            return;
          }

          if (response.data) {
            const data = response.data;
            setFormData({
              company_name: data.company_name || '',
              brand_name: data.brand_name || '',
              description: data.description || '',
              industry_id: (data.industries || []).map((i) => String(i.industry_id)),
              website: data.website_url || '',
              logo: data.logo_url
                ? {
                    path: data.logo_url,
                    originalName: '',
                    uuid: '',
                    url: data.logo_url,
                  }
                : null,
              employees_count: data.company_size || '',
              founded_year: data.founded_year ? String(data.founded_year) : '',
              email: data.email || '',
              inn: data.inn || '',
              company_type: data.company_type || 'Организация',
              is_it_company: data.is_it_company || false,
            });

            setPendingIndustryIds((data.industries || []).map((i) => String(i.industry_id)));

            // Map addresses
            const mappedAddresses: AddressFormState[] =
              (data.addresses || []).map((a) => ({
                city_id: a.city_id ? String(a.city_id) : '',
                city_name: a.city?.name || '',
                address: a.address || '',
              })) || [];
            
            const nextAddresses = mappedAddresses.length > 0 ? mappedAddresses : [{ city_id: '', address: '' }];
            setAddresses(nextAddresses);

            // Fetch city names if needed (if they weren't in the profile response fully populated)
            // The API response usually includes nested city object, but let's double check if we need to fetch by IDs.
            // In MyCompanyPageClient, there was logic to fetch cities by IDs. Let's replicate it to be safe.
            const cityIds = Array.from(
              new Set(
                nextAddresses
                  .map((a) => a.city_id)
                  .filter((id) => id)
                  .map((id) => Number(id))
                  .filter((id) => Number.isFinite(id))
              )
            );

            if (cityIds.length > 0) {
               // Only fetch if we don't have names
               const missingNames = nextAddresses.some(a => a.city_id && !a.city_name);
               if (missingNames) {
                   const citiesResponse = await apiRequest<CityDictionaryItem[]>(
                    API_ENDPOINTS.dictionaries.citiesByIds,
                    {
                        method: 'POST',
                        body: JSON.stringify({ city_ids: cityIds }),
                    }
                    );
                    if (!citiesResponse.error && Array.isArray(citiesResponse.data)) {
                        const cityMap = new Map<number, string>(
                            citiesResponse.data
                            .filter((c) => typeof c.city_id === 'number' && typeof c.name === 'string')
                            .map((c) => [c.city_id, c.name])
                        );
                        setAddresses((prev) =>
                            prev.map((addr) => {
                                const cityIdNum = Number(addr.city_id);
                                if (!Number.isFinite(cityIdNum)) return addr;
                                const name = cityMap.get(cityIdNum);
                                if (!name) return addr;
                                return { ...addr, city_name: name };
                            })
                        );
                    }
               }
            }
          }
        } catch (e) {
          console.error(e);
          setError('Не удалось загрузить профиль компании');
        } finally {
          setLoading(false);
        }
      };
      fetchCompany();
    } else {
        // Create mode
        // Maybe check if company exists? The page usually handles this.
    }
  }, [mode, router]);

  // Click outside industries dropdown
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        industriesDropdownRef.current &&
        !industriesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        // Reset pending to current actual value if cancelled by clicking outside
        setPendingIndustryIds(formData.industry_id);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, formData.industry_id]);

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === 'industry_id') return;

    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
        return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const extractLogoFileName = (value?: string | null) => {
    if (!value) return undefined;
    const withoutQuery = value.split('?')[0]?.split('#')[0] ?? value;
    const parts = withoutQuery.split(/[/\\]/);
    const last = parts[parts.length - 1];
    return last || undefined;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Неподдерживаемый формат файла. Допустимы: JPEG, PNG, SVG, PDF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер: 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      const result = await uploadFile(file);
      if (result.error) throw new Error(result.error);
      if (!result.data?.filePath) throw new Error('Не удалось получить путь к загруженному файлу');

      setFormData(prev => ({
        ...prev,
        logo: {
          path: result.data!.filePath,
          originalName: result.data!.originalName,
          uuid: result.data!.uuid,
          url: result.data!.filePath,
        },
      }));
      setLogoRemoved(false);
      setSuccess('Файл успешно загружен');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, logo: null }));
    setLogoRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Industries
  const getSelectedIndustryNames = () => {
    if (!formData.industry_id.length) return 'Выберите отрасли';
    return formData.industry_id
      .map(id => industries.find(i => String(i.industry_id) === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handleIndustryToggle = (industryId: string) => {
    setPendingIndustryIds(prev => 
      prev.includes(industryId) ? prev.filter(id => id !== industryId) : [...prev, industryId]
    );
  };

  const applyIndustriesSelection = () => {
    setFormData(prev => ({ ...prev, industry_id: pendingIndustryIds }));
    setIsDropdownOpen(false);
  };

  // Addresses
  const handleAddAddress = () => {
    if (addresses.length >= 5) return;
    setAddresses(prev => [...prev, { city_id: '', address: '' }]);
  };

  const handleRemoveAddress = (index: number) => {
    setAddresses(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddressChange = (index: number, field: keyof AddressFormState, value: string) => {
    setAddresses(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.company_name.trim()) {
      setSaving(false);
      setError('Заполните обязательное поле: Официальное название организации');
      return;
    }
    if (!formData.inn.trim()) {
      setSaving(false);
      setError('Заполните обязательное поле: ИНН');
      return;
    }
    if (!formData.company_type) {
        setSaving(false);
        setError('Заполните обязательное поле: Тип');
        return;
    }
    if (formData.industry_id.length === 0) {
      setSaving(false);
      setError('Выберите обязательное поле: Отрасли компании');
      return;
    }

    try {
      const requestData = {
        company_name: formData.company_name,
        description: formData.description || undefined,
        website_url: formData.website || undefined,
        logo_url: logoRemoved ? null : extractLogoFileName(formData.logo?.path),
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : undefined,
        company_size: formData.employees_count || undefined,
        inn: formData.inn.trim(),
        company_type: formData.company_type,
        is_it_company: formData.is_it_company,
        email: formData.email || undefined,
        brand_name: formData.brand_name || undefined,
        industries: formData.industry_id.map(id => ({ industry_id: Number(id) })),
        addresses: addresses
          .filter(a => a.city_id && a.address)
          .map(a => ({ city_id: Number(a.city_id), address: a.address })),
      };

      const response = await apiRequest<CompanyProfile>(API_ENDPOINTS.companies.profile, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccess('Профиль компании успешно сохранён');
      if (mode === 'create') {
        // Redirect to mycompany page after creation
        setTimeout(() => {
            router.push('/employer/mycompany');
        }, 1500);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при сохранении профиля');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Загрузка данных компании...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {mode === 'create' ? 'Создание компании' : 'Моя компания - редактирование данных'}
      </h1>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}
      {success && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">{success}</div>}

      {/* Logo Preview Modal */}
      {logoPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setLogoPreview(null)}
        >
          <div
            className="w-full max-w-3xl rounded-lg bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Логотип компании</h2>
              <button
                type="button"
                onClick={() => setLogoPreview(null)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="mt-4">
              {logoPreview.isPdf ? (
                <iframe src={logoPreview.url} className="h-[70vh] w-full rounded border" title="Preview" />
              ) : (
                <img src={logoPreview.url} alt="Preview" className="max-h-[70vh] w-full rounded object-contain bg-white" />
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
            Официальное название организации *
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

        {/* Brand Name */}
        <div>
          <label htmlFor="brand_name" className="block text-sm font-medium text-gray-700">
            Брендовое наименование (опционально)
          </label>
          <input
            type="text"
            id="brand_name"
            name="brand_name"
            value={formData.brand_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>

        {/* INN & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="inn" className="block text-sm font-medium text-gray-700">
              ИНН *
            </label>
            <input
              type="text"
              id="inn"
              name="inn"
              required
              value={formData.inn}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>

          <div>
            <label htmlFor="company_type" className="block text-sm font-medium text-gray-700">
              Тип *
            </label>
            <select
              id="company_type"
              name="company_type"
              required
              value={formData.company_type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="Организация">Организация</option>
              <option value="ИП">ИП</option>
              <option value="Самозанятый">Самозанятый</option>
              <option value="Физическое лицо">Физическое лицо</option>
            </select>
          </div>
        </div>

        {/* Is IT Company */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_it_company"
            name="is_it_company"
            checked={formData.is_it_company}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_it_company" className="ml-2 block text-sm text-gray-700">
            IT-компания
          </label>
        </div>

        {/* Email */}
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

        {/* Industries */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Отрасли компании *
          </label>
          <div className="relative" ref={industriesDropdownRef}>
            <button
              type="button"
              onClick={() => {
                if (!isDropdownOpen) setPendingIndustryIds(formData.industry_id);
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="mt-1 flex justify-between items-center w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            >
              <span className="truncate">{getSelectedIndustryNames()}</span>
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200">
                <div className="py-1">
                  {industries.map((industry) => (
                    <div key={industry.industry_id} className="px-4 py-2 hover:bg-gray-100">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pendingIndustryIds.includes(String(industry.industry_id))}
                          onChange={() => handleIndustryToggle(String(industry.industry_id))}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 block truncate text-sm">{industry.name}</span>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t bg-gray-50 sticky bottom-0">
                  <button
                    type="button"
                    onClick={applyIndustriesSelection}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Выбрать
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
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

        {/* Logo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Логотип компании</label>
          {formData.logo ? (
            <div className="flex items-center space-x-4">
              <div className="flex-1 p-3 border rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {(() => {
                      const fileName = extractLogoFileName(formData.logo?.path);
                      const publicUrl = fileName ? `/uploads/companyLogo/${fileName}` : undefined;
                      const isPdf = Boolean(fileName && fileName.toLowerCase().endsWith('.pdf'));

                      if (!publicUrl || !fileName) {
                        return <span className="text-sm text-gray-700 truncate max-w-xs">{formData.logo.originalName || 'Файл загружен'}</span>;
                      }

                      if (isPdf) {
                        return (
                          <a href={publicUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-xs">
                            {formData.logo.originalName || fileName}
                          </a>
                        );
                      }

                      return (
                        <img
                          src={publicUrl}
                          alt="Logo"
                          className="h-16 w-16 cursor-pointer rounded object-contain bg-white"
                          onClick={() => setLogoPreview({ url: publicUrl, isPdf: false })}
                        />
                      );
                    })()}
                  </div>
                  <button type="button" onClick={handleRemoveFile} className="text-red-500 hover:text-red-700" disabled={isUploading}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="logo" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
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
                <p className="text-xs text-gray-500">PNG, JPG, SVG, PDF до 5MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Addresses */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Адреса компании</label>
          <div className="space-y-4 mt-2">
            {addresses.map((item, index) => (
              <div key={index} className="p-4 border rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Населенный пункт</span>
                    <CityAutocomplete
                      value={item.city_id}
                      onChange={(cityId) => handleAddressChange(index, 'city_id', cityId)}
                      initialCityName={item.city_name || ''}
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
          {addresses.length < 5 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleAddAddress}
                className="text-blue-600 text-sm hover:underline"
              >
                + Добавить ещё адрес
              </button>
            </div>
          )}
        </div>

        {/* Website */}
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

        {/* Stats */}
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

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Сохранение...' : (mode === 'create' ? 'Создать компанию' : 'Сохранить изменения')}
          </button>
        </div>
      </form>
    </div>
  );
}
