'use client';

import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';

// Import config data
import educationTypesData from '../config/education_types_202505242225.json';
import drivingLicenseData from '../config/driving_license_categories_202505172315.json';
import employmentTypesData from '../config/employment_types_202505222228.json';
import languagesData from '../config/languages_202505172245.json';
import workFormatsData from '../config/work_formats_202505222228.json';

// Types
interface Location {
  city_id?: number;
  region_id?: number;
  name: string;
  type: 'city' | 'region';
}

interface Profession {
  id: number;
  name: string;
}

interface LanguageFilter {
  language_id: number;
  proficiency_level: string;
}

type ResumeFilterMode =
  | 'all'
  | 'location'
  | 'job_search_status'
  | 'employment_type'
  | 'work_format'
  | 'experience'
  | 'salary';

export interface ResumeFilters {
  region_ids: number[];
  city_ids: number[];
  job_search_status: string[];
  age_min?: number;
  age_max?: number;
  has_photo?: boolean;
  employment_type_ids: number[];
  work_format_ids: number[];
  total_experience_level: string[];
  profession_ids: number[];
  gender?: string;
  salary_min?: number;
  salary_max?: number;
  education_type_ids: number[];
  skill_ids: number[];
  driving_license_category_ids: number[];
  languages: LanguageFilter[];
}

interface ResumeFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ResumeFilters) => void;
  initialFilters?: Partial<ResumeFilters>;
  mode?: ResumeFilterMode;
}

const PROFICIENCY_LEVELS = [
  { value: 'A1', label: 'A1 — Начальный' },
  { value: 'A2', label: 'A2 — Элементарный' },
  { value: 'B1', label: 'B1 — Средний' },
  { value: 'B2', label: 'B2 — Выше среднего' },
  { value: 'C1', label: 'C1 — Продвинутый' },
  { value: 'C2', label: 'C2 — Владение в совершенстве' },
  { value: 'native', label: 'Родной' },
];

const JOB_SEARCH_STATUSES = [
  { value: 'actively_looking', label: 'Активно ищет работу' },
  { value: 'considering_offers', label: 'Рассматривает предложения' },
  { value: 'not_looking', label: 'Не ищет работу' },
];

const EXPERIENCE_LEVELS = [
  { value: '0', label: 'Без опыта' },
  { value: '0_1', label: 'От 1 года до 3 лет' },
  { value: '1_3', label: 'От 1 года до 3 лет' },
  { value: '3_5', label: 'От 3 до 6 лет' },
  { value: 'more_5', label: 'Более 6 лет' },
];

export default function ResumeFiltersModal({ isOpen, onClose, onApply, initialFilters, mode = 'all' }: ResumeFiltersModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Location[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  const [jobSearchStatus, setJobSearchStatus] = useState<string[]>(initialFilters?.job_search_status || []);
  const [ageMin, setAgeMin] = useState<string>(initialFilters?.age_min?.toString() || '');
  const [ageMax, setAgeMax] = useState<string>(initialFilters?.age_max?.toString() || '');
  const [hasPhoto, setHasPhoto] = useState<boolean>(initialFilters?.has_photo || false);
  const [employmentTypeIds, setEmploymentTypeIds] = useState<number[]>(initialFilters?.employment_type_ids || []);
  const [workFormatIds, setWorkFormatIds] = useState<number[]>(initialFilters?.work_format_ids || []);
  const [experienceLevels, setExperienceLevels] = useState<string[]>(initialFilters?.total_experience_level || []);
  
  const [selectedProfessions, setSelectedProfessions] = useState<Profession[]>([]);
  const [professionQuery, setProfessionQuery] = useState('');
  const [professionSuggestions, setProfessionSuggestions] = useState<Profession[]>([]);
  const [showProfessionSuggestions, setShowProfessionSuggestions] = useState(false);
  const [loadingProfessions, setLoadingProfessions] = useState(false);
  
  const [gender, setGender] = useState<string>(initialFilters?.gender || '');
  const [salaryMin, setSalaryMin] = useState<string>(initialFilters?.salary_min?.toString() || '');
  const [salaryMax, setSalaryMax] = useState<string>(initialFilters?.salary_max?.toString() || '');
  const [educationTypeIds, setEducationTypeIds] = useState<number[]>(initialFilters?.education_type_ids || []);
  
  const [skillQuery, setSkillQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<{id: number; name: string}[]>([]);
  
  const [drivingLicenseIds, setDrivingLicenseIds] = useState<number[]>(initialFilters?.driving_license_category_ids || []);
  const [languages, setLanguages] = useState<LanguageFilter[]>(initialFilters?.languages || []);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newLanguageId, setNewLanguageId] = useState<number | null>(null);
  const [newLanguageLevel, setNewLanguageLevel] = useState<string>('');

  // Sync internal state with initialFilters when modal opens or filters change
  useEffect(() => {
    if (!isOpen) return;

    setJobSearchStatus(initialFilters?.job_search_status || []);
    setAgeMin(initialFilters?.age_min?.toString() || '');
    setAgeMax(initialFilters?.age_max?.toString() || '');
    setHasPhoto(initialFilters?.has_photo || false);
    setEmploymentTypeIds(initialFilters?.employment_type_ids || []);
    setWorkFormatIds(initialFilters?.work_format_ids || []);
    setExperienceLevels(initialFilters?.total_experience_level || []);
    setGender(initialFilters?.gender || '');
    setSalaryMin(initialFilters?.salary_min?.toString() || '');
    setSalaryMax(initialFilters?.salary_max?.toString() || '');
    setEducationTypeIds(initialFilters?.education_type_ids || []);
    setDrivingLicenseIds(initialFilters?.driving_license_category_ids || []);
    setLanguages(initialFilters?.languages || []);
  }, [isOpen, initialFilters]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Location search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (locationQuery.length >= 2) {
        setLoadingLocations(true);
        try {
          const response = await fetch(`${API_ENDPOINTS.locations}?query=${encodeURIComponent(locationQuery)}`);
          const data = await response.json();
          const locations: Location[] = [];

          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              // Бэкенд возвращает объекты вида { id, name, type: "city" | "reg" }
              if (item.type === 'city') {
                locations.push({ city_id: item.id, name: item.name, type: 'city' });
              } else if (item.type === 'reg') {
                locations.push({ region_id: item.id, name: item.name, type: 'region' });
              }
            });
          }

          setLocationSuggestions(locations);
        } catch (error) {
          console.error('Error fetching locations:', error);
          setLocationSuggestions([]);
        }
        setLoadingLocations(false);
      } else {
        setLocationSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  // Profession search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (professionQuery.length >= 2) {
        setLoadingProfessions(true);
        try {
          const response = await fetch(`${API_ENDPOINTS.dictionaries.professionsSearch}?query=${encodeURIComponent(professionQuery)}`);
          const data = await response.json();
          setProfessionSuggestions(Array.isArray(data) ? data.map((p: any) => ({ id: p.id || p.profession_id, name: p.name })) : []);
        } catch (error) {
          console.error('Error fetching professions:', error);
          setProfessionSuggestions([]);
        }
        setLoadingProfessions(false);
      } else {
        setProfessionSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [professionQuery]);

  const handleAddLocation = (location: Location) => {
    if (!selectedLocations.find(l => 
      (l.city_id && l.city_id === location.city_id) || 
      (l.region_id && l.region_id === location.region_id)
    )) {
      setSelectedLocations([...selectedLocations, location]);
    }
    setLocationQuery('');
    setShowLocationSuggestions(false);
  };

  const handleRemoveLocation = (location: Location) => {
    setSelectedLocations(selectedLocations.filter(l => 
      !(l.city_id === location.city_id && l.region_id === location.region_id)
    ));
  };

  const handleAddProfession = (profession: Profession) => {
    if (!selectedProfessions.find(p => p.id === profession.id)) {
      setSelectedProfessions([...selectedProfessions, profession]);
    }
    setProfessionQuery('');
    setShowProfessionSuggestions(false);
  };

  const handleRemoveProfession = (profession: Profession) => {
    setSelectedProfessions(selectedProfessions.filter(p => p.id !== profession.id));
  };

  const handleToggleCheckbox = (value: number, list: number[], setList: (v: number[]) => void) => {
    if (list.includes(value)) {
      setList(list.filter(v => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleToggleStringCheckbox = (value: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(value)) {
      setList(list.filter(v => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleAddLanguage = () => {
    if (newLanguageId && newLanguageLevel) {
      if (!languages.find(l => l.language_id === newLanguageId)) {
        setLanguages([...languages, { language_id: newLanguageId, proficiency_level: newLanguageLevel }]);
      }
      setNewLanguageId(null);
      setNewLanguageLevel('');
      setShowAddLanguage(false);
    }
  };

  const handleRemoveLanguage = (languageId: number) => {
    setLanguages(languages.filter(l => l.language_id !== languageId));
  };

  const handleApply = () => {
    const filters: ResumeFilters = {
      region_ids: selectedLocations.filter(l => l.region_id).map(l => l.region_id!),
      city_ids: selectedLocations.filter(l => l.city_id).map(l => l.city_id!),
      job_search_status: jobSearchStatus,
      employment_type_ids: employmentTypeIds,
      work_format_ids: workFormatIds,
      total_experience_level: experienceLevels,
      profession_ids: selectedProfessions.map(p => p.id),
      education_type_ids: educationTypeIds,
      skill_ids: selectedSkills.map(s => s.id),
      driving_license_category_ids: drivingLicenseIds,
      languages: languages,
    };
    
    if (ageMin) filters.age_min = parseInt(ageMin);
    if (ageMax) filters.age_max = parseInt(ageMax);
    if (hasPhoto) filters.has_photo = true;
    if (gender) filters.gender = gender;
    if (salaryMin) filters.salary_min = parseInt(salaryMin);
    if (salaryMax) filters.salary_max = parseInt(salaryMax);
    
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    if (mode === 'all') {
      // Полный сброс всех фильтров
      setSelectedLocations([]);
      setJobSearchStatus([]);
      setAgeMin('');
      setAgeMax('');
      setHasPhoto(false);
      setEmploymentTypeIds([]);
      setWorkFormatIds([]);
      setExperienceLevels([]);
      setSelectedProfessions([]);
      setGender('');
      setSalaryMin('');
      setSalaryMax('');
      setEducationTypeIds([]);
      setSelectedSkills([]);
      setDrivingLicenseIds([]);
      setLanguages([]);
      return;
    }

    // Быстрые модалки: локальный сброс только связанных с mode полей
    switch (mode) {
      case 'location':
        setSelectedLocations([]);
        setLocationQuery('');
        setLocationSuggestions([]);
        break;
      case 'job_search_status':
        setJobSearchStatus([]);
        break;
      case 'employment_type':
        setEmploymentTypeIds([]);
        break;
      case 'work_format':
        setWorkFormatIds([]);
        break;
      case 'experience':
        setExperienceLevels([]);
        break;
      case 'salary':
        setSalaryMin('');
        setSalaryMax('');
        break;
      default:
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'all' && 'Фильтры поиска резюме'}
            {mode === 'location' && 'Фильтр по локации'}
            {mode === 'job_search_status' && 'Фильтр по статусу поиска'}
            {mode === 'employment_type' && 'Фильтр по типу занятости'}
            {mode === 'work_format' && 'Фильтр по графику работы'}
            {mode === 'experience' && 'Фильтр по опыту работы'}
            {mode === 'salary' && 'Фильтр по уровню дохода'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          className={
            mode === 'all'
              ? 'px-6 py-4 max-h-[70vh] overflow-y-auto space-y-6'
              : 'px-6 py-4 space-y-6'
          }
        >
          
          {/* локация */}
          {(mode === 'all' || mode === 'location') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Населенный пункт или регион</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedLocations.map((loc, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {loc.name}
                  <button onClick={() => handleRemoveLocation(loc)} className="hover:text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => { setLocationQuery(e.target.value); setShowLocationSuggestions(true); }}
                onFocus={() => setShowLocationSuggestions(true)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите город или регион"
              />
              {showLocationSuggestions && (locationQuery.length >= 2 || loadingLocations) && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {loadingLocations ? (
                    <div className="px-4 py-2 text-gray-500 text-sm">Загрузка...</div>
                  ) : locationSuggestions.length > 0 ? (
                    locationSuggestions.map((loc, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        onClick={() => handleAddLocation(loc)}
                      >
                        {loc.name} <span className="text-gray-400">({loc.type === 'city' ? 'город' : 'регион'})</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500 text-sm">Не найдено</div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Статус поиска */}
          {(mode === 'all' || mode === 'job_search_status') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Статус поиска</label>
            <div className="space-y-2">
              {JOB_SEARCH_STATUSES.map((status) => (
                <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobSearchStatus.includes(status.value)}
                    onChange={() => handleToggleStringCheckbox(status.value, jobSearchStatus, setJobSearchStatus)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{status.label}</span>
                </label>
              ))}
            </div>
          </div>
          )}

          {/* Возраст и Фото */}
          {mode === 'all' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Возраст и фото</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">от</span>
                <input
                  type="number"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="18"
                />
                <span className="text-sm text-gray-500">до</span>
                <input
                  type="number"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="65"
                />
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPhoto}
                  onChange={(e) => setHasPhoto(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Есть фото</span>
              </label>
            </div>
          </div>
          )}

          {/* Тип занятости */}
          {(mode === 'all' || mode === 'employment_type') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Тип занятости</label>
            <div className="space-y-2">
              {employmentTypesData.employment_types.map((type) => (
                <label key={type.employment_type_id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={employmentTypeIds.includes(type.employment_type_id)}
                    onChange={() => handleToggleCheckbox(type.employment_type_id, employmentTypeIds, setEmploymentTypeIds)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{type.name}</span>
                </label>
              ))}
            </div>
          </div>
          )}

          {/* График работы (Work Format) */}
          {(mode === 'all' || mode === 'work_format') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">График работы</label>
            <div className="space-y-2">
              {workFormatsData.work_formats.map((format) => (
                <label key={format.work_format_id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workFormatIds.includes(format.work_format_id)}
                    onChange={() => handleToggleCheckbox(format.work_format_id, workFormatIds, setWorkFormatIds)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{format.name}</span>
                </label>
              ))}
            </div>
          </div>
          )}

          {/* Требуемый опыт работы */}
          {(mode === 'all' || mode === 'experience') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Требуемый опыт работы</label>
            <div className="space-y-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <label key={level.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={experienceLevels.includes(level.value)}
                    onChange={() => handleToggleStringCheckbox(level.value, experienceLevels, setExperienceLevels)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{level.label}</span>
                </label>
              ))}
            </div>
          </div>
          )}

          {/* Специализация (Profession) */}
          {mode === 'all' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Специализация</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedProfessions.map((prof) => (
                <span key={prof.id} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {prof.name}
                  <button onClick={() => handleRemoveProfession(prof)} className="hover:text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={professionQuery}
                onChange={(e) => { setProfessionQuery(e.target.value); setShowProfessionSuggestions(true); }}
                onFocus={() => setShowProfessionSuggestions(true)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Укажите специализацию"
              />
              {showProfessionSuggestions && (professionQuery.length >= 2 || loadingProfessions) && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {loadingProfessions ? (
                    <div className="px-4 py-2 text-gray-500 text-sm">Загрузка...</div>
                  ) : professionSuggestions.length > 0 ? (
                    professionSuggestions.map((prof) => (
                      <div
                        key={prof.id}
                        className="px-4 py-2 hover:bg-green-50 cursor-pointer text-sm"
                        onClick={() => handleAddProfession(prof)}
                      >
                        {prof.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500 text-sm">Не найдено</div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Пол */}
          {mode === 'all' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Пол</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value=""
                  checked={gender === ''}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Не имеет значения</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Мужской</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Женский</span>
              </label>
            </div>
          </div>
          )}

          {/* Зарплата */}
          {(mode === 'all' || mode === 'salary') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Зарплата</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">от</span>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <span className="text-sm text-gray-500">до</span>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000000"
              />
              <span className="text-sm text-gray-500">₽</span>
            </div>
          </div>
          )}

          {/* Образование */}
          {mode === 'all' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Образование</label>
            <div className="space-y-2">
              {educationTypesData.education_types.map((type) => (
                <label key={type.education_type_id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={educationTypeIds.includes(type.education_type_id)}
                    onChange={() => handleToggleCheckbox(type.education_type_id, educationTypeIds, setEducationTypeIds)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{type.name}</span>
                </label>
              ))}
            </div>
          </div>
          )}

          {/* Навыки */}
          {mode === 'all' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Навыки</label>
            <input
              type="text"
              value={skillQuery}
              onChange={(e) => setSkillQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите название навыка"
            />
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedSkills.map((skill) => (
                  <span key={skill.id} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {skill.name}
                    <button onClick={() => setSelectedSkills(selectedSkills.filter(s => s.id !== skill.id))} className="hover:text-purple-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Категория прав */}
          {mode === 'all' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Категория прав</label>
            <div className="flex flex-wrap gap-2">
              {drivingLicenseData.driving_license_categories.map((cat) => (
                <button
                  key={cat.category_id}
                  onClick={() => handleToggleCheckbox(cat.category_id, drivingLicenseIds, setDrivingLicenseIds)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    drivingLicenseIds.includes(cat.category_id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {cat.code}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Языки */}
          {mode === 'all' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Языки</label>
            {languages.length > 0 && (
              <div className="space-y-2 mb-3">
                {languages.map((lang) => {
                  const langData = languagesData.languages.find(l => l.language_id === lang.language_id);
                  const levelData = PROFICIENCY_LEVELS.find(l => l.value === lang.proficiency_level);
                  return (
                    <div key={lang.language_id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm">
                        {langData?.name || 'Язык'} — {levelData?.label || lang.proficiency_level}
                      </span>
                      <button onClick={() => handleRemoveLanguage(lang.language_id)} className="text-gray-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            {showAddLanguage ? (
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={newLanguageId || ''}
                  onChange={(e) => setNewLanguageId(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите язык</option>
                  {languagesData.languages.map((lang) => (
                    <option key={lang.language_id} value={lang.language_id}>{lang.name}</option>
                  ))}
                </select>
                <select
                  value={newLanguageLevel}
                  onChange={(e) => setNewLanguageLevel(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Уровень</option>
                  {PROFICIENCY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddLanguage}
                  disabled={!newLanguageId || !newLanguageLevel}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  Добавить
                </button>
                <button
                  onClick={() => { setShowAddLanguage(false); setNewLanguageId(null); setNewLanguageLevel(''); }}
                  className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddLanguage(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Добавить ещё один язык
              </button>
            )}
            
            <label className="flex items-center gap-2 cursor-pointer mt-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Подтверждённые знания</span>
            </label>
          </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            Сбросить фильтры
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
