/**
 * @file: app/employer/vacancies/page.tsx
 * @description: Страница работодателя со списком вакансий и CRUD (просмотр/добавление/редактирование/удаление)
 * @dependencies: app/utils/api.ts (jobsApi), app/config/api.ts
 * @created: 2025-10-24
 */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jobsApi, type JobPosting } from '../../utils/api';
import { API_ENDPOINTS } from '../../config/api';
import employmentTypesData from '../../config/employment_types_202505222228.json';
import educationTypesData from '../../config/education_types_202505242225.json';
import workFormatsData from '../../config/work_formats_202505222228.json';
import workScheduleTypesData from '../../config/work_schedule_types_20251028.json';
import workSchedulesData from '../../config/work_schedules_20251028.json';
import workDayLengthsData from '../../config/work_day_lengths_20251028.json';
import shiftTypesData from '../../config/shift_types_20251028.json';
import CityAutocomplete from '../../components/CityAutocomplete';
import RegionAutocomplete from '../../components/RegionAutocomplete';

type FormState = Partial<JobPosting> & { id?: number };

// Строгий тип payload на отправку (соответствует примеру)
type JobUpsertPayload = {
  company_address_id: number;
  profession_id: number;
  title: string;
  description?: string;
  experience_level?: string;
  work_experience?: string;
  is_contract_possible?: boolean;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_type?: string;
  salary_period?: string;
  salary_frequency?: string;
  employment_type_ids?: number[];
  work_format_ids?: number[];
  work_schedule_ids?: number[];
  work_schedule_type_ids?: number[];
  day_length_ids?: number[];
  shift_type_ids?: number[];
  education_type_ids?: number[];
  city_ids?: number[];
  region_ids?: number[];
};

type ViewState = {
  mode: 'list' | 'view' | 'create' | 'edit';
  selected?: JobPosting | null;
};

export default function EmployerVacanciesPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [items, setItems] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewState>({ mode: 'list' });
  const [form, setForm] = useState<FormState>({ title: '' });
  const [query, setQuery] = useState('');
  const [regionIds, setRegionIds] = useState<number[]>([]);
  const [employmentTypeIds, setEmploymentTypeIds] = useState<number[]>([]);
  const [educationTypeIds, setEducationTypeIds] = useState<number[]>([]);
  const [workFormatIds, setWorkFormatIds] = useState<number[]>([]);
  const [workScheduleTypeIds, setWorkScheduleTypeIds] = useState<number[]>([]);
  const [workScheduleIds, setWorkScheduleIds] = useState<number[]>([]);
  const [dayLengthIds, setDayLengthIds] = useState<number[]>([]);
  const [shiftTypeIds, setShiftTypeIds] = useState<number[]>([]);
  type CompanyAddress = { address_id: number; address: string; city?: { name?: string } };
  const [companyAddresses, setCompanyAddresses] = useState<CompanyAddress[]>([]);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  type VacancyProfession = { profession_id: number; name: string };
  const [professionInput, setProfessionInput] = useState<string>("");
  const [professionSuggestions, setProfessionSuggestions] = useState<VacancyProfession[]>([]);
  const [isProfessionDropdownOpen, setIsProfessionDropdownOpen] = useState(false);
  const [isLoadingProfession, setIsLoadingProfession] = useState(false);
  const professionDropdownRef = useRef<HTMLDivElement | null>(null);
  type CityOption = { id: number; name: string };
  type RegionOption = { id: number; name: string; type?: string };
  const [publicationCityIds, setPublicationCityIds] = useState<number[]>([]);
  const [cityQuery, setCityQuery] = useState<string>("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  // Открытие дропдаунов для мультивыборов
  const [isEmploymentOpen, setIsEmploymentOpen] = useState(false);
  const [isEducationOpen, setIsEducationOpen] = useState(false);
  const [isWorkFormatOpen, setIsWorkFormatOpen] = useState(false);
  const [isWorkScheduleTypeOpen, setIsWorkScheduleTypeOpen] = useState(false);
  const [isWorkScheduleOpen, setIsWorkScheduleOpen] = useState(false);
  const [isDayLengthOpen, setIsDayLengthOpen] = useState(false);
  const [isShiftTypeOpen, setIsShiftTypeOpen] = useState(false);
  // Выпадающие списки зарплаты
  const [isSalaryFrequencyOpen, setIsSalaryFrequencyOpen] = useState(false);
  const [isSalaryPeriodOpen, setIsSalaryPeriodOpen] = useState(false);
  const [isSalaryTypeOpen, setIsSalaryTypeOpen] = useState(false);
  // Выпадающий список опыта работы (обязательное)
  const [isWorkExperienceOpen, setIsWorkExperienceOpen] = useState(false);
  // Выбранные города с названиями для отображения чипов
  const [selectedCities, setSelectedCities] = useState<CityOption[]>([]);
  // Автокомплит регионов (одиночный выбор)
  const [regionInput, setRegionInput] = useState<string>("");
  const [regionSuggestions, setRegionSuggestions] = useState<RegionOption[]>([]);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);
  // ref для закрытия дропдаунов по клику вне
  const cityDropdownRef = useRef<HTMLDivElement | null>(null);
  const regionDropdownRef = useRef<HTMLDivElement | null>(null);
  const addressDropdownRef = useRef<HTMLDivElement | null>(null);
  const salaryFrequencyRef = useRef<HTMLDivElement | null>(null);
  const salaryPeriodRef = useRef<HTMLDivElement | null>(null);
  const salaryTypeRef = useRef<HTMLDivElement | null>(null);
  const workExperienceRef = useRef<HTMLDivElement | null>(null);
  // refs для мультивыпадающих списков
  const employmentRef = useRef<HTMLDivElement | null>(null);
  const educationRef = useRef<HTMLDivElement | null>(null);
  const workFormatRef = useRef<HTMLDivElement | null>(null);
  const workScheduleTypeRef = useRef<HTMLDivElement | null>(null);
  const workScheduleRef = useRef<HTMLDivElement | null>(null);
  const dayLengthRef = useRef<HTMLDivElement | null>(null);
  const shiftTypeRef = useRef<HTMLDivElement | null>(null);

  const employmentTypes = (employmentTypesData as any)?.employment_types ?? [];
  const educationTypes = (educationTypesData as any)?.education_types ?? [];
  const workFormats = (workFormatsData as any)?.work_formats ?? [];
  const workScheduleTypes = (workScheduleTypesData as any)?.work_schedule_types ?? [];
  const workSchedules = (workSchedulesData as any)?.work_schedules ?? [];
  const workDayLengths = (workDayLengthsData as any)?.work_day_lengths ?? [];
  const shiftTypes = (shiftTypesData as any)?.shift_types ?? [];

  // Клиентская проверка роли работодателя
  useEffect(() => {
    try {
      const userType = typeof window !== 'undefined' ? localStorage.getItem('user_type') : null;
      if (userType !== 'employer') {
        router.replace('/login');
        return;
      }
    } finally {
      setAuthChecked(true);
    }
  }, [router]);

  // Опции зарплаты: RU для UI, EN для значения
  const salaryFrequencyOptions = [
    { label: 'раз в месяц', value: 'month' },
    { label: '2 раза в месяц', value: '2_month' },
    { label: 'ежедневно', value: 'day' },
    { label: 'другое', value: 'other' },
  ];
  const salaryPeriodOptions = [
    { label: 'за месяц', value: 'month' },
    { label: 'в час', value: 'hour' },
    { label: 'смена', value: 'shift' },
    { label: 'вахта', value: 'vahta' },
    { label: 'проект', value: 'project' },
  ];
  const salaryTypeOptions = [
    { label: 'на руки', value: 'after_tax' },
    { label: 'до вычета налогов', value: 'before_tax' },
  ];
  // Опыт работы: RU для UI, EN для значения (показываем только «без опыта», «нет опыта» скрываем)
  const workExperienceOptions = [
    { label: 'без опыта', value: '0' },
    { label: 'до 1 года', value: '0_1' },
    { label: 'от 1 до 3 лет', value: '1_3' },
    { label: 'от 3 до 6 лет', value: '3_5' },
    { label: 'более 6 лет', value: 'more_5' },
  ];

  const filtered = useMemo(() => {
    const base: JobPosting[] = Array.isArray(items) ? items : [];
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter((v) =>
      (v.title || '').toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  const hasCriticalErrors = useMemo(() => {
    const titleMissing = !form.title || !form.title.trim();
    const descMissing = !form.description || !form.description.trim();
    const noProfession = !form.profession_id;
    const noAddress = !form.company_address_id;
    const salaryInvalid = typeof form.salary_min === 'number' && typeof form.salary_max === 'number' && (form.salary_min > form.salary_max);
    const citiesOver = publicationCityIds.length > 10;
    const regionsOver = regionIds.length > 10;
    const noCity = !(Array.isArray(publicationCityIds) && publicationCityIds.length > 0) && !form.publication_city_id;
    return titleMissing || descMissing || noProfession || noAddress || noCity || salaryInvalid || citiesOver || regionsOver;
  }, [form.title, form.description, form.profession_id, form.company_address_id, form.salary_min, form.salary_max, publicationCityIds, regionIds]);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await jobsApi.listCompanyJobs();
    if (res.error) setError(res.error);
    const payload: any = res.data ?? [];
    const rows: JobPosting[] = Array.isArray(payload)
      ? payload
      : (payload?.items || payload?.data || payload?.job_postings || []);
    setItems(Array.isArray(rows) ? rows : []);
    setLoading(false);
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!form.title || !form.title.trim()) nextErrors.title = 'Укажите название вакансии';
    if (!form.description || !form.description.trim()) nextErrors.description = 'Укажите описание вакансии';
    if (!form.profession_id) nextErrors.profession_id = 'Выберите профессию из списка';
    if (!form.company_address_id) nextErrors.company_address_id = 'Выберите адрес компании из списка';
    if (!((Array.isArray(publicationCityIds) && publicationCityIds.length > 0) || form.publication_city_id)) {
      nextErrors.city_ids = 'Выберите хотя бы один город публикации';
    }
    if (
      typeof form.salary_min === 'number' &&
      typeof form.salary_max === 'number' &&
      form.salary_min > form.salary_max
    ) {
      nextErrors.salary = 'Минимальная зарплата не может быть больше максимальной';
    }
    if (publicationCityIds.length > 10) nextErrors.city_ids = 'Можно выбрать не более 10 городов';
    if (regionIds.length > 1) nextErrors.region_ids = 'Можно выбрать только один регион';
    if (!form.work_experience) nextErrors.work_experience = 'Выберите опыт работы';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  useEffect(() => {
    load();
    // Загрузка адресов компании
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_ENDPOINTS.companies.profile, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          const addrs: CompanyAddress[] = Array.isArray(data?.addresses) ? data.addresses : [];
          setCompanyAddresses(addrs);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    let ignore = false;
    async function searchProfessions(q: string) {
      if (!q || q.trim().length < 2) {
        setProfessionSuggestions([]);
        return;
      }
      setIsLoadingProfession(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.dictionaries.professionsSearch}?query=${encodeURIComponent(q.trim())}`);
        if (!ignore && res.ok) {
          const data: VacancyProfession[] = await res.json();
          setProfessionSuggestions(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!ignore) setProfessionSuggestions([]);
      } finally {
        if (!ignore) setIsLoadingProfession(false);
      }
    }
    const t = setTimeout(() => searchProfessions(professionInput), 300);
    return () => { ignore = true; clearTimeout(t); };
  }, [professionInput]);

  // Поиск городов публикации
  useEffect(() => {
    let ignore = false;
    async function searchCities(q: string) {
      if (!q || q.trim().length < 2) {
        setCityOptions([]);
        return;
      }
      setIsLoadingCities(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.citiesSearch}?query=${encodeURIComponent(q.trim())}`);
        if (!ignore && res.ok) {
          const data: any[] = await res.json();
          const options: CityOption[] = Array.isArray(data)
            ? data.map((c: any) => ({ id: (c.city_id ?? c.id), name: c.name }))
            : [];
          setCityOptions(options);
        }
      } catch {
        if (!ignore) setCityOptions([]);
      } finally {
        if (!ignore) setIsLoadingCities(false);
      }
    }
    const t = setTimeout(() => searchCities(cityQuery), 300);
    return () => { ignore = true; clearTimeout(t); };
  }, [cityQuery]);

  // Поиск регионов: /api/locations (GET), фильтрация только type==='reg'
  useEffect(() => {
    let ignore = false;
    async function searchRegions(q: string) {
      if (!q || q.trim().length < 2) {
        setRegionSuggestions([]);
        return;
      }
      setIsLoadingRegion(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.locations}?query=${encodeURIComponent(q.trim())}`);
        if (!ignore && res.ok) {
          const data: any[] = await res.json();
          const opts: RegionOption[] = Array.isArray(data)
            ? data
                .filter((r: any) => r?.type === 'reg')
                .map((r: any) => ({ id: Number(r.id), name: String(r.name), type: r.type }))
            : [];
          setRegionSuggestions(opts);
        }
      } catch {
        if (!ignore) setRegionSuggestions([]);
      } finally {
        if (!ignore) setIsLoadingRegion(false);
      }
    }
    const t = setTimeout(() => searchRegions(regionInput), 300);
    return () => { ignore = true; clearTimeout(t); };
  }, [regionInput]);

  // Закрытие дропдауна городов по клику вне области
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!isCityDropdownOpen) return;
      const el = cityDropdownRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setIsCityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isCityDropdownOpen]);

  // Закрытие дропдауна регионов по клику вне области
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!isRegionDropdownOpen) return;
      const el = regionDropdownRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setIsRegionDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isRegionDropdownOpen]);

  // Закрытие дропдауна профессий по клику вне области
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!isProfessionDropdownOpen) return;
      const el = professionDropdownRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setIsProfessionDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isProfessionDropdownOpen]);

  // Закрытие дропдауна адреса по клику вне
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!isAddressDropdownOpen) return;
      const el = addressDropdownRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setIsAddressDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isAddressDropdownOpen]);

  // Закрытие дропдаунов зарплаты по клику вне
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (isSalaryFrequencyOpen) {
        const el = salaryFrequencyRef.current;
        if (el && target instanceof Node && !el.contains(target)) setIsSalaryFrequencyOpen(false);
      }
      if (isSalaryPeriodOpen) {
        const el = salaryPeriodRef.current;
        if (el && target instanceof Node && !el.contains(target)) setIsSalaryPeriodOpen(false);
      }
      if (isSalaryTypeOpen) {
        const el = salaryTypeRef.current;
        if (el && target instanceof Node && !el.contains(target)) setIsSalaryTypeOpen(false);
      }
      if (isWorkExperienceOpen) {
        const el = workExperienceRef.current;
        if (el && target instanceof Node && !el.contains(target)) setIsWorkExperienceOpen(false);
      }
    }
    if (isSalaryFrequencyOpen || isSalaryPeriodOpen || isSalaryTypeOpen || isWorkExperienceOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isSalaryFrequencyOpen, isSalaryPeriodOpen, isSalaryTypeOpen, isWorkExperienceOpen]);

  // Закрытие мультивыпадающих списков по клику вне
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (isEmploymentOpen) {
        const el = employmentRef.current; if (el && !el.contains(target)) setIsEmploymentOpen(false);
      }
      if (isEducationOpen) {
        const el = educationRef.current; if (el && !el.contains(target)) setIsEducationOpen(false);
      }
      if (isWorkFormatOpen) {
        const el = workFormatRef.current; if (el && !el.contains(target)) setIsWorkFormatOpen(false);
      }
      if (isWorkScheduleTypeOpen) {
        const el = workScheduleTypeRef.current; if (el && !el.contains(target)) setIsWorkScheduleTypeOpen(false);
      }
      if (isWorkScheduleOpen) {
        const el = workScheduleRef.current; if (el && !el.contains(target)) setIsWorkScheduleOpen(false);
      }
      if (isDayLengthOpen) {
        const el = dayLengthRef.current; if (el && !el.contains(target)) setIsDayLengthOpen(false);
      }
      if (isShiftTypeOpen) {
        const el = shiftTypeRef.current; if (el && !el.contains(target)) setIsShiftTypeOpen(false);
      }
    }
    if (
      isEmploymentOpen || isEducationOpen || isWorkFormatOpen ||
      isWorkScheduleTypeOpen || isWorkScheduleOpen || isDayLengthOpen || isShiftTypeOpen
    ) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [
    isEmploymentOpen, isEducationOpen, isWorkFormatOpen,
    isWorkScheduleTypeOpen, isWorkScheduleOpen, isDayLengthOpen, isShiftTypeOpen
  ]);

  function startCreate() {
    setForm({
      title: '',
      description: '',
      profession_id: undefined,
      publication_city_id: undefined,
      company_address_id: undefined,
      is_active: true,
      is_contract_possible: false,
      salary_min: undefined,
      salary_max: undefined,
      salary_currency: 'RUB',
      salary_frequency: '',
      salary_period: '',
      salary_type: '',
      work_experience: '',
      employment_type: '',
      experience_level: '',
      work_format: '',
      work_schedule: '',
      hours_per_day: '',
      shifts: '',
      expiration_date: '',
    });
    setPublicationCityIds([]);
    setSelectedCities([]);
    setRegionIds([]);
    setView({ mode: 'create' });
  }

  async function startEdit(v: JobPosting) {
    setForm({
      id: v.job_id,
      title: v.title,
      description: v.description,
      profession_id: v.profession_id,
      publication_city_id: v.publication_city_id,
      company_address_id: v.company_address_id,
      is_active: v.is_active,
      is_contract_possible: v.is_contract_possible,
      salary_min: v.salary_min,
      salary_max: v.salary_max,
      salary_currency: v.salary_currency,
      salary_frequency: v.salary_frequency,
      salary_period: v.salary_period,
      salary_type: v.salary_type,
      employment_type: v.employment_type,
      experience_level: v.experience_level,
      work_experience: v.work_experience,
      work_format: v.work_format,
      work_schedule: v.work_schedule,
      hours_per_day: v.hours_per_day,
      shifts: v.shifts,
      expiration_date: v.expiration_date,
    });
    // Инициализация выбранных городов публикации из сущностей, если доступны
    try {
      const cityIdsFromEntity = Array.isArray((v as any)?.cities)
        ? ((v as any).cities as any[]).map((c) => Number((c as any).city_id)).filter(Boolean)
        : [];
      if (cityIdsFromEntity.length > 0) setPublicationCityIds(cityIdsFromEntity);
      const cityNamesFromEntity: CityOption[] = Array.isArray((v as any)?.cities)
        ? ((v as any).cities as any[])
            .map((c: any) => ({ id: Number(c.city_id), name: String(c.name || c.city_name || '') }))
            .filter((c: CityOption) => !!c.id && !!c.name)
        : [];
      if (cityNamesFromEntity.length > 0) setSelectedCities(cityNamesFromEntity);
    } catch {}

    // Инициализация мультивыборов из данных вакансии
    try {
      const anyV = v as any;

      const pickIds = (ids: any, entities: any[], key: string): number[] => {
        // если уже массив id
        if (Array.isArray(ids)) return ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
        // если массив сущностей { [key]: number }
        if (Array.isArray(entities)) {
          return entities
            .map((e) => Number(e?.[key]))
            .filter((n) => Number.isFinite(n));
        }
        return [];
      };

      const initEmployment = pickIds(anyV.employment_type_ids, anyV.employment_types, 'employment_type_id');
      if (initEmployment.length) setEmploymentTypeIds(initEmployment);

      const initEducation = pickIds(anyV.education_type_ids, anyV.education_types, 'education_type_id');
      if (initEducation.length) setEducationTypeIds(initEducation);

      const initWorkFormats = pickIds(anyV.work_format_ids, anyV.work_formats, 'work_format_id');
      if (initWorkFormats.length) setWorkFormatIds(initWorkFormats);

      const initScheduleTypes = pickIds(anyV.work_schedule_type_ids, anyV.work_schedule_types, 'schedule_type_id');
      if (initScheduleTypes.length) setWorkScheduleTypeIds(initScheduleTypes);

      const initSchedules = pickIds(anyV.work_schedule_ids, anyV.work_schedules, 'schedule_id');
      if (initSchedules.length) setWorkScheduleIds(initSchedules);

      const initDayLengths = pickIds(anyV.day_length_ids, anyV.work_day_lengths, 'day_length_id');
      if (initDayLengths.length) setDayLengthIds(initDayLengths);

      const initShifts = pickIds(anyV.shift_type_ids, anyV.shift_types, 'shift_type_id');
      if (initShifts.length) setShiftTypeIds(initShifts);
    } catch {}
    setView({ mode: 'edit', selected: v });

    // Дополнительно загружаем полную карточку вакансии согласно swagger: GET /api/companies/jobs/{id}
    if (v.job_id) {
      const res = await jobsApi.getCompanyJob(v.job_id);
      if (res && res.data) {
        const full = res.data as JobPosting;
        // Обновляем форму более полными данными
        setForm((prev) => ({
          ...prev,
          title: full.title ?? prev.title,
          description: full.description ?? prev.description,
          profession_id: full.profession_id ?? prev.profession_id,
          publication_city_id: full.publication_city_id ?? prev.publication_city_id,
          company_address_id: full.company_address_id ?? prev.company_address_id,
          is_active: full.is_active ?? prev.is_active,
          is_contract_possible: full.is_contract_possible ?? prev.is_contract_possible,
          salary_min: full.salary_min ?? prev.salary_min,
          salary_max: full.salary_max ?? prev.salary_max,
          salary_currency: full.salary_currency ?? prev.salary_currency,
          salary_frequency: full.salary_frequency ?? prev.salary_frequency,
          salary_period: full.salary_period ?? prev.salary_period,
          salary_type: full.salary_type ?? prev.salary_type,
          employment_type: (full as any).employment_type ?? (prev as any).employment_type,
          experience_level: full.experience_level ?? prev.experience_level,
          work_experience: full.work_experience ?? prev.work_experience,
          work_format: (full as any).work_format ?? (prev as any).work_format,
          work_schedule: (full as any).work_schedule ?? (prev as any).work_schedule,
          hours_per_day: (full as any).hours_per_day ?? (prev as any).hours_per_day,
          shifts: (full as any).shifts ?? (prev as any).shifts,
          expiration_date: full.expiration_date ?? prev.expiration_date,
        }));

        // Отображение выбранной профессии в инпуте (для UX)
        try {
          const profName = String((full as any)?.profession?.name || '');
          if (profName) setProfessionInput(profName);
        } catch {}

        // Переинициализация городов публикации и мультивыборов из полной карточки
        try {
          const cityIdsFromEntity = Array.isArray((full as any)?.cities)
            ? ((full as any).cities as any[]).map((c) => Number((c as any).city_id)).filter(Boolean)
            : [];
          if (cityIdsFromEntity.length > 0) setPublicationCityIds(cityIdsFromEntity);
          const cityNamesFromEntity: CityOption[] = Array.isArray((full as any)?.cities)
            ? ((full as any).cities as any[])
                .map((c: any) => ({ id: Number(c.city_id), name: String(c.name || c.city_name || '') }))
                .filter((c: CityOption) => !!c.id && !!c.name)
            : [];
          if (cityNamesFromEntity.length > 0) setSelectedCities(cityNamesFromEntity);
        } catch {}

        try {
          const anyV = full as any;
          const pickIds = (ids: any, entities: any[], key: string): number[] => {
            if (Array.isArray(ids)) return ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
            if (Array.isArray(entities)) {
              return entities.map((e) => Number(e?.[key])).filter((n) => Number.isFinite(n));
            }
            return [];
          };

          const initEmployment = pickIds(anyV.employment_type_ids, anyV.employment_types, 'employment_type_id');
          if (initEmployment.length) setEmploymentTypeIds(initEmployment);

          const initEducation = pickIds(anyV.education_type_ids, anyV.education_types, 'education_type_id');
          if (initEducation.length) setEducationTypeIds(initEducation);

          const initWorkFormats = pickIds(anyV.work_format_ids, anyV.work_formats, 'work_format_id');
          if (initWorkFormats.length) setWorkFormatIds(initWorkFormats);

          const initScheduleTypes = pickIds(anyV.work_schedule_type_ids, anyV.work_schedule_types, 'schedule_type_id');
          if (initScheduleTypes.length) setWorkScheduleTypeIds(initScheduleTypes);

          const initSchedules = pickIds(anyV.work_schedule_ids, anyV.work_schedules, 'schedule_id');
          if (initSchedules.length) setWorkScheduleIds(initSchedules);

          // Поддержка источников: day_length_ids | work_day_lengths[] | day_lengths[]
          const initDayLengthsA = pickIds(anyV.day_length_ids, anyV.work_day_lengths, 'day_length_id');
          const initDayLengthsB = pickIds(undefined, anyV.day_lengths, 'day_length_id');
          const initDayLengths = Array.from(new Set([...(initDayLengthsA || []), ...(initDayLengthsB || [])]));
          if (initDayLengths.length) setDayLengthIds(initDayLengths);

          const initShifts = pickIds(anyV.shift_type_ids, anyV.shift_types, 'shift_type_id');
          if (initShifts.length) setShiftTypeIds(initShifts);

          // Регион: region_ids | regions[]
          const initRegions = pickIds(anyV.region_ids, anyV.regions, 'region_id');
          if (initRegions.length) {
            setRegionIds(initRegions);
            try {
              const firstRegionName = String((anyV.regions?.[0]?.name) || '');
              if (firstRegionName) setRegionInput(firstRegionName);
            } catch {}
          }
        } catch {}
      }
    }
  }

  function startView(v: JobPosting) {
    setView({ mode: 'view', selected: v });
  }

  async function submitCreate() {
    if (!validate()) {
      return;
    }
    setLoading(true);
    setError(null);
    const cityIds = Array.isArray(publicationCityIds) && publicationCityIds.length > 0
      ? publicationCityIds
      : (form.publication_city_id ? [Number(form.publication_city_id)] : []);
    const payload: JobUpsertPayload = {
      company_address_id: form.company_address_id,
      profession_id: form.profession_id,
      title: form.title || '',
      description: form.description,
      experience_level: form.experience_level,
      work_experience: form.work_experience,
      is_contract_possible: form.is_contract_possible,
      salary_min: form.salary_min,
      salary_max: form.salary_max,
      salary_currency: form.salary_currency,
      salary_type: form.salary_type,
      salary_period: form.salary_period,
      salary_frequency: form.salary_frequency,

      employment_type_ids: employmentTypeIds,
      education_type_ids: educationTypeIds,
      work_format_ids: workFormatIds,
      work_schedule_type_ids: workScheduleTypeIds,
      work_schedule_ids: workScheduleIds,
      day_length_ids: dayLengthIds,
      shift_type_ids: shiftTypeIds,
      city_ids: cityIds,
      region_ids: regionIds,
    };
    const res = await jobsApi.create(payload as any);
    if (res.error) setError(res.error);
    setLoading(false);
    if (!res.error) {
      setView({ mode: 'list' });
      await load();
    }
  }

  async function submitEdit() {
    if (!form.id) return;
    if (!validate()) {
      return;
    }
    setLoading(true);
    setError(null);
    const cityIds = Array.isArray(publicationCityIds) && publicationCityIds.length > 0
      ? publicationCityIds
      : (typeof form.publication_city_id !== 'undefined' ? [Number(form.publication_city_id)] : undefined);
    const updatePayload: JobUpsertPayload = {
      company_address_id: form.company_address_id,
      profession_id: form.profession_id,
      title: form.title,
      description: form.description,
      experience_level: form.experience_level,
      work_experience: form.work_experience,
      is_contract_possible: form.is_contract_possible,
      salary_min: form.salary_min,
      salary_max: form.salary_max,
      salary_currency: form.salary_currency,
      salary_type: form.salary_type,
      salary_period: form.salary_period,
      salary_frequency: form.salary_frequency,
    } as JobUpsertPayload;
    // Передаем связи только если есть выбор (частичное обновление)
    if (employmentTypeIds) updatePayload.employment_type_ids = employmentTypeIds;
    if (educationTypeIds) updatePayload.education_type_ids = educationTypeIds;
    if (workFormatIds) updatePayload.work_format_ids = workFormatIds;
    if (workScheduleTypeIds) updatePayload.work_schedule_type_ids = workScheduleTypeIds;
    if (workScheduleIds) updatePayload.work_schedule_ids = workScheduleIds;
    if (dayLengthIds) updatePayload.day_length_ids = dayLengthIds;
    if (shiftTypeIds) updatePayload.shift_type_ids = shiftTypeIds;
    if (typeof cityIds !== 'undefined') updatePayload.city_ids = cityIds;
    if (regionIds) updatePayload.region_ids = regionIds;

    const res = await jobsApi.update(form.id, updatePayload as any);
    if (res.error) setError(res.error);
    setLoading(false);
    if (!res.error) {
      setView({ mode: 'list' });
      await load();
    }
  }

  async function remove(v: JobPosting) {
    if (!v.job_id) return;
    if (!confirm(`Удалить вакансию "${v.title}"?`)) return;
    setLoading(true);
    setError(null);
    const res = await jobsApi.remove(v.job_id);
    if (res.error) setError(res.error);
    setLoading(false);
    if (!res.error) await load();
  }

  // До завершения проверки роли не рендерим содержимое, чтобы избежать мерцания
  if (!authChecked) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мои вакансии</h1>
          <p className="text-sm text-gray-500">Управление вакансиями компании</p>
        </div>
        <button onClick={startCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow">
          Добавить вакансию
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию или описанию..."
          className="w-full md:w-96 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={load} className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Обновить</button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="mb-4 p-3 rounded-lg bg-gray-50 text-gray-600 text-sm">Загрузка...</div>
      )}

      {/* Пустое состояние */}
      {!loading && filtered.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-xl p-8 bg-white text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Пока нет вакансий</h3>
          <p className="text-sm text-gray-500 mt-1">Создайте первую вакансию, чтобы начать привлекать кандидатов</p>
          <button onClick={startCreate} className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow">
            <span>Добавить вакансию</span>
          </button>
        </div>
      )}

      {/* Список */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v) => (
          <div key={v.job_id ?? v.title} className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{v.title}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{v.is_active ? 'active' : 'archived'}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600 line-clamp-3">{v.description}</p>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              {v.salary_min || v.salary_max ? (
                <span>
                  {v.salary_min ? v.salary_min : ''}
                  {(v.salary_min && v.salary_max) ? ' - ' : ''}
                  {v.salary_max ? v.salary_max : ''} ₽
                </span>
              ) : (
                <span>Зарплата не указана</span>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => startView(v)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Просмотр</button>
              <button onClick={() => startEdit(v)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Изменить</button>
              <button onClick={() => remove(v)} className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Удалить</button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB для мобильных */}
      <button
        onClick={startCreate}
        className="lg:hidden fixed bottom-6 right-6 h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700"
        aria-label="Добавить вакансию"
      >
        <span className="text-2xl leading-none">＋</span>
      </button>

      {/* Модальные окна */}
      {view.mode !== 'list' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {view.mode === 'create' && 'Новая вакансия'}
                {view.mode === 'edit' && 'Редактирование вакансии'}
                {view.mode === 'view' && 'Просмотр вакансии'}
              </h2>
              <button onClick={() => setView({ mode: 'list' })} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="mb-3 p-3 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                Пожалуйста, исправьте ошибки в форме и попробуйте снова.
              </div>
            )}

            {view.mode === 'view' && view.selected && (
              <div className="space-y-3 text-sm">
                <div><span className="text-gray-500">Название:</span> <span className="font-medium">{view.selected.title}</span></div>
                <div><span className="text-gray-500">Описание:</span> <span>{view.selected.description || '-'}</span></div>
                <div><span className="text-gray-500">Статус:</span> <span>{view.selected.is_active ? 'active' : 'archived'}</span></div>
                <div>
                  <span className="text-gray-500">Зарплата:</span>{' '}
                  <span>
                    {view.selected.salary_min || view.selected.salary_max ? (
                      <>
                        {view.selected.salary_min ? view.selected.salary_min : ''}
                        {(view.selected.salary_min && view.selected.salary_max) ? ' - ' : ''}
                        {view.selected.salary_max ? view.selected.salary_max : ''} ₽
                      </>
                    ) : 'не указана'}
                  </span>
                </div>
              </div>
            )}

            {(view.mode === 'create' || view.mode === 'edit') && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Название</label>
                    <input
                      value={form.title || ''}
                      onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Например: Frontend-разработчик"
                    />
                    {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Описание</label>
                  <textarea
                    value={form.description || ''}
                    onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[100px]"
                    placeholder="Краткое описание вакансии"
                  />
                  {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Зарплата мин</label>
                    <input
                      type="number"
                      value={form.salary_min ?? ''}
                      onChange={(e) => setForm((s) => ({ ...s, salary_min: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Зарплата макс</label>
                    <input
                      type="number"
                      value={form.salary_max ?? ''}
                      onChange={(e) => setForm((s) => ({ ...s, salary_max: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                    {errors.salary && <p className="text-xs text-red-600 mt-1">{errors.salary}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative" ref={professionDropdownRef}>
                    <label className="block text-xs text-gray-500 mb-1">Профессия</label>
                    <input
                      type="text"
                      value={professionInput}
                      onChange={(e) => { setProfessionInput(e.target.value); setIsProfessionDropdownOpen(true); }}
                      onFocus={() => setIsProfessionDropdownOpen(true)}
                      placeholder={form.profession_id ? String(form.profession_id) : 'Начните вводить название'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      autoComplete="off"
                    />
                    {(professionInput || form.profession_id) && (
                      <button
                        type="button"
                        aria-label="Очистить профессию"
                        className="absolute right-2 top-8 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                        onClick={() => {
                          setForm((s) => ({ ...s, profession_id: undefined }));
                          setProfessionInput('');
                          setErrors((prev) => {
                            const { profession_id, ...rest } = prev || {} as any;
                            return rest as Record<string, string>;
                          });
                          setIsProfessionDropdownOpen(false);
                        }}
                      >
                        ✕
                      </button>
                    )}
                    {isProfessionDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200">
                        <div className="py-1">
                          {isLoadingProfession && <div className="px-4 py-2 text-sm text-gray-500">Загрузка...</div>}
                          {!isLoadingProfession && professionSuggestions.length === 0 && professionInput.trim().length >= 2 && (
                            <div className="px-4 py-2 text-sm text-gray-500">Ничего не найдено</div>
                          )}
                          {professionSuggestions.map((p) => (
                            <div key={p.profession_id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setForm((s) => ({ ...s, profession_id: p.profession_id }));
                                setProfessionInput(p.name);
                                setIsProfessionDropdownOpen(false);
                              }}
                            >
                              <span className="block truncate text-sm">{p.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {errors.profession_id && <p className="text-xs text-red-600 mt-1">{errors.profession_id}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative" ref={cityDropdownRef}>
                    <label className="block text-xs text-gray-500 mb-1">Города публикации (до 10)</label>
                    <button
                      type="button"
                      onClick={() => { if (isLoadingCities) return; setIsCityDropdownOpen((v) => !v); }}
                      disabled={isLoadingCities}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {publicationCityIds.length > 0
                        ? `Выбрано: ${publicationCityIds.length}/10`
                        : 'Выберите города'}
                    </button>
                    {isCityDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-72 overflow-auto border border-gray-200 p-2 space-y-2">
                        <input
                          value={cityQuery}
                          onChange={(e) => setCityQuery(e.target.value)}
                          placeholder="Поиск города..."
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                        />
                        {isLoadingCities && <div className="px-2 py-1 text-sm text-gray-500">Загрузка...</div>}
                        {!isLoadingCities && cityOptions.length === 0 && cityQuery.trim().length >= 2 && (
                          <div className="px-2 py-1 text-sm text-gray-500">Ничего не найдено</div>
                        )}
                        <div className="space-y-1">
                          {cityOptions.map((c) => {
                            const checked = publicationCityIds.includes(c.id);
                            return (
                              <label key={c.id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    if (checked) {
                                      // Удаление из выбранных
                                      setPublicationCityIds((prev) => prev.filter((id) => id !== c.id));
                                      setSelectedCities((prev) => prev.filter((x) => x.id !== c.id));
                                    } else {
                                      // Добавление нового города, ограничение 10 и закрытие списка
                                      setPublicationCityIds((prev) => {
                                        let next = [...prev, c.id];
                                        if (next.length > 10) next = next.slice(0, 10);
                                        return next;
                                      });
                                      setSelectedCities((prev) => {
                                        if (prev.some((x) => x.id === c.id)) return prev;
                                        const next = [...prev, { id: c.id, name: c.name }];
                                        return next.slice(0, 10);
                                      });
                                      setIsCityDropdownOpen(false);
                                    }
                                  }}
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">{c.name}</span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="text-xs text-gray-500 px-2">Выбрано {publicationCityIds.length}/10</div>
                      </div>
                    )}
                    {errors.city_ids && <p className="text-xs text-red-600 mt-1">{errors.city_ids}</p>}
                    {selectedCities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedCities.map((c) => (
                          <span key={c.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200">
                            <span>{c.name}</span>
                            <button
                              type="button"
                              aria-label={`Удалить ${c.name}`}
                              className="ml-1 rounded hover:bg-blue-100 px-1"
                              onClick={() => {
                                setPublicationCityIds((prev) => prev.filter((id) => id !== c.id));
                                setSelectedCities((prev) => prev.filter((x) => x.id !== c.id));
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Регион (один)</label>
                  <div className="relative" ref={regionDropdownRef}>
                    <input
                      type="text"
                      value={regionInput}
                      onChange={(e) => { setRegionInput(e.target.value); setIsRegionDropdownOpen(true); }}
                      onFocus={() => setIsRegionDropdownOpen(true)}
                      placeholder={regionIds.length === 1 ? String(regionIds[0]) : 'Начните вводить регион'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      autoComplete="off"
                    />
                    {regionIds.length === 1 && (
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                        aria-label="Очистить регион"
                        onClick={() => { setRegionIds([]); setRegionInput(''); }}
                      >
                        ✕
                      </button>
                    )}
                    {isRegionDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200">
                        <div className="py-1">
                          {isLoadingRegion && <div className="px-4 py-2 text-sm text-gray-500">Загрузка...</div>}
                          {!isLoadingRegion && regionSuggestions.length === 0 && regionInput.trim().length >= 2 && (
                            <div className="px-4 py-2 text-sm text-gray-500">Ничего не найдено</div>
                          )}
                          {regionSuggestions.map((r) => (
                            <div key={r.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setRegionIds([r.id]);
                                setRegionInput(r.name);
                                setIsRegionDropdownOpen(false);
                              }}
                            >
                              <span className="block truncate text-sm">{r.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.region_ids && <p className="text-xs text-red-600 mt-1">{errors.region_ids}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative" ref={addressDropdownRef}>
                    <label className="block text-xs text-gray-500 mb-1">Адрес компании </label>
                    <button
                      type="button"
                      onClick={() => setIsAddressDropdownOpen((v) => !v)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
                    >
                      {(() => {
                        const current = companyAddresses.find(a => a.address_id === form.company_address_id);
                        return current ? `${current.address}${current.city?.name ? `, ${current.city.name}` : ''}` : 'Выберите адрес компании';
                      })()}
                    </button>
                    {isAddressDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200">
                        <div className="py-1">
                          {companyAddresses.length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-500">Адреса отсутствуют</div>
                          )}
                          {companyAddresses.map((addr) => (
                            <div key={addr.address_id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setForm((s) => ({ ...s, company_address_id: addr.address_id }));
                                setIsAddressDropdownOpen(false);
                              }}
                            >
                              <span className="block truncate text-sm">{addr.address}{addr.city?.name ? `, ${addr.city.name}` : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {errors.company_address_id && <p className="text-xs text-red-600 mt-1">{errors.company_address_id}</p>}
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input
                      id="is_contract_possible"
                      type="checkbox"
                      checked={!!form.is_contract_possible}
                      onChange={(e) => setForm((s) => ({ ...s, is_contract_possible: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <label htmlFor="is_contract_possible" className="text-sm text-gray-700">Возможен контракт</label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative" ref={salaryFrequencyRef}>
                    <label className="block text-xs text-gray-500 mb-1">Частота выплаты</label>
                    <button
                      type="button"
                      onClick={() => setIsSalaryFrequencyOpen((v) => !v)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
                    >
                      {(() => {
                        const cur = salaryFrequencyOptions.find(o => o.value === form.salary_frequency);
                        return cur ? cur.label : 'Выберите частоту выплаты';
                      })()}
                    </button>
                    {isSalaryFrequencyOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200">
                        <div className="py-1">
                          {salaryFrequencyOptions.map((opt) => (
                            <div key={opt.value}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => { setForm((s) => ({ ...s, salary_frequency: opt.value })); setIsSalaryFrequencyOpen(false); }}
                            >
                              <span className="block truncate text-sm">{opt.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative" ref={salaryPeriodRef}>
                    <label className="block text-xs text-gray-500 mb-1">Период зарплаты</label>
                    <button
                      type="button"
                      onClick={() => setIsSalaryPeriodOpen((v) => !v)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
                    >
                      {(() => {
                        const cur = salaryPeriodOptions.find(o => o.value === form.salary_period);
                        return cur ? cur.label : 'Выберите период зарплаты';
                      })()}
                    </button>
                    {isSalaryPeriodOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200">
                        <div className="py-1">
                          {salaryPeriodOptions.map((opt) => (
                            <div key={opt.value}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => { setForm((s) => ({ ...s, salary_period: opt.value })); setIsSalaryPeriodOpen(false); }}
                            >
                              <span className="block truncate text-sm">{opt.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative" ref={salaryTypeRef}>
                    <label className="block text-xs text-gray-500 mb-1">Тип зарплаты</label>
                    <button
                      type="button"
                      onClick={() => setIsSalaryTypeOpen((v) => !v)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
                    >
                      {(() => {
                        const cur = salaryTypeOptions.find(o => o.value === form.salary_type);
                        return cur ? cur.label : 'Выберите тип зарплаты';
                      })()}
                    </button>
                    {isSalaryTypeOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200">
                        <div className="py-1">
                          {salaryTypeOptions.map((opt) => (
                            <div key={opt.value}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => { setForm((s) => ({ ...s, salary_type: opt.value })); setIsSalaryTypeOpen(false); }}
                            >
                              <span className="block truncate text-sm">{opt.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative" ref={workExperienceRef}>
                    <label className="block text-xs text-gray-500 mb-1">Опыт работы</label>
                    <button
                      type="button"
                      onClick={() => setIsWorkExperienceOpen((v) => !v)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
                    >
                      {(() => {
                        const cur = workExperienceOptions.find(o => o.value === (form as any).work_experience);
                        return cur ? cur.label : 'Выберите опыт работы';
                      })()}
                    </button>
                    {isWorkExperienceOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200">
                        <div className="py-1">
                          {workExperienceOptions.map((opt) => (
                            <div key={opt.value}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setForm((s) => ({ ...s, work_experience: opt.value as any }));
                                setIsWorkExperienceOpen(false);
                                setErrors((prev) => {
                                  const { work_experience, ...rest } = prev || {} as any;
                                  return rest as Record<string, string>;
                                });
                              }}
                            >
                              <span className="block truncate text-sm">{opt.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {errors.work_experience && <p className="text-xs text-red-600 mt-1">{errors.work_experience}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative" ref={employmentRef}>
                    <label className="block text-xs text-gray-500 mb-1">Тип занятости</label>
                    <button
                      type="button"
                      onClick={() => setIsEmploymentOpen((v) => !v)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
                    >
                      {employmentTypeIds.length > 0 ? `Выбрано: ${employmentTypeIds.length}` : 'Выберите тип(ы) занятости'}
                    </button>
                    {isEmploymentOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-72 overflow-auto border border-gray-200 p-2 space-y-1">
                        {employmentTypes.map((t: any) => {
                          const id = Number(t.employment_type_id);
                          const checked = employmentTypeIds.includes(id);
                          return (
                            <label key={id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setEmploymentTypeIds((prev) => checked ? prev.filter((v) => v !== id) : [...prev, id]);
                                }}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">{t.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 mt-1">Можно выбрать несколько. Оставьте пустым, если неважно.</p>
                  </div>
                  <div className="relative" ref={educationRef}>
                    <label className="block text-xs text-gray-500 mb-1">Уровень образования</label>
                    <button
                      type="button"
                      onClick={() => setIsEducationOpen((v) => !v)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
                    >
                      {educationTypeIds.length > 0 ? `Выбрано: ${educationTypeIds.length}` : 'Выберите уровень(и) образования'}
                    </button>
                    {isEducationOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-72 overflow-auto border border-gray-200 p-2 space-y-1">
                        {educationTypes.map((t: any) => {
                          const id = Number(t.education_type_id);
                          const checked = educationTypeIds.includes(id);
                          return (
                            <label key={id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setEducationTypeIds((prev) => checked ? prev.filter((v) => v !== id) : [...prev, id])}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">{t.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 mt-1">Можно выбрать несколько. Оставьте пустым, если неважно.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative" ref={workFormatRef}>
                    <label className="block text-xs text-gray-500 mb-1">Формат работы</label>
                    <button
                      type="button"
                      onClick={() => setIsWorkFormatOpen((v) => !v)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
                    >
                      {workFormatIds.length > 0 ? `Выбрано: ${workFormatIds.length}` : 'Выберите формат(ы) работы'}
                    </button>
                    {isWorkFormatOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-72 overflow-auto border border-gray-200 p-2 space-y-1">
                        {workFormats.map((t: any) => {
                          const id = Number(t.work_format_id);
                          const checked = workFormatIds.includes(id);
                          return (
                            <label key={id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setWorkFormatIds((prev) => checked ? prev.filter((v) => v !== id) : [...prev, id])}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">{t.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 mt-1">Можно выбрать несколько. Оставьте пустым, если неважно.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative" ref={workScheduleTypeRef}>
                    <label className="block text-xs text-gray-500 mb-1">График работы</label>
                    <button
                      type="button"
                      onClick={() => setIsWorkScheduleTypeOpen((v) => !v)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
                    >
                      {workScheduleTypeIds.length > 0 ? `Выбрано: ${workScheduleTypeIds.length}` : 'Выберите график(и)'}
                    </button>
                    {isWorkScheduleTypeOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-72 overflow-auto border border-gray-200 p-2 space-y-1">
                        {workScheduleTypes.map((t: any) => {
                          const id = Number(t.schedule_type_id);
                          const checked = workScheduleTypeIds.includes(id);
                          return (
                            <label key={id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setWorkScheduleTypeIds((prev) => checked ? prev.filter((v) => v !== id) : [...prev, id])}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">{t.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 mt-1">Можно выбрать несколько. Оставьте пустым, если неважно.</p>
                  </div>
                  <div className="relative" ref={workScheduleRef}>
                    <label className="block text-xs text-gray-500 mb-1">Расписание</label>
                    <button
                      type="button"
                      onClick={() => setIsWorkScheduleOpen((v) => !v)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
                    >
                      {workScheduleIds.length > 0 ? `Выбрано: ${workScheduleIds.length}` : 'Выберите расписание'}
                    </button>
                    {isWorkScheduleOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-72 overflow-auto border border-gray-200 p-2 space-y-1">
                        {workSchedules.map((t: any) => {
                          const id = Number(t.schedule_id);
                          const checked = workScheduleIds.includes(id);
                          return (
                            <label key={id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setWorkScheduleIds((prev) => checked ? prev.filter((v) => v !== id) : [...prev, id])}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">{t.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 mt-1">Можно выбрать несколько. Оставьте пустым, если неважно.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative" ref={dayLengthRef}>
                    <label className="block text-xs text-gray-500 mb-1">Часов в день</label>
                    <button
                      type="button"
                      onClick={() => setIsDayLengthOpen((v) => !v)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
                    >
                      {dayLengthIds.length > 0 ? `Выбрано: ${dayLengthIds.length}` : 'Выберите варианты'}
                    </button>
                    {isDayLengthOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-72 overflow-auto border border-gray-200 p-2 space-y-1">
                        {workDayLengths.map((t: any) => {
                          const id = Number(t.day_length_id);
                          const checked = dayLengthIds.includes(id);
                          return (
                            <label key={id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setDayLengthIds((prev) => checked ? prev.filter((v) => v !== id) : [...prev, id])}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">{t.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 mt-1">Можно выбрать несколько. Оставьте пустым, если неважно.</p>
                  </div>
                  <div className="relative" ref={shiftTypeRef}>
                    <label className="block text-xs text-gray-500 mb-1">Смены</label>
                    <button
                      type="button"
                      onClick={() => setIsShiftTypeOpen((v) => !v)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
                    >
                      {shiftTypeIds.length > 0 ? `Выбрано: ${shiftTypeIds.length}` : 'Выберите смены'}
                    </button>
                    {isShiftTypeOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-72 overflow-auto border border-gray-200 p-2 space-y-1">
                        {shiftTypes.map((t: any) => {
                          const id = Number(t.shift_type_id);
                          const checked = shiftTypeIds.includes(id);
                          return (
                            <label key={id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setShiftTypeIds((prev) => checked ? prev.filter((v) => v !== id) : [...prev, id])}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">{t.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 mt-1">Можно выбрать несколько. Оставьте пустым, если неважно.</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button onClick={() => setView({ mode: 'list' })} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Отмена</button>
                  {view.mode === 'create' && (
                    <button disabled={loading || hasCriticalErrors} onClick={submitCreate} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">Создать</button>
                  )}
                  {view.mode === 'edit' && (
                    <button disabled={loading || hasCriticalErrors} onClick={submitEdit} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">Сохранить</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
