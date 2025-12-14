"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS, API_BASE_URL } from "@/app/config/api";
import employmentTypes from "@/app/config/employment_types_202505222228.json";
import workFormats from "@/app/config/work_formats_202505222228.json";
import educationTypes from "@/app/config/education_types_202505242225.json";
import { uploadFile, deleteFile } from "@/app/utils/api";
import RichTextEditor from "@/app/components/RichTextEditor";

// Месяцы для select
const months = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.788l-4 1.03 1.03-4 12.332-12.33z" />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function WorkConditionsBlock({ form, onEdit }: { form: any, onEdit: () => void }) {
  // Маппинг значений для отображения
  const employmentTypeNames = employmentTypes.employment_types.filter(et => form.employment_type_ids.includes(et.employment_type_id)).map(et => et.name).join(', ');
  const workFormatNames = workFormats.work_formats.filter(wf => form.work_format_ids.includes(wf.work_format_id)).map(wf => wf.name).join(', ');
  let businessTrips = 'Не указано';
  if (form.business_trips === 'yes') businessTrips = 'Могу';
  else if (form.business_trips === 'no') businessTrips = 'Не могу';
  else if (form.business_trips === 'sometimes') businessTrips = 'Могу иногда';
  return (
    <div className="p-6 border rounded-xl relative mb-6 bg-white">
      <div className="text-gray-400 text-sm mb-1">Тип занятости</div>
      <div className="text-base font-medium mb-4">{employmentTypeNames || 'Не указано'}</div>
      <div className="text-gray-400 text-sm mb-1">Формат работы</div>
      <div className="text-base font-medium mb-4">{workFormatNames || 'Не указано'}</div>
      <div className="text-gray-400 text-sm mb-1">Командировки</div>
      <div className="text-base font-medium">{businessTrips}</div>
      <button className="absolute top-4 right-4 text-gray-400 hover:text-blue-500" onClick={onEdit} aria-label="Редактировать условия">
        <PencilIcon />
      </button>
    </div>
  );
}

function WorkConditionsModal({ form, onClose, onSave }: { form: any, onClose: () => void, onSave: (data: any) => void }) {
  const [employmentTypeIds, setEmploymentTypeIds] = useState<number[]>(form.employment_type_ids);
  const [workFormatIds, setWorkFormatIds] = useState<number[]>(form.work_format_ids);
  const [businessTrips, setBusinessTrips] = useState<string>(form.business_trips);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl p-8 w-full max-w-md relative">
        <h2 className="text-xl font-bold mb-6">Редактировать условия работы</h2>
        <div className="mb-6">
          <div className="mb-4">
            <div className="text-base font-medium mb-2">Тип занятости</div>
            <div className="space-y-2">
              {employmentTypes.employment_types.map(type => (
                <label key={type.employment_type_id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={employmentTypeIds.includes(type.employment_type_id)}
                    onChange={() => setEmploymentTypeIds(ids => ids.includes(type.employment_type_id) ? ids.filter(id => id !== type.employment_type_id) : [...ids, type.employment_type_id])}
                  />
                  <span>{type.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <div className="text-base font-medium mb-2">Формат работы</div>
            <div className="space-y-2">
              {workFormats.work_formats.map(format => (
                <label key={format.work_format_id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={workFormatIds.includes(format.work_format_id)}
                    onChange={() => setWorkFormatIds(ids => ids.includes(format.work_format_id) ? ids.filter(id => id !== format.work_format_id) : [...ids, format.work_format_id])}
                  />
                  <span>{format.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <div className="text-base font-medium mb-2">Командировки</div>
            <div className="space-y-2">
              {[{ value: "yes", label: "Могу" }, { value: "no", label: "Не могу" }, { value: "sometimes", label: "Могу иногда" }].map(opt => (
                <label key={opt.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="business_trips"
                    checked={businessTrips === opt.value}
                    onChange={() => setBusinessTrips(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700" onClick={onClose}>Отмена</button>
          <button className="px-6 py-2 rounded-lg bg-blue-600 text-white" onClick={() => onSave({ employment_type_ids: employmentTypeIds, work_format_ids: workFormatIds, business_trips: businessTrips })}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

function TitlePhotoBlock({ form, photoPreview, onEdit }: { form: any, photoPreview: string | null, onEdit: () => void }) {
  return (
    <div className="p-6 border rounded-xl relative mb-6 bg-white flex gap-6 items-center">
      <div className="flex-shrink-0">
        {photoPreview ? (
          <img src={photoPreview} alt="Фото профиля" className="w-20 h-20 object-cover rounded-full border-2 border-[#2B81B0]" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-gray-400 text-sm mb-1">Кем вы хотите работать</div>
        <div className="text-base font-medium mb-4 break-words">{form.title || 'Не указано'}</div>
        <div className="text-gray-400 text-sm mb-1">Желаемый уровень дохода</div>
        <div className="text-base font-medium">{form.salary_expectation ? `${form.salary_expectation} ₽` : 'Не указано'}</div>
      </div>
      <button className="absolute top-4 right-4 text-gray-400 hover:text-blue-500" onClick={onEdit} aria-label="Редактировать должность и фото">
        <PencilIcon />
      </button>
    </div>
  );
}

function TitlePhotoModal({ form, photoPreview, onClose, onSave }: { form: any, photoPreview: string | null, onClose: () => void, onSave: (data: any, photo: File | null, deletePhoto?: boolean) => void }) {
  const [title, setTitle] = useState(form.title);
  const [salary, setSalary] = useState(form.salary_expectation);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(photoPreview);
  const [photoDeleted, setPhotoDeleted] = useState(false);

  const handlePhotoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
    setPhotoDeleted(false);
    if (file) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleDeletePhoto = () => {
    setPhoto(null);
    setPreview(null);
    setPhotoDeleted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl p-8 w-full max-w-md relative">
        <h2 className="text-xl font-bold mb-6">Редактировать должность и фото</h2>
        <div className="mb-6">
          <div className="mb-4">
            <div className="text-base font-medium mb-2">Кем вы хотите работать</div>
            <input
              type="text"
              className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Желаемая должность"
            />
          </div>
          <div className="mb-4">
            <div className="text-base font-medium mb-2">Желаемый уровень дохода (₽)</div>
            <input
              type="number"
              className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              placeholder="Сумма в месяц"
            />
          </div>
          <div className="mb-4">
            <div className="text-base font-medium mb-2">Фото профиля</div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 relative">
                {preview ? (
                  <img src={preview} alt="Фото профиля" className="w-20 h-20 object-cover rounded-full border-2 border-[#2B81B0]" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-white border border-[#2B81B0] rounded-full p-1 cursor-pointer hover:bg-gray-50 transition">
                  <PencilIcon className="w-4 h-4 text-[#2B81B0]" />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoInput} />
                </label>
              </div>
              {preview && (
                <button className="text-sm text-red-500 underline ml-2" onClick={handleDeletePhoto}>Удалить фото</button>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700" onClick={onClose}>Отмена</button>
          <button className="px-6 py-2 rounded-lg bg-blue-600 text-white" onClick={() => {
            onSave({ title, salary_expectation: salary }, photo, photoDeleted);

          }}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

function WorkExperienceItemModal({ experience, resumeId, onClose, onSaved, onDeleted }: { experience: any, resumeId: number, onClose: () => void, onSaved: () => void, onDeleted: () => void }) {
  const router = useRouter();
  const [localExp, setLocalExp] = useState(() => {
    // Установка текущего месяца и года по умолчанию для новой записи
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() возвращает 0-11
    const currentYear = currentDate.getFullYear();
    
    return {
      experience_id: experience?.experience_id,
      company_id: experience?.company_id,
      company_name: experience?.company_name || '',
      city_id: experience?.city_id,
      city_name: experience?.city_name || '',
      position: experience?.position || '',
      profession_id: experience?.profession_id,
      start_month: experience?.start_month || currentMonth,
      start_year: experience?.start_year || currentYear,
      end_month: experience?.end_month || null,
      end_year: experience?.end_year || null,
      is_current: experience?.is_current ?? true, // По умолчанию текущее место работы
      responsibilities: experience?.responsibilities || '',
      companySuggestions: [],
      citySuggestions: [],
      professionSuggestions: [],
      isLoadingCompany: false,
      isLoadingCity: false,
      isLoadingProfession: false
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleSave = async () => {
    try {
      // Валидация обязательных полей
      if (!localExp.start_month || !localExp.start_year) {
        throw new Error('Пожалуйста, укажите дату начала работы (месяц и год)');
      }
      
      if (!localExp.is_current && (!localExp.end_month || !localExp.end_year)) {
        throw new Error('Пожалуйста, укажите дату окончания работы (месяц и год) или отметьте "По настоящее время"');
      }

      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Подготовка данных для отправки
      const body = {
        company_id: localExp.company_id,
        company_name: localExp.company_name,
        city_id: localExp.city_id,
        position: localExp.position,
        profession_id: localExp.profession_id,
        start_month: Number(localExp.start_month),
        start_year: Number(localExp.start_year),
        end_month: localExp.is_current ? null : Number(localExp.end_month),
        end_year: localExp.is_current ? null : Number(localExp.end_year),
        is_current: localExp.is_current,
        responsibilities: localExp.responsibilities,
      };

      const isNew = !localExp.experience_id;
      const url = isNew 
        ? `${API_BASE_URL}/api/resumes/${resumeId}/work-experiences`
        : `${API_BASE_URL}/api/resumes/${resumeId}/work-experiences/${localExp.experience_id}`;

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Ошибка сохранения';
        // Перевод ошибок с бэкенда
        const translatedMessage = errorMessage === 'Work experience periods overlap with another entry' 
          ? 'Периоды опыта работы пересекаются с другой записью' 
          : errorMessage;
        throw new Error(translatedMessage);
      }
      
      onSaved();
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || 'Ошибка');
      setIsErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Автокомплит для компании
  const handleCompanyInput = async (value: string) => {
    setLocalExp(exp => ({ ...exp, company_name: value, company_id: undefined }));
    
    if (!value.trim()) {
      setLocalExp(exp => ({ ...exp, companySuggestions: [] }));
      return;
    }
    setLocalExp(exp => ({ ...exp, isLoadingCompany: true }));
    try {
      const res = await fetch(`${API_ENDPOINTS.dictionaries.companiesSearch}?query=${encodeURIComponent(value)}`);
      const data = await res.json();
      setLocalExp(exp => ({ ...exp, companySuggestions: data }));
    } catch (e) {
      setLocalExp(exp => ({ ...exp, companySuggestions: [] }));
    }
    setLocalExp(exp => ({ ...exp, isLoadingCompany: false }));
  };

  const handleCompanySelect = (company: { company_id: number; company_name: string; brand_name: string }) => {
    setLocalExp(exp => ({ 
      ...exp, 
      company_id: company.company_id,
      company_name: company.company_name,
      companySuggestions: []
    }));
  };

  // Автокомплит для города
  const handleCityInput = async (value: string) => {
    setLocalExp(exp => ({ ...exp, city_name: value, city_id: undefined }));
    
    if (!value.trim()) {
      setLocalExp(exp => ({ ...exp, citySuggestions: [] }));
      return;
    }
    setLocalExp(exp => ({ ...exp, isLoadingCity: true }));
    try {
      const res = await fetch(`${API_ENDPOINTS.citiesSearch}?query=${encodeURIComponent(value)}`);
      let data = await res.json();
      data = data.map((city: any) => ({ city_id: city.city_id ?? city.id, name: city.name }));
      setLocalExp(exp => ({ ...exp, citySuggestions: data }));
    } catch (e) {
      setLocalExp(exp => ({ ...exp, citySuggestions: [] }));
    }
    setLocalExp(exp => ({ ...exp, isLoadingCity: false }));
  };

  const handleCitySelect = (city: { city_id: number; name: string }) => {
    setLocalExp(exp => ({ 
      ...exp, 
      city_id: city.city_id,
      city_name: city.name,
      citySuggestions: []
    }));
  };

  // Автокомплит для должности
  const handleProfessionInput = async (value: string) => {
    setLocalExp(exp => ({ ...exp, position: value, profession_id: undefined }));
    
    if (!value.trim()) {
      setLocalExp(exp => ({ ...exp, professionSuggestions: [] }));
      return;
    }
    setLocalExp(exp => ({ ...exp, isLoadingProfession: true }));
    try {
      const res = await fetch(`${API_ENDPOINTS.dictionaries.professionsSearch}?query=${encodeURIComponent(value)}`);
      const data = await res.json();
      setLocalExp(exp => ({ ...exp, professionSuggestions: data }));
    } catch (e) {
      setLocalExp(exp => ({ ...exp, professionSuggestions: [] }));
    }
    setLocalExp(exp => ({ ...exp, isLoadingProfession: false }));
  };

  const handleProfessionSelect = (prof: { profession_id: number; name: string }) => {
    setLocalExp(exp => ({ 
      ...exp, 
      profession_id: prof.profession_id,
      position: prof.name,
      professionSuggestions: []
    }));
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleteModalOpen(false);
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(API_ENDPOINTS.resumes.workExperience(resumeId, localExp.experience_id), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Ошибка удаления');
      onDeleted();
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || 'Ошибка');
      setIsErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto">
      <div className="bg-white rounded-xl p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">Редактировать опыт работы</h2>
        <div className="space-y-4 mb-6">
          <div className="mb-4 relative z-10">
            <div className="text-base font-medium mb-2">Компания</div>
            <div className="relative">
              <input 
                type="text" 
                className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 pr-10 text-base" 
                value={localExp.company_name} 
                onChange={e => handleCompanyInput(e.target.value)} 
                placeholder="Название компании" 
                autoComplete="off"
                readOnly={!!localExp.company_id}
                style={{ wordBreak: 'break-word' }}
              />
              {localExp.company_id && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                  onClick={() => {
                    setLocalExp(exp => ({ ...exp, company_name: "", company_id: undefined }));
                  }}
                  tabIndex={-1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {localExp.isLoadingCompany && <div className="absolute right-4 top-3">...</div>}
              {localExp.companySuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {localExp.companySuggestions.map(company => (
                    <li
                      key={company.company_id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleCompanySelect(company)}
                    >
                      {company.company_name} {company.brand_name && <span className="text-gray-400">({company.brand_name})</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="mb-4 relative">
            <div className="text-base font-medium mb-2">Город</div>
            <div className="relative">
              <input
                type="text"
                className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 pr-10 text-base"
                placeholder="Город или населенный пункт"
                value={localExp.city_name}
                onChange={e => handleCityInput(e.target.value)}
                autoComplete="off"
                readOnly={!!localExp.city_id}
                style={{ wordBreak: 'break-word' }}
              />
              {localExp.city_id && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                  onClick={() => {
                    setLocalExp(exp => ({ ...exp, city_name: "", city_id: undefined }));
                  }}
                  tabIndex={-1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {localExp.isLoadingCity && <div className="absolute right-4 top-3">...</div>}
              {localExp.citySuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {localExp.citySuggestions.map(city => (
                    <li
                      key={city.city_id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleCitySelect(city)}
                    >
                      {city.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="mb-4 relative">
            <div className="text-base font-medium mb-2">Должность</div>
            <div className="relative">
              <input
                type="text"
                className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 pr-10 text-base"
                placeholder="Должность"
                value={localExp.position}
                onChange={e => handleProfessionInput(e.target.value)}
                autoComplete="off"
                readOnly={!!localExp.profession_id}
                style={{ wordBreak: 'break-word' }}
              />
              {localExp.profession_id && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                  onClick={() => {
                    setLocalExp(exp => ({ ...exp, position: "", profession_id: undefined }));
                  }}
                  tabIndex={-1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {localExp.isLoadingProfession && <div className="absolute right-4 top-3">...</div>}
              {localExp.professionSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {localExp.professionSuggestions.map(prof => (
                    <li
                      key={prof.profession_id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleProfessionSelect(prof)}
                    >
                      {prof.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="mb-4">
            <div className="text-base font-medium mb-2">Период работы</div>
            <div className="flex items-center gap-4">
              <select className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base" value={localExp.start_year} onChange={e => setLocalExp(exp => ({ ...exp, start_year: e.target.value }))}>
                {Array.from({ length: 66 }, (_, i) => new Date().getFullYear() - i).map(year => (<option key={year} value={year}>{year}</option>))}
              </select>
              <select className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base" value={localExp.start_month} onChange={e => setLocalExp(exp => ({ ...exp, start_month: e.target.value }))}>
                {months.map((month, index) => (<option key={month} value={index + 1}>{month}</option>))}
              </select>
              <span>—</span>
              <select className={`w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base ${localExp.is_current ? 'opacity-50 cursor-not-allowed' : ''}`} value={localExp.end_year} onChange={e => setLocalExp(exp => ({ ...exp, end_year: e.target.value }))} disabled={localExp.is_current}>
                {Array.from({ length: 66 }, (_, i) => new Date().getFullYear() - i).map(year => (<option key={year} value={year}>{year}</option>))}
              </select>
              <select className={`w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base ${localExp.is_current ? 'opacity-50 cursor-not-allowed' : ''}`} value={localExp.end_month} onChange={e => setLocalExp(exp => ({ ...exp, end_month: e.target.value }))} disabled={localExp.is_current}>
                {months.map((month, index) => (<option key={month} value={index + 1}>{month}</option>))}
              </select>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" checked={localExp.is_current} onChange={e => {
                  const isCurrent = e.target.checked;
                  const currentDate = new Date();
                  const currentMonth = currentDate.getMonth() + 1;
                  const currentYear = currentDate.getFullYear();
                  
                  setLocalExp(exp => ({ 
                    ...exp, 
                    is_current: isCurrent,
                    end_year: isCurrent ? null : (exp.end_year || currentYear),
                    end_month: isCurrent ? null : (exp.end_month || currentMonth)
                  }));
                }} />
                По настоящее время
              </label>
            </div>
          </div>
          <div className="mb-4">
            <div className="text-base font-medium mb-2">Обязанности</div>
            <RichTextEditor
              value={localExp.responsibilities}
              onChange={(value) => setLocalExp(exp => ({ ...exp, responsibilities: value }))}
              placeholder="Описание обязанностей"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700" onClick={onClose}>Отмена</button>
          <button className="px-6 py-2 rounded-lg bg-blue-600 text-white" onClick={handleSave} disabled={isLoading}>{isLoading ? 'Сохранение...' : 'Сохранить'}</button>
          {experience?.experience_id && <button className="px-6 py-2 rounded-lg bg-red-600 text-white" onClick={handleDelete} disabled={isLoading}>{isLoading ? 'Удаление...' : 'Удалить'}</button>}
        </div>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Подтвердите действие</h3>
              <p className="text-gray-600 mb-6">Удалить этот опыт работы?</p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                  Отмена
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {isErrorModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Ошибка</h3>
                <button onClick={() => setIsErrorModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <div className="flex justify-end">
                <button onClick={() => setIsErrorModalOpen(false)} className="bg-[#2B81B0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#18608a] transition">Понятно</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EducationItemModal({ education, resumeId, onClose, onSaved, onDeleted }: { education: any, resumeId: number, onClose: () => void, onSaved: () => void, onDeleted: () => void }) {
  const router = useRouter();
  const [localEdu, setLocalEdu] = useState(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    return {
      ...(education || {}),
      end_year: education?.end_year || null,
      is_current: education?.is_current || true,
      start_year: education?.start_year || currentYear,
      start_month: education?.start_month || 1,
      end_month: education?.end_month || null,
      institution_id: education?.institution_id,
      specialization_id: education?.specialization_id,
      institutionSuggestions: [],
      specializationSuggestions: [],
      isLoadingInstitution: false,
      isLoadingSpecialization: false
    };
  });

  // Handle institution input with autocomplete
  const handleInstitutionInput = async (value: string) => {
    setLocalEdu(edu => ({ ...edu, institution: value, institution_id: undefined, institutionSuggestions: [] }));
    
    if (!value.trim()) {
      setLocalEdu(edu => ({ ...edu, institutionSuggestions: [] }));
      return;
    }
    
    setLocalEdu(edu => ({ ...edu, isLoadingInstitution: true }));
    try {
      const res = await fetch(`${API_ENDPOINTS.dictionaries.educationalInstitutionsSearch}?query=${encodeURIComponent(value)}`);
      const data = await res.json();
      setLocalEdu(edu => ({ ...edu, institutionSuggestions: data }));
    } catch (e) {
      console.error('Error fetching institutions:', e);
      setLocalEdu(edu => ({ ...edu, institutionSuggestions: [] }));
    }
    setLocalEdu(edu => ({ ...edu, isLoadingInstitution: false }));
  };

  // Handle institution selection
  const handleInstitutionSelect = (institution: { institution_id: number; name: string }) => {
    setLocalEdu(edu => ({
      ...edu,
      institution_id: institution.institution_id,
      institution: institution.name,
      institutionSuggestions: []
    }));
  };

  // Handle specialization input with autocomplete
  const handleSpecializationInput = async (value: string) => {
    setLocalEdu(edu => ({ ...edu, specialization: value, specialization_id: undefined, specializationSuggestions: [] }));
    
    if (!value.trim()) {
      setLocalEdu(edu => ({ ...edu, specializationSuggestions: [] }));
      return;
    }
    
    setLocalEdu(edu => ({ ...edu, isLoadingSpecialization: true }));
    try {
      const res = await fetch(`${API_ENDPOINTS.dictionaries.specializationsSearch}?query=${encodeURIComponent(value)}`);
      const data = await res.json();
      setLocalEdu(edu => ({ ...edu, specializationSuggestions: data }));
    } catch (e) {
      console.error('Error fetching specializations:', e);
      setLocalEdu(edu => ({ ...edu, specializationSuggestions: [] }));
    }
    setLocalEdu(edu => ({ ...edu, isLoadingSpecialization: false }));
  };

  // Handle specialization selection
  const handleSpecializationSelect = (specialization: { specialization_id: number; name: string }) => {
    setLocalEdu(edu => ({
      ...edu,
      specialization_id: specialization.specialization_id,
      specialization: specialization.name,
      specializationSuggestions: []
    }));
  };
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const body = {
        institution_id: localEdu.institution_id,
        specialization_id: localEdu.specialization_id,
        end_year: localEdu.end_year ? Number(localEdu.end_year) : null,
      };

      // Determine if we're creating a new education or updating an existing one
      const isNewEducation = !localEdu.education_id;
      const url = isNewEducation 
        ? API_ENDPOINTS.resumes.educations(resumeId)
        : API_ENDPOINTS.resumes.education(resumeId, localEdu.education_id);
      
      const res = await fetch(url, {
        method: isNewEducation ? 'POST' : 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Ошибка сохранения');
      }
      
      onSaved();
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || 'Ошибка при сохранении образования');
      setIsErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleteModalOpen(false);
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(API_ENDPOINTS.resumes.education(resumeId, localEdu.education_id), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Ошибка удаления');
      onDeleted();
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || 'Ошибка');
      setIsErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto">
      <div className="bg-white rounded-xl p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">Редактировать образование</h2>
        <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
          <div className="space-y-4">
            <div className="mb-4">
            <div className="text-base font-medium mb-2">Учебное заведение</div>
            <div className="relative">
              <input
                type="text"
                className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition whitespace-pre-line break-words"
                placeholder="Учебное заведение"
                value={localEdu.institution}
                onChange={e => handleInstitutionInput(e.target.value)}
                autoComplete="off"
                readOnly={!!localEdu.institution_id}
                style={{ wordBreak: 'break-word' }}
              />
              {localEdu.institution_id && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                  onClick={() => {
                    setLocalEdu(edu => ({ ...edu, institution: "", institution_id: undefined }));
                  }}
                  tabIndex={-1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {localEdu.isLoadingInstitution && <div className="absolute right-4 top-3">...</div>}
              {localEdu.institutionSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {localEdu.institutionSuggestions.map((institution: any) => (
                    <li
                      key={institution.institution_id || institution.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleInstitutionSelect(institution)}
                    >
                      {institution.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="mb-4">
            <div className="text-base font-medium mb-2">Специальность</div>
            <div className="relative">
              <input
                type="text"
                className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition whitespace-pre-line break-words"
                placeholder="Специальность"
                value={localEdu.specialization}
                onChange={e => handleSpecializationInput(e.target.value)}
                autoComplete="off"
                readOnly={!!localEdu.specialization_id}
                style={{ wordBreak: 'break-word' }}
              />
              {localEdu.specialization_id && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                  onClick={() => {
                    setLocalEdu(edu => ({ ...edu, specialization: "", specialization_id: undefined }));
                  }}
                  tabIndex={-1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {localEdu.isLoadingSpecialization && <div className="absolute right-4 top-3">...</div>}
              {localEdu.specializationSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {localEdu.specializationSuggestions.map((specialization: any) => (
                    <li
                      key={specialization.specialization_id || specialization.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSpecializationSelect(specialization)}
                    >
                      {specialization.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="mb-4">
            <div className="text-base font-medium mb-2">Год окончания</div>
            <select className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base" value={localEdu.end_year} onChange={e => setLocalEdu(edu => ({ ...edu, end_year: e.target.value }))} >
              <option value="">Год окончания</option>
              {Array.from({ length: 66 }, (_, i) => new Date().getFullYear() - i).map(year => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700" onClick={onClose}>Отмена</button>
          <button className="px-6 py-2 rounded-lg bg-blue-600 text-white" onClick={handleSave} disabled={isLoading}>{isLoading ? 'Сохранение...' : 'Сохранить'}</button>
            {localEdu?.education_id && (
              <button 
                type="button"
                className="px-6 py-2 rounded-lg bg-red-600 text-white" 
                onClick={handleDelete} 
                disabled={isLoading}
              >
                {isLoading ? 'Удаление...' : 'Удалить'}
              </button>
            )}
          </div>
        </form>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Подтвердите действие</h3>
              <p className="text-gray-600 mb-6">Удалить этот период обучения?</p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                  Отмена
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {isErrorModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Ошибка</h3>
                <button onClick={() => setIsErrorModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <div className="flex justify-end">
                <button onClick={() => setIsErrorModalOpen(false)} className="bg-[#2B81B0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#18608a] transition">Понятно</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkExperienceBlock({ workExperiences, resumeId, onUpdated }: { workExperiences: any[], resumeId: number, onUpdated: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<any>(null);

  const handleEdit = (exp: any) => {
    setSelectedExperience(exp);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setSelectedExperience(null);
    setShowModal(true);
  };

  // Сортировка опыта работы: текущие места работы первыми, затем по убыванию даты начала
  const sortedExperiences = [...workExperiences].sort((a, b) => {
    // Текущие места работы (is_current) идут первыми
    if (a.is_current && !b.is_current) return -1;
    if (!a.is_current && b.is_current) return 1;
    
    // Сортировка по году начала (убывание)
    if (a.start_year !== b.start_year) {
      return (b.start_year || 0) - (a.start_year || 0);
    }
    
    // Если годы равны, сортировка по месяцу начала (убывание)
    return (b.start_month || 0) - (a.start_month || 0);
  });

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Опыт работы</h2>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          + Добавить место работы
        </button>
      </div>
      
      {workExperiences.length === 0 ? (
        <div className="text-gray-500 text-sm">Нет добавленного опыта работы</div>
      ) : (
        <div className="space-y-4">
          {sortedExperiences.map((exp, index) => (
            <div key={exp.experience_id || `exp-${index}`} className="border rounded-lg p-4 relative">
              <div className="font-medium">{exp.position || 'Должность не указана'}</div>
              <div className="text-gray-600">{exp.company_name || 'Компания не указана'}</div>
              <div className="text-sm text-gray-500">
                {exp.start_month ? `${months[exp.start_month - 1]} ` : ''}
                {exp.start_year || ''} - {exp.is_current ? 'Настоящее время' : 
                  `${exp.end_month ? months[exp.end_month - 1] + ' ' : ''}${exp.end_year || ''}`}
              </div>
              <button 
                onClick={() => handleEdit(exp)}
                className="absolute top-2 right-2 text-gray-400 hover:text-blue-600"
                aria-label="Редактировать"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <WorkExperienceItemModal
          experience={selectedExperience}
          resumeId={resumeId}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            onUpdated();
          }}
          onDeleted={() => {
            setShowModal(false);
            onUpdated();
          }}
        />
      )}
    </div>
  );
}

function EducationBlock({ educations, resumeId, onUpdated }: { educations: any[], resumeId: number, onUpdated: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState<any>(null);

  const handleEdit = (edu: any) => {
    setSelectedEducation(edu);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setSelectedEducation(null);
    setShowModal(true);
  };

  // Сортировка образования: текущее обучение первым, затем по убыванию года окончания
  const sortedEducations = [...educations].sort((a, b) => {
    // Текущее обучение (is_current) идет первым
    if (a.is_current && !b.is_current) return -1;
    if (!a.is_current && b.is_current) return 1;
    
    // Сортировка по году окончания (убывание)
    return (b.end_year || 0) - (a.end_year || 0);
  });

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Образование</h2>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          + Добавить образование
        </button>
      </div>
      
      {educations.length === 0 ? (
        <div className="text-gray-500 text-sm">Нет добавленного образования</div>
      ) : (
        <div className="space-y-4">
          {sortedEducations.map((edu, index) => (
            <div key={edu.education_id || `edu-${index}`} className="border rounded-lg p-4 relative">
              <div className="font-medium">{edu.institution || 'Учебное заведение не указано'}</div>
              <div className="text-gray-600">{edu.specialization || 'Специальность не указана'}</div>
              {edu.end_year && (
                <div className="text-sm text-gray-500">Год окончания: {edu.end_year}</div>
              )}
              <button 
                onClick={() => handleEdit(edu)}
                className="absolute top-2 right-2 text-gray-400 hover:text-blue-600"
                aria-label="Редактировать"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <EducationItemModal
          education={selectedEducation}
          resumeId={resumeId}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            onUpdated();
          }}
          onDeleted={() => {
            setShowModal(false);
            onUpdated();
          }}
        />
      )}
    </div>
  );
}

function AboutBlock({ form, onEdit }: { form: any, onEdit: () => void }) {
  return (
    <div className="p-6 border rounded-xl relative mb-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-900 text-lg font-bold">О себе</div>
        <button className="text-gray-400 hover:text-blue-500" onClick={onEdit} aria-label="Редактировать о себе">
          <PencilIcon />
        </button>
      </div>
      <div 
        className="text-base text-gray-800 min-h-[40px] prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: form.professional_summary || '<span class="text-gray-400">Нет информации</span>' }}
      />
    </div>
  );
}

function AboutModal({ form, onClose, onSave }: { form: any, onClose: () => void, onSave: (data: any) => void }) {
  const [summary, setSummary] = useState(form.professional_summary || '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl p-8 w-full max-w-md relative">
        <h2 className="text-xl font-bold mb-6">Редактировать о себе</h2>
        <div className="mb-6">
          <RichTextEditor
            value={summary}
            onChange={(value) => setSummary(value)}
            placeholder="Опишите свой опыт, навыки и достижения"
          />
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700" onClick={onClose}>Отмена</button>
          <button className="px-6 py-2 rounded-lg bg-blue-600 text-white" onClick={() => { onSave({ professional_summary: summary }); onClose(); }}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

function ContactsBlock({ form, onEdit }: { form: any, onEdit: () => void }) {
  const privacy = [
    form.hideNameAndPhoto && 'Скрыть ФИО и фото',
    form.hidePhone && 'Скрыть номер телефона',
    form.hideEmail && 'Скрыть Емайл',
    form.hideOtherContacts && 'Скрыть остальные контакты',
    form.hideCompanyNames && 'Скрыть названия компаний в опыте работы',
  ].filter(Boolean).join(', ');
  const visibilityMap: Record<string, string> = {
    public: 'Видно всем зарегистрированным работодателям на сайте',
    excluded_companies: 'Видно всем, кроме работодателей из черного списка',
    selected_companies: 'Видно только работодателям из белого списка',
    link_only: 'Доступ только по прямой ссылке',
    private: 'Не видно никому',
  };
  return (
    <div className="p-6 border rounded-xl relative mb-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-900 text-lg font-bold">Контакты и настройки видимости</div>
        <button className="text-gray-400 hover:text-blue-500" onClick={onEdit} aria-label="Редактировать контакты и видимость">
          <PencilIcon />
        </button>
      </div>
      <div className="mb-2"><span className="text-gray-400">Телефон:</span> {form.phone || <span className="text-gray-400">Не указано</span>} {form.hasWhatsapp && <span className="ml-2 text-green-600">WhatsApp</span>} {form.hasTelegram && <span className="ml-2 text-blue-500">Telegram</span>}</div>
      {form.phoneComment && <div className="mb-2 text-gray-500 text-sm">{form.phoneComment}</div>}
      <div className="mb-2"><span className="text-gray-400">Email:</span> {form.email || <span className="text-gray-400">Не указано</span>}</div>
      <div className="mb-2"><span className="text-gray-400">Веб-сайт:</span> {form.website || <span className="text-gray-400">Не указано</span>}</div>
      <div className="mb-2"><span className="text-gray-400">Приватность:</span> {privacy || <span className="text-gray-400">Нет</span>}</div>
      <div className="mb-2"><span className="text-gray-400">Видимость резюме:</span> {visibilityMap[form.visibility] || 'Не указано'}</div>
    </div>
  );
}

function ContactsModal({ form, onClose, onSave }: { form: any, onClose: () => void, onSave: (data: any) => void }) {
  // Format phone number for display (with +7)
  const formatPhone = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    // If it starts with 7 or 8, replace with +7
    if (cleaned.startsWith('7') || cleaned.startsWith('8')) {
      return `+7${cleaned.substring(1)}`;
    }
    // Otherwise, just add +7
    return `+7${cleaned}`;
  };

  // Get clean phone number (digits only) for saving
  const getCleanPhone = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    // If it starts with 7 or 8, keep the rest
    if (cleaned.startsWith('7') || cleaned.startsWith('8')) {
      return cleaned.substring(1);
    }
    return cleaned;
  };

  const [phone, setPhone] = useState(form.phone ? formatPhone(form.phone) : '');
  const [hasWhatsapp, setHasWhatsapp] = useState(form.hasWhatsapp || false);
  const [hasTelegram, setHasTelegram] = useState(form.hasTelegram || false);
  const [phoneComment, setPhoneComment] = useState(form.phoneComment || '');
  const [email, setEmail] = useState(form.email || '');
  const [website, setWebsite] = useState(form.website || '');
  const [hideNameAndPhoto, setHideNameAndPhoto] = useState(form.hideNameAndPhoto || false);
  const [hidePhone, setHidePhone] = useState(form.hidePhone || false);
  const [hideEmail, setHideEmail] = useState(form.hideEmail || false);
  const [hideOtherContacts, setHideOtherContacts] = useState(form.hideOtherContacts || false);
  const [hideCompanyNames, setHideCompanyNames] = useState(form.hideCompanyNames || false);
  const [visibility, setVisibility] = useState(form.visibility || 'public');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto">
      <div className="bg-white rounded-xl p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">Редактировать контакты и видимость</h2>
        <div className="space-y-4 mb-6">
          <input 
            type="tel" 
            className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base" 
            placeholder="+7XXXXXXXXXX" 
            value={phone} 
            onChange={e => {
              const input = e.target;
              const cursorPosition = input.selectionStart || 0;
              
              // Получаем только цифры из введенного значения, исключая +7
              let value = input.value.replace(/[^\d]/g, '');
              if (value.startsWith('7')) {
                value = value.slice(1);
              }
              
              // Ограничиваем длину до 10 цифр
              if (value.length > 10) {
                value = value.slice(0, 10);
              }
              
              // Форматируем номер
              const formattedValue = value.length > 0 ? `+7${value}` : '';
              
              setPhone(formattedValue);

              // Восстанавливаем позицию курсора
              requestAnimationFrame(() => {
                // Всегда ставим курсор в конец, если вводим новую цифру
                const newPosition = formattedValue.length;
                input.setSelectionRange(newPosition, newPosition);
              });
            }}
          />
          <div className="flex items-center space-x-4">
            <label className="flex items-center"><input type="checkbox" className="mr-2" checked={hasWhatsapp} onChange={e => setHasWhatsapp(e.target.checked)} />Есть WhatsApp</label>
            <label className="flex items-center"><input type="checkbox" className="mr-2" checked={hasTelegram} onChange={e => setHasTelegram(e.target.checked)} />Есть Telegram</label>
          </div>
          <input type="text" className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base" placeholder="Комментарий к номеру телефона" value={phoneComment} onChange={e => setPhoneComment(e.target.value)} />
          <input type="email" className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="text" className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base" placeholder="Веб-сайт" value={website} onChange={e => setWebsite(e.target.value)} />
        </div>
        <div className="mb-6">
          <h3 className="text-base font-medium mb-2">Настройки приватности</h3>
          <div className="space-y-2">
            <label className="flex items-center"><input type="checkbox" className="mr-2" checked={hideNameAndPhoto} onChange={e => setHideNameAndPhoto(e.target.checked)} />Скрыть ФИО и фото</label>
            <label className="flex items-center"><input type="checkbox" className="mr-2" checked={hidePhone} onChange={e => setHidePhone(e.target.checked)} />Скрыть номер телефона</label>
            <label className="flex items-center"><input type="checkbox" className="mr-2" checked={hideEmail} onChange={e => setHideEmail(e.target.checked)} />Скрыть Емайл</label>
            <label className="flex items-center"><input type="checkbox" className="mr-2" checked={hideOtherContacts} onChange={e => setHideOtherContacts(e.target.checked)} />Скрыть остальные контакты</label>
            <label className="flex items-center"><input type="checkbox" className="mr-2" checked={hideCompanyNames} onChange={e => setHideCompanyNames(e.target.checked)} />Скрыть названия компаний в опыте работы</label>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-base font-medium mb-2">Видимость резюме</h3>
          <div className="space-y-2">
            {[
              { value: "public", label: "Видно всем зарегистрированным работодателям на сайте" },
              { value: "excluded_companies", label: "Видно всем, кроме работодателей из черного списка" },
              { value: "selected_companies", label: "Видно только работодателям из белого списка" },
              { value: "link_only", label: "Доступ только по прямой ссылке" },
              { value: "private", label: "Не видно никому" },
            ].map(opt => (
              <label key={opt.value} className="flex items-center">
                <input type="radio" name="visibility" className="mr-2" value={opt.value} checked={visibility === opt.value} onChange={() => setVisibility(opt.value)} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700" onClick={onClose}>Отмена</button>
          <button className="px-6 py-2 rounded-lg bg-blue-600 text-white" onClick={() => {
            // Remove +7 when saving to backend
            const cleanPhone = getCleanPhone(phone);
            onSave({ 
              phone: cleanPhone,
              hasWhatsapp, 
              hasTelegram, 
              phoneComment, 
              email, 
              website, 
              hideNameAndPhoto, 
              hidePhone, 
              hideEmail, 
              hideOtherContacts, 
              hideCompanyNames, 
              visibility 
            });
            onClose();
          }}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

export default function ResumeEditPage({ params }: { params: { id: string } }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [currentPhotoName, setCurrentPhotoName] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    profession_id: undefined as number | undefined,
    salary_expectation: "",
    employment_type_ids: [] as number[],
    work_format_ids: [] as number[],
    business_trips: "" as "yes" | "no" | "sometimes" | "",
    work_experiences: [
      {
        experience_id: undefined as number | undefined,
        company_id: undefined as number | undefined,
        company_name: "",
        city_id: undefined as number | undefined,
        city_name: "",
        position: "",
        profession_id: undefined as number | undefined,
        start_month: undefined as number | undefined,
        start_year: "",
        end_month: undefined as number | undefined,
        end_year: "",
        is_current: false,
        responsibilities: "",
        companySuggestions: [] as Array<{ company_id: number; company_name: string; brand_name: string }>,
        citySuggestions: [] as Array<{ id: number; name: string }>,
        professionSuggestions: [] as Array<{ profession_id: number; name: string }>,
        isLoadingCompany: false,
        isLoadingCity: false,
        isLoadingProfession: false,
      },
    ],
    education_type_id: undefined as number | undefined,
    educations: [
      {
        education_id: undefined as number | undefined,
        institution: "",
        institution_id: undefined as number | undefined,
        institutionSuggestions: [] as Array<{ institution_id: number; name: string }>,
        isLoadingInstitution: false,
        specialization: "",
        specialization_id: undefined as number | undefined,
        specializationSuggestions: [] as Array<{ specialization_id: number; name: string }>,
        isLoadingSpecialization: false,
        end_year: "",
      },
    ],
    professional_summary: "",
    phone: "",
    phoneComment: "",
    hasWhatsapp: false,
    hasTelegram: false,
    email: "",
    website: "",
    hideNameAndPhoto: false,
    hidePhone: false,
    hideEmail: false,
    hideOtherContacts: false,
    hideCompanyNames: false,
    visibility: "public" as "public" | "private" | "selected_companies" | "excluded_companies" | "link_only",
  });
  const [suggestions, setSuggestions] = useState<Array<{ profession_id: number; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isWorkCondModalOpen, setIsWorkCondModalOpen] = useState(false);
  
  const fetchResumeData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/resume/' + params.id + '/edit');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/resumes/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки резюме');
      }

      const data = await response.json();
      const resume = data.resume;
      setForm({
        ...form,
        work_experiences: (data.work_experiences || []).map((exp: any) => ({
          experience_id: exp.experience_id,
          company_id: exp.company_id,
          company_name: exp.company_name || "",
          city_id: exp.city_id,
          city_name: exp.city?.name || exp.city_name || "",
          position: exp.position || "",
          profession_id: exp.profession_id,
          profession_name: exp.profession?.name || "",
          start_month: exp.start_month,
          start_year: exp.start_year?.toString() || "",
          end_month: exp.end_month,
          end_year: exp.end_year?.toString() || "",
          is_current: exp.is_current || false,
          responsibilities: exp.responsibilities || "",
          companySuggestions: [],
          citySuggestions: [],
          professionSuggestions: [],
          isLoadingCompany: false,
          isLoadingCity: false,
          isLoadingProfession: false,
        })),
        educations: (data.educations || []).map((edu: any) => ({
          education_id: edu.education_id,
          institution: edu.institution?.name || edu.institution || "",
          institution_id: edu.institution_id,
          specialization: edu.specialization?.name || edu.specialization || "",
          specialization_id: edu.specialization_id,
          end_year: edu.end_year?.toString() || "",
          institutionSuggestions: [],
          specializationSuggestions: [],
          isLoadingInstitution: false,
          isLoadingSpecialization: false,
        })),
      });
    } catch (error) {
      console.error('Error fetching resume:', error);
      setErrorMessage('Ошибка загрузки резюме');
      setIsErrorModalOpen(true);
    }
  }, [params.id, router, form]);
  const [isTitlePhotoModalOpen, setIsTitlePhotoModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [showWorkExpModal, setShowWorkExpModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [selectedWorkExp, setSelectedWorkExp] = useState<any>(null);
  const [selectedEducation, setSelectedEducation] = useState<any>(null);

  const handleSaveDraft = async () => {
    await handlePartialSave({}, null);
    setIsErrorModalOpen(false);
  };

  const handlePublish = async () => {
    await handlePartialSave({}, null);
    setIsErrorModalOpen(false);
    router.push(`/user/resume/${params.id}`);
  };

  const handlePartialSave = async (updatedData: any, newPhoto: File | null, deletePhoto: boolean = false) => {
    const token = localStorage.getItem('token');

    // Объединяем данные формы с обновлениями
    const resumeData = { ...form, ...updatedData };

    // Загружаем фото, если оно есть
    let photoFileName = null;
    if (newPhoto) {
      try {
        const uploadRes = await uploadFile(newPhoto, 'photo');
        if (uploadRes.error || !uploadRes.data?.fileName) {
          throw new Error(uploadRes.error || 'Не удалось загрузить фото');
        }
        photoFileName = uploadRes.data.fileName;
      } catch (e: any) {
        setErrorMessage(e.message || 'Ошибка загрузки фото');
        setIsErrorModalOpen(true);
        return;
      }
    }

    // Формируем JSON-объект для отправки
    const jsonData: any = {
      title: resumeData.title ? resumeData.title : null,
      profession_id: resumeData.profession_id ? resumeData.profession_id : null,
      salary_expectation: resumeData.salary_expectation ? Number(resumeData.salary_expectation) : null,
      employment_type_ids: resumeData.employment_type_ids || [],
      work_format_ids: resumeData.work_format_ids || [],
      business_trips: resumeData.business_trips ? resumeData.business_trips : null,
      education_type_id: resumeData.education_type_id ? resumeData.education_type_id : null,
      professional_summary: resumeData.professional_summary ? resumeData.professional_summary : null,
      phone: resumeData.phone ? String(resumeData.phone).replace(/^\+/, '') : null,
      phone_comment: resumeData.phoneComment ? resumeData.phoneComment : null,
      has_whatsapp: resumeData.hasWhatsapp || false,
      has_telegram: resumeData.hasTelegram || false,
      email: resumeData.email ? resumeData.email : null,
      website_url: resumeData.website ? resumeData.website : null,
      hide_full_name: resumeData.hideNameAndPhoto || false,
      hide_phone: resumeData.hidePhone || false,
      hide_email: resumeData.hideEmail || false,
      hide_other_contacts: resumeData.hideOtherContacts || false,
      hide_experience: resumeData.hideCompanyNames || false,
      visibility: resumeData.visibility || 'public',
    };

    // Добавляем photo_url: новое фото, null при удалении, или не трогаем
    if (photoFileName) {
      jsonData.photo_url = photoFileName;
      // Если загрузили новое фото и было старое - удаляем старое
      if (currentPhotoName && currentPhotoName !== photoFileName) {
        try {
          await deleteFile(currentPhotoName, 'photo');
        } catch (e) {
          console.error('Ошибка при удалении старого фото:', e);
        }
      }
      setCurrentPhotoName(photoFileName);
    } else if (deletePhoto) {
      jsonData.photo_url = null;
      // Удаляем файл физически
      if (currentPhotoName) {
        try {
          await deleteFile(currentPhotoName, 'photo');
          setCurrentPhotoName(null);
        } catch (e) {
          console.error('Ошибка при удалении фото:', e);
        }
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/resumes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка сохранения резюме');
      }

      // Обновляем состояние формы и фото после успешного сохранения
      setForm(resumeData);
      if (newPhoto) {
        setPhoto(newPhoto);
        const reader = new FileReader();
        reader.onload = e => setPhotoPreview(e.target?.result as string);
        reader.readAsDataURL(newPhoto);
      } else if (photo && !newPhoto) {
        // Если фото было удалено
        setPhoto(null);
        setPhotoPreview(null);
      }

    } catch (error: any) {
      setErrorMessage(error.message);
      setIsErrorModalOpen(true);
    }
  };

  // Загрузка данных резюме при монтировании компонента
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/resume/' + params.id + '/edit');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/resumes/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Ошибка загрузки резюме');
        }

        const data = await response.json();
        const resume = data.resume;
        setForm({
          title: resume.title || "",
          profession_id: resume.profession_id,
          salary_expectation: resume.salary_expectation?.toString() || "",
          employment_type_ids: resume.employment_types?.map((et: any) => et.employment_type_id) || [],
          work_format_ids: resume.work_formats?.map((wf: any) => wf.work_format_id) || [],
          business_trips: resume.business_trips || "",
          work_experiences: (data.work_experiences || []).map((exp: any) => ({
            experience_id: exp.experience_id,
            company_id: exp.company_id,
            company_name: exp.company_name || "",
            city_id: exp.city_id,
            city_name: exp.city?.name || exp.city_name || "",
            position: exp.position || "",
            profession_id: exp.profession_id,
            profession_name: exp.profession?.name || "",
            start_month: exp.start_month,
            start_year: exp.start_year?.toString() || "",
            end_month: exp.end_month,
            end_year: exp.end_year?.toString() || "",
            is_current: exp.is_current || false,
            responsibilities: exp.responsibilities || "",
            companySuggestions: [],
            citySuggestions: [],
            professionSuggestions: [],
            isLoadingCompany: false,
            isLoadingCity: false,
            isLoadingProfession: false,
          })),
          education_type_id: resume.education_type_id,
          educations: (data.educations || []).map((edu: any) => ({
            education_id: edu.education_id,
            institution: edu.institution?.name || edu.institution || "",
            institution_id: edu.institution_id,
            specialization: edu.specialization?.name || edu.specialization || "",
            specialization_id: edu.specialization_id,
            end_year: edu.end_year?.toString() || "",
            institutionSuggestions: [],
            specializationSuggestions: [],
            isLoadingInstitution: false,
            isLoadingSpecialization: false,
          })),
          professional_summary: resume.professional_summary || "",
          phone: resume.phone || "",
          phoneComment: resume.phone_comment || "",
          hasWhatsapp: resume.has_whatsapp || false,
          hasTelegram: resume.has_telegram || false,
          email: resume.email || "",
          website: resume.website_url || "",
          hideNameAndPhoto: resume.hide_full_name || false,
          hidePhone: resume.hide_phone || false,
          hideEmail: resume.hide_email || false,
          hideOtherContacts: resume.hide_other_contacts || false,
          hideCompanyNames: resume.hide_experience || false,
          visibility: resume.visibility || "public",
        });
        if (resume.photo_url) {
          const isPath = typeof resume.photo_url === 'string' && resume.photo_url.includes('/');
          // Сохраняем имя файла для возможного удаления
          if (!isPath) {
            setCurrentPhotoName(resume.photo_url);
          } else {
            // Если это путь, попробуем извлечь имя файла
            const parts = resume.photo_url.split('/');
            setCurrentPhotoName(parts[parts.length - 1]);
          }

          const photoUrl = isPath
            ? `${API_BASE_URL}/${resume.photo_url}`
            : `/uploads/photo/${resume.photo_url}`;
          setPhotoPreview(photoUrl);
        }
      } catch (error) {
        console.error('Error fetching resume:', error);
        setErrorMessage('Ошибка загрузки резюме');
        setIsErrorModalOpen(true);
      }
    };

    fetchResume();
  }, [params.id, router]);

  // Обработка ввода должности с автокомплитом
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, title: value }));
    if (value.trim()) {
      setIsLoading(true);
      fetch(`${API_ENDPOINTS.dictionaries.professionsSearch}?query=${encodeURIComponent(value)}`)
        .then((res) => res.json())
        .then((data) => {
          setSuggestions(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching suggestions:", err);
          setIsLoading(false);
        });
    } else {
      setSuggestions([]);
    }
  };

  // Обработка выбора профессии из подсказок
  const handleSuggestionClick = (name: string, id?: number) => {
    setForm((prev) => ({ ...prev, title: name, profession_id: id }));
    setSuggestions([]);
  };

  // Обработка изменения желаемого уровня дохода
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, salary_expectation: e.target.value }));
  };

  // Обработка изменения типа занятости
  const handleEmploymentTypeChange = (typeId: number) => {
    setForm((prev) => ({
      ...prev,
      employment_type_ids: prev.employment_type_ids.includes(typeId)
        ? prev.employment_type_ids.filter((id) => id !== typeId)
        : [...prev.employment_type_ids, typeId],
    }));
  };

  // Обработка изменения формата работы
  const handleWorkFormatChange = (formatId: number) => {
    setForm((prev) => ({
      ...prev,
      work_format_ids: prev.work_format_ids.includes(formatId)
        ? prev.work_format_ids.filter((id) => id !== formatId)
        : [...prev.work_format_ids, formatId],
    }));
  };

  // Обработка изменения командировок
  const handleBusinessTripsChange = (value: "yes" | "no" | "sometimes") => {
    setForm((prev) => ({
      ...prev,
      business_trips: value,
    }));
  };

  // Обработчики для work_experiences
  const handleWorkExpChange = (idx: number, field: string, value: any) => {
    setForm((prev) => {
      const updated = [...prev.work_experiences];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, work_experiences: updated };
    });
  };

  const handleAddWorkExp = () => {
    setForm((prev) => ({
      ...prev,
      work_experiences: [
        ...prev.work_experiences,
        {
          experience_id: undefined,
          company_id: undefined,
          company_name: "",
          city_id: undefined,
          city_name: "",
          position: "",
          profession_id: undefined,
          start_month: undefined,
          start_year: "",
          end_month: undefined,
          end_year: "",
          is_current: false,
          responsibilities: "",
          companySuggestions: [],
          citySuggestions: [],
          professionSuggestions: [],
          isLoadingCompany: false,
          isLoadingCity: false,
          isLoadingProfession: false,
        },
      ],
    }));
  };

  const handleRemoveWorkExp = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      work_experiences: prev.work_experiences.filter((_, i) => i !== idx),
    }));
  };

  // Автокомплит для компании
  const handleCompanyInput = async (idx: number, value: string) => {
    handleWorkExpChange(idx, "company_name", value);
    handleWorkExpChange(idx, "company_id", undefined);
    if (!value.trim()) {
      handleWorkExpChange(idx, "companySuggestions", []);
      return;
    }
    handleWorkExpChange(idx, "isLoadingCompany", true);
    try {
      const res = await fetch(`${API_ENDPOINTS.dictionaries.companiesSearch}?query=${encodeURIComponent(value)}`);
      const data = await res.json();
      handleWorkExpChange(idx, "companySuggestions", data);
    } catch (e) {
      handleWorkExpChange(idx, "companySuggestions", []);
    }
    handleWorkExpChange(idx, "isLoadingCompany", false);
  };
  const handleCompanySelect = (idx: number, company: { company_id: number; company_name: string; brand_name: string }) => {
    handleWorkExpChange(idx, "company_id", company.company_id);
    handleWorkExpChange(idx, "company_name", company.company_name);
    handleWorkExpChange(idx, "companySuggestions", []);
  };

  // Для work_experiences (3-й шаг) используем отдельные обработчики
  const handleCityInput = async (idx: number, value: string) => {
    handleWorkExpChange(idx, "city_name", value);
    if (!value.trim()) {
      handleWorkExpChange(idx, "citySuggestions", []);
      return;
    }
    handleWorkExpChange(idx, "isLoadingCity", true);
    try {
      const res = await fetch(`${API_ENDPOINTS.citiesSearch}?query=${encodeURIComponent(value)}`);
      let data = await res.json();
      data = data.map((city: any) => ({ city_id: city.city_id ?? city.id, name: city.name }));
      handleWorkExpChange(idx, "citySuggestions", data);
    } catch (e) {
      handleWorkExpChange(idx, "citySuggestions", []);
    }
    handleWorkExpChange(idx, "isLoadingCity", false);
  };

  const handleProfessionInput = async (idx: number, value: string) => {
    handleWorkExpChange(idx, "position", value);
    handleWorkExpChange(idx, "profession_id", undefined);
    if (!value.trim()) {
      handleWorkExpChange(idx, "professionSuggestions", []);
      return;
    }
    handleWorkExpChange(idx, "isLoadingProfession", true);
    try {
      const res = await fetch(`${API_ENDPOINTS.dictionaries.professionsSearch}?query=${encodeURIComponent(value)}`);
      const data = await res.json();
      handleWorkExpChange(idx, "professionSuggestions", data);
    } catch (e) {
      handleWorkExpChange(idx, "professionSuggestions", []);
    }
    handleWorkExpChange(idx, "isLoadingProfession", false);
  };
  const handleProfessionSelect = (idx: number, prof: { profession_id: number; name: string }) => {
    handleWorkExpChange(idx, "profession_id", prof.profession_id);
    handleWorkExpChange(idx, "position", prof.name);
    handleWorkExpChange(idx, "professionSuggestions", []);
  };

  // Образование
  const handleEducationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, education_type_id: Number(e.target.value) }));
  };
  const handleAddEducation = () => {
    setForm((prev) => ({
      ...prev,
      educations: [
        ...prev.educations,
        {
          education_id: undefined,
          institution: "",
          institution_id: undefined,
          institutionSuggestions: [],
          isLoadingInstitution: false,
          specialization: "",
          specialization_id: undefined,
          specializationSuggestions: [],
          isLoadingSpecialization: false,
          end_year: "",
        },
      ],
    }));
  };
  const handleRemoveEducation = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== idx),
    }));
  };
  const handleEducationChange = (idx: number, field: string, value: any) => {
    setForm((prev) => {
      const updated = [...prev.educations];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, educations: updated };
    });
  };
  const handleInstitutionInput = async (idx: number, value: string) => {
    handleEducationChange(idx, "institution", value);
    handleEducationChange(idx, "institution_id", undefined);
    if (!value.trim()) {
      handleEducationChange(idx, "institutionSuggestions", []);
      return;
    }
    handleEducationChange(idx, "isLoadingInstitution", true);
    try {
      const res = await fetch(`${API_ENDPOINTS.dictionaries.educationalInstitutionsSearch}?query=${encodeURIComponent(value)}`);
      const data = await res.json();
      handleEducationChange(idx, "institutionSuggestions", data);
    } catch (e) {
      handleEducationChange(idx, "institutionSuggestions", []);
    }
    handleEducationChange(idx, "isLoadingInstitution", false);
  };
  const handleInstitutionSelect = (idx: number, inst: { institution_id: number; name: string }) => {
    handleEducationChange(idx, "institution_id", inst.institution_id);
    handleEducationChange(idx, "institution", inst.name);
    handleEducationChange(idx, "institutionSuggestions", []);
  };
  const handleSpecializationInput = async (idx: number, value: string) => {
    handleEducationChange(idx, "specialization", value);
    handleEducationChange(idx, "specialization_id", undefined);
    if (!value.trim()) {
      handleEducationChange(idx, "specializationSuggestions", []);
      return;
    }
    handleEducationChange(idx, "isLoadingSpecialization", true);
    try {
      const res = await fetch(`${API_ENDPOINTS.dictionaries.specializationsSearch}?query=${encodeURIComponent(value)}`);
      const data = await res.json();
      handleEducationChange(idx, "specializationSuggestions", data);
    } catch (e) {
      handleEducationChange(idx, "specializationSuggestions", []);
    }
    handleEducationChange(idx, "isLoadingSpecialization", false);
  };
  const handleSpecializationSelect = (idx: number, spec: { specialization_id: number; name: string }) => {
    handleEducationChange(idx, "specialization_id", spec.specialization_id);
    handleEducationChange(idx, "specialization", spec.name);
    handleEducationChange(idx, "specializationSuggestions", []);
  };

  // О себе
  const handleProfessionalSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, professional_summary: e.target.value }));
  };

  // Контакты
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    
    // Получаем только цифры из введенного значения, исключая +7
    let value = input.value.replace(/[^\d]/g, '');
    if (value.startsWith('7')) {
      value = value.slice(1);
    }
    
    // Ограничиваем длину до 10 цифр
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    
    // Форматируем номер
    const formattedValue = value.length > 0 ? `+7${value}` : '';
    
    setForm((prev) => ({ ...prev, phone: formattedValue }));

    // Восстанавливаем позицию курсора
    requestAnimationFrame(() => {
      // Всегда ставим курсор в конец, если вводим новую цифру
      const newPosition = formattedValue.length;
      input.setSelectionRange(newPosition, newPosition);
    });
  };
  const handleHasWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, hasWhatsapp: e.target.checked }));
  };
  const handleHasTelegramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, hasTelegram: e.target.checked }));
  };
  const handlePhoneCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, phoneComment: e.target.value }));
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, email: e.target.value }));
  };
  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, website: e.target.value }));
  };

  // Приватность
  const handleHideNameAndPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, hideNameAndPhoto: e.target.checked }));
  };
  const handleHidePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, hidePhone: e.target.checked }));
  };
  const handleHideEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, hideEmail: e.target.checked }));
  };
  const handleHideOtherContactsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, hideOtherContacts: e.target.checked }));
  };
  const handleHideCompanyNamesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, hideCompanyNames: e.target.checked }));
  };
  const handleVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, visibility: e.target.value as "public" | "private" | "selected_companies" | "excluded_companies" | "link_only" }));
  };

  // Фото
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Загрузка файла и сохранение имени
    const res = await uploadFile(file, 'photo');
    if (res.error || !res.data?.fileName) {
      console.error('Ошибка загрузки фото:', res.error);
      return;
    }
    setPhotoFileName(res.data.fileName);
  };

  // Изменяем функцию handleSave для отправки PUT запроса
  const handleSave = async () => {
    try {
      // Проверка обязательных полей
      if (!form.title.trim()) {
        setErrorMessage('Укажите желаемую должность');
        setIsErrorModalOpen(true);
        return;
      }
      if (form.employment_type_ids.length === 0) {
        setErrorMessage('Выберите хотя бы один тип занятости');
        setIsErrorModalOpen(true);
        return;
      }
      if (form.work_format_ids.length === 0) {
        setErrorMessage('Выберите хотя бы один формат работы');
        setIsErrorModalOpen(true);
        return;
      }
      if (!form.education_type_id) {
        setErrorMessage('Укажите уровень образования');
        setIsErrorModalOpen(true);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/resume/' + params.id + '/edit');
        return;
      }

      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('profession_id', String(form.profession_id));
      if (form.professional_summary) formData.append('professional_summary', form.professional_summary);
      if (form.salary_expectation) formData.append('salary_expectation', form.salary_expectation);
      formData.append('visibility', form.visibility);
      if (form.phone) formData.append('phone', form.phone.replace(/^\+/, ''));
      if (form.email) formData.append('email', form.email);
      if (form.website) formData.append('website_url', form.website);
      formData.append('has_whatsapp', String(form.hasWhatsapp));
      formData.append('has_telegram', String(form.hasTelegram));
      formData.append('education_type_id', String(form.education_type_id));
      if (photoFileName) formData.append('photo_url', photoFileName);
      formData.append('hide_full_name', String(form.hideNameAndPhoto));
      formData.append('hide_phone', String(form.hidePhone));
      formData.append('hide_email', String(form.hideEmail));
      formData.append('hide_other_contacts', String(form.hideOtherContacts));
      formData.append('hide_experience', String(form.hideCompanyNames));
      if (form.phoneComment) formData.append('phone_comment', form.phoneComment);
      if (form.business_trips) formData.append('business_trips', form.business_trips);
      form.employment_type_ids.forEach(id => formData.append('employment_type_ids[]', String(id)));
      form.work_format_ids.forEach(id => formData.append('work_format_ids[]', String(id)));

      // work_experiences
      form.work_experiences.forEach((exp, index) => {
        const hasAny = exp.company_id || exp.company_name || exp.city_id || exp.position || exp.profession_id || exp.start_month || exp.start_year || exp.end_month || exp.end_year || exp.responsibilities;
        if (!hasAny) return;
        if (exp.experience_id) formData.append(`work_experiences[${index}][experience_id]`, String(exp.experience_id));
        if (exp.company_id) formData.append(`work_experiences[${index}][company_id]`, String(exp.company_id));
        if (exp.company_name) formData.append(`work_experiences[${index}][company_name]`, exp.company_name);
        if (exp.city_id) formData.append(`work_experiences[${index}][city_id]`, String(exp.city_id));
        if (exp.position) formData.append(`work_experiences[${index}][position]`, exp.position);
        if (exp.profession_id) formData.append(`work_experiences[${index}][profession_id]`, String(exp.profession_id));
        if (exp.start_month) formData.append(`work_experiences[${index}][start_month]`, String(exp.start_month));
        if (exp.start_year) formData.append(`work_experiences[${index}][start_year]`, exp.start_year);
        if (exp.end_month) formData.append(`work_experiences[${index}][end_month]`, String(exp.end_month));
        if (exp.end_year) formData.append(`work_experiences[${index}][end_year]`, exp.end_year);
        formData.append(`work_experiences[${index}][is_current]`, String(exp.is_current));
        if (exp.responsibilities) formData.append(`work_experiences[${index}][responsibilities]`, exp.responsibilities);
      });

      // educations
      form.educations.forEach((edu, index) => {
        if (edu.education_id) formData.append(`educations[${index}][education_id]`, String(edu.education_id));
        if (edu.institution_id) formData.append(`educations[${index}][institution_id]`, String(edu.institution_id));
        if (edu.specialization_id) formData.append(`educations[${index}][specialization_id]`, String(edu.specialization_id));
        if (edu.end_year) formData.append(`educations[${index}][end_year]`, edu.end_year);
      });

      const response = await fetch(`${API_BASE_URL}/api/resumes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Произошла ошибка при обновлении резюме';
        switch (response.status) {
          case 400:
            errorMessage = 'Проверьте правильность заполнения данных формы';
            break;
          case 401:
            localStorage.removeItem('token');
            router.push('/login?redirect=/resume/' + params.id + '/edit');
            return;
          case 403:
            errorMessage = 'У вас нет прав для выполнения этого действия';
            break;
          case 404:
            errorMessage = 'Резюме не найдено';
            break;
          case 500:
            errorMessage = 'Произошла ошибка на сервере. Пожалуйста, попробуйте позже';
            break;
        }
        setErrorMessage(errorMessage);
        setIsErrorModalOpen(true);
        return;
      }

      router.push('/resume/' + params.id);
    } catch (error) {
      console.error('Error updating resume:', error);
      setErrorMessage('Произошла ошибка при обновлении резюме. Пожалуйста, попробуйте позже');
      setIsErrorModalOpen(true);
    }
  };

  const handleSaveAndClose = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/resume/' + params.id + '/edit');
        return;
      }

      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('profession_id', String(form.profession_id));
      if (form.professional_summary) formData.append('professional_summary', form.professional_summary);
      if (form.salary_expectation) formData.append('salary_expectation', form.salary_expectation);
      formData.append('visibility', form.visibility);
      if (form.phone) formData.append('phone', form.phone.replace(/^\+/, ''));
      if (form.email) formData.append('email', form.email);
      if (form.website) formData.append('website_url', form.website);
      formData.append('has_whatsapp', String(form.hasWhatsapp));
      formData.append('has_telegram', String(form.hasTelegram));
      formData.append('education_type_id', String(form.education_type_id));
      if (photo) formData.append('photo', photo);
      formData.append('hide_full_name', String(form.hideNameAndPhoto));
      formData.append('hide_phone', String(form.hidePhone));
      formData.append('hide_email', String(form.hideEmail));
      formData.append('hide_other_contacts', String(form.hideOtherContacts));
      formData.append('hide_experience', String(form.hideCompanyNames));
      if (form.phoneComment) formData.append('phone_comment', form.phoneComment);
      if (form.business_trips) formData.append('business_trips', form.business_trips);
      form.employment_type_ids.forEach(id => formData.append('employment_type_ids[]', String(id)));
      form.work_format_ids.forEach(id => formData.append('work_format_ids[]', String(id)));

      // work_experiences
      form.work_experiences.forEach((exp, index) => {
        const hasAny = exp.company_id || exp.company_name || exp.city_id || exp.position || exp.profession_id || exp.start_month || exp.start_year || exp.end_month || exp.end_year || exp.responsibilities;
        if (!hasAny) return;
        if (exp.experience_id) formData.append(`work_experiences[${index}][experience_id]`, String(exp.experience_id));
        if (exp.company_id) formData.append(`work_experiences[${index}][company_id]`, String(exp.company_id));
        if (exp.company_name) formData.append(`work_experiences[${index}][company_name]`, exp.company_name);
        if (exp.city_id) formData.append(`work_experiences[${index}][city_id]`, String(exp.city_id));
        if (exp.position) formData.append(`work_experiences[${index}][position]`, exp.position);
        if (exp.profession_id) formData.append(`work_experiences[${index}][profession_id]`, String(exp.profession_id));
        if (exp.start_month) formData.append(`work_experiences[${index}][start_month]`, String(exp.start_month));
        if (exp.start_year) formData.append(`work_experiences[${index}][start_year]`, exp.start_year);
        if (exp.end_month) formData.append(`work_experiences[${index}][end_month]`, String(exp.end_month));
        if (exp.end_year) formData.append(`work_experiences[${index}][end_year]`, exp.end_year);
        formData.append(`work_experiences[${index}][is_current]`, String(exp.is_current));
        if (exp.responsibilities) formData.append(`work_experiences[${index}][responsibilities]`, exp.responsibilities);
      });

      // educations
      form.educations.forEach((edu, index) => {
        if (edu.education_id) formData.append(`educations[${index}][education_id]`, String(edu.education_id));
        if (edu.institution_id) formData.append(`educations[${index}][institution_id]`, String(edu.institution_id));
        if (edu.specialization_id) formData.append(`educations[${index}][specialization_id]`, String(edu.specialization_id));
        if (edu.end_year) formData.append(`educations[${index}][end_year]`, edu.end_year);
      });

      const response = await fetch(`${API_BASE_URL}/api/resumes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Произошла ошибка при обновлении резюме';
        switch (response.status) {
          case 400:
            errorMessage = 'Проверьте правильность заполнения данных формы';
            break;
          case 401:
            localStorage.removeItem('token');
            router.push('/login?redirect=/resume/' + params.id + '/edit');
            return;
          case 403:
            errorMessage = 'У вас нет прав для выполнения этого действия';
            break;
          case 404:
            errorMessage = 'Резюме не найдено';
            break;
          case 500:
            errorMessage = 'Произошла ошибка на сервере. Пожалуйста, попробуйте позже';
            break;
        }
        setErrorMessage(errorMessage);
        setIsErrorModalOpen(true);
        return;
      }

      router.push('/resume');
    } catch (error) {
      console.error('Error updating resume:', error);
      setErrorMessage('Произошла ошибка при обновлении резюме. Пожалуйста, попробуйте позже');
      setIsErrorModalOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFCFE]">
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start pt-16 bg-white">
        <div className="w-full max-w-2xl">
          <TitlePhotoBlock form={form} photoPreview={photoPreview} onEdit={() => setIsTitlePhotoModalOpen(true)} />
          <WorkConditionsBlock form={form} onEdit={() => setIsWorkCondModalOpen(true)} />
          
          <WorkExperienceBlock 
            workExperiences={form.work_experiences || []} 
            resumeId={Number(params.id)} 
            onUpdated={fetchResumeData} 
          />
          
          <EducationBlock 
            educations={form.educations || []} 
            resumeId={Number(params.id)} 
            onUpdated={fetchResumeData} 
          />
          
          <AboutBlock form={form} onEdit={() => setIsAboutModalOpen(true)} />
          <ContactsBlock form={form} onEdit={() => setIsContactsModalOpen(true)} />
        </div>
        {isTitlePhotoModalOpen && (
          <TitlePhotoModal
            form={form}
            photoPreview={photoPreview}
            onClose={() => setIsTitlePhotoModalOpen(false)}
            onSave={(data, newPhoto, deletePhoto) => {
              handlePartialSave(data, newPhoto, deletePhoto);
              setIsTitlePhotoModalOpen(false);
            }}
          />
        )}
        {isWorkCondModalOpen && (
          <WorkConditionsModal
            form={form}
            onClose={() => setIsWorkCondModalOpen(false)}
            onSave={data => {
              handlePartialSave(data, null);
              setIsWorkCondModalOpen(false);
            }}
          />
        )}
        {isAboutModalOpen && (
          <AboutModal
            form={form}
            onClose={() => setIsAboutModalOpen(false)}
            onSave={data => {
              handlePartialSave(data, null);
              setIsAboutModalOpen(false);
            }}
          />
        )}
        {isContactsModalOpen && (
          <ContactsModal
            form={form}
            onClose={() => setIsContactsModalOpen(false)}
            onSave={data => {
              handlePartialSave(data, null);
              setIsContactsModalOpen(false);
            }}
          />
        )}
      </main>

      {/* Модальное окно с ошибкой */}
      {isErrorModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Редактирование резюме</h1>
                <div className="flex space-x-4">
                  <button
                    onClick={handleSaveDraft}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Сохранить черновик
                  </button>
                  <button
                    onClick={handlePublish}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Опубликовать
                  </button>
                </div>
              </div>
              
              {/* Work Experience Modal */}
              {showWorkExpModal && (
                <WorkExperienceItemModal
                  experience={null}
                  resumeId={Number(params.id)}
                  onClose={() => {
                    setShowWorkExpModal(false);
                    setSelectedWorkExp(null);
                  }}
                  onSaved={() => {
                    setShowWorkExpModal(false);
                    setSelectedWorkExp(null);
                    // Refresh work experiences
                    const token = localStorage.getItem('token');
                    fetch(`${API_BASE_URL}/api/resumes/${params.id}`, {
                      headers: { 'Authorization': `Bearer ${token}` },
                    })
                    .then(response => response.json())
                    .then(data => {
                      setForm(f => ({
                        ...f,
                        work_experiences: (data.work_experiences || []).map((exp: any) => ({
                          experience_id: exp.experience_id,
                          company_id: exp.company_id,
                          company_name: exp.company_name || "",
                          city_id: exp.city_id,
                          city_name: exp.city?.name || "",
                          position: exp.position || "",
                          profession_id: exp.profession_id,
                          profession_name: exp.profession?.name || "",
                          start_month: exp.start_month,
                          start_year: exp.start_year?.toString() || "",
                          end_month: exp.end_month,
                          end_year: exp.end_year?.toString() || "",
                          is_current: exp.is_current || false,
                          responsibilities: exp.responsibilities || "",
                          companySuggestions: [],
                          citySuggestions: [],
                          professionSuggestions: [],
                          isLoadingCompany: false,
                          isLoadingCity: false,
                          isLoadingProfession: false,
                        }))
                      }));
                    });
                  }}
                  onDeleted={() => {
                    setShowWorkExpModal(false);
                    setSelectedWorkExp(null);
                    // Refresh work experiences
                    const token = localStorage.getItem('token');
                    fetch(`${API_BASE_URL}/api/resumes/${params.id}`, {
                      headers: { 'Authorization': `Bearer ${token}` },
                    })
                    .then(response => response.json())
                    .then(data => {
                      setForm(f => ({
                        ...f,
                        work_experiences: (data.work_experiences || []).map((exp: any) => ({
                          experience_id: exp.experience_id,
                          company_id: exp.company_id,
                          company_name: exp.company_name || "",
                          city_id: exp.city_id,
                          city_name: exp.city?.name || "",
                          position: exp.position || "",
                          profession_id: exp.profession_id,
                          profession_name: exp.profession?.name || "",
                          start_month: exp.start_month,
                          start_year: exp.start_year?.toString() || "",
                          end_month: exp.end_month,
                          end_year: exp.end_year?.toString() || "",
                          is_current: exp.is_current || false,
                          responsibilities: exp.responsibilities || "",
                          companySuggestions: [],
                          citySuggestions: [],
                          professionSuggestions: [],
                          isLoadingCompany: false,
                          isLoadingCity: false,
                          isLoadingProfession: false,
                        }))
                      }));
                    });
                  }}
                />
              )}
              
              {/* Education Modal */}
              {showEducationModal && (
                <EducationItemModal
                  education={null}
                  resumeId={Number(params.id)}
                  onClose={() => {
                    setShowEducationModal(false);
                    setSelectedEducation(null);
                  }}
                  onSaved={() => {
                    setShowEducationModal(false);
                    setSelectedEducation(null);
                    // Refresh educations
                    const token = localStorage.getItem('token');
                    fetch(`${API_BASE_URL}/api/resumes/${params.id}`, {
                      headers: { 'Authorization': `Bearer ${token}` },
                    })
                    .then(response => response.json())
                    .then(data => {
                      setForm(f => ({
                        ...f,
                        educations: (data.educations || []).map((edu: any) => ({
                          education_id: edu.education_id,
                          institution: edu.institution?.name || edu.institution || "",
                          institution_id: edu.institution_id,
                          specialization: edu.specialization?.name || edu.specialization || "",
                          specialization_id: edu.specialization_id,
                          end_year: edu.end_year?.toString() || "",
                          institutionSuggestions: [],
                          specializationSuggestions: [],
                          isLoadingInstitution: false,
                          isLoadingSpecialization: false,
                        }))
                      }));
                    });
                  }}
                  onDeleted={() => {
                    setShowEducationModal(false);
                    setSelectedEducation(null);
                    // Refresh educations
                    const token = localStorage.getItem('token');
                    fetch(`${API_BASE_URL}/api/resumes/${params.id}`, {
                      headers: { 'Authorization': `Bearer ${token}` },
                    })
                    .then(response => response.json())
                    .then(data => {
                      setForm(f => ({
                        ...f,
                        educations: (data.educations || []).map((edu: any) => ({
                          education_id: edu.education_id,
                          institution: edu.institution?.name || edu.institution || "",
                          institution_id: edu.institution_id,
                          specialization: edu.specialization?.name || edu.specialization || "",
                          specialization_id: edu.specialization_id,
                          end_year: edu.end_year?.toString() || "",
                          institutionSuggestions: [],
                          specializationSuggestions: [],
                          isLoadingInstitution: false,
                          isLoadingSpecialization: false,
                        }))
                      }));
                    });
                  }}
                />
              )}
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsErrorModalOpen(false)}
                  className="bg-[#2B81B0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#18608a] transition"
                >
                  Понятно
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 