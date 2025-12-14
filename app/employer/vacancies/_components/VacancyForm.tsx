/**
 * @file: app/employer/vacancies/_components/VacancyForm.tsx
 * @description: Переиспользуемая форма создания/редактирования вакансии работодателя для страниц /employer/vacancies/add и /employer/vacancies/[id]/edit.
 * @dependencies: app/utils/api.ts (jobsApi), app/config/api.ts, app/components/RichTextEditor
 * @created: 2025-12-13
 */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import RichTextEditor from '../../../components/RichTextEditor';
import CityAutocomplete from '../../../components/CityAutocomplete';
import { jobsApi, type JobPosting } from '../../../utils/api';
import { API_ENDPOINTS } from '../../../config/api';

import employmentTypesData from '../../../config/employment_types_202505222228.json';
import educationTypesData from '../../../config/education_types_202505242225.json';
import workFormatsData from '../../../config/work_formats_202505222228.json';
import workScheduleTypesData from '../../../config/work_schedule_types_20251028.json';
import workSchedulesData from '../../../config/work_schedules_20251028.json';
import workDayLengthsData from '../../../config/work_day_lengths_20251028.json';
import shiftTypesData from '../../../config/shift_types_20251028.json';

type FormState = Partial<JobPosting> & { id?: number };

type JobUpsertPayload = {
  profession_id?: number;
  title: string;
  description?: string;
  experience_level?: string;
  work_experience?: string;
  is_contract_possible?: boolean;
  addresses?: { city_id: number; district_id: number | null; address: string; metro_station_ids: number[] }[];
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

type VacancyProfession = { profession_id: number; name: string };

type CityOption = { id: number; name: string };

type RegionOption = { id: number; name: string; type?: string };

type VacancyAddressFormItem = { city_id: string; city_name?: string; address: string };

type Props = {
  mode: 'create' | 'edit';
  jobId?: number;
};

export default function VacancyForm({ mode, jobId }: Props) {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [isCompanyMissing, setIsCompanyMissing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormState>({ title: '' });

  const [regionIds, setRegionIds] = useState<number[]>([]);
  const [employmentTypeIds, setEmploymentTypeIds] = useState<number[]>([]);
  const [educationTypeIds, setEducationTypeIds] = useState<number[]>([]);
  const [workFormatIds, setWorkFormatIds] = useState<number[]>([]);
  const [workScheduleTypeIds, setWorkScheduleTypeIds] = useState<number[]>([]);
  const [workScheduleIds, setWorkScheduleIds] = useState<number[]>([]);
  const [dayLengthIds, setDayLengthIds] = useState<number[]>([]);
  const [shiftTypeIds, setShiftTypeIds] = useState<number[]>([]);

  const [addresses, setAddresses] = useState<VacancyAddressFormItem[]>([{ city_id: '', city_name: '', address: '' }]);
  const [addressesTouched, setAddressesTouched] = useState(false);

  const [professionInput, setProfessionInput] = useState<string>('');
  const [professionSuggestions, setProfessionSuggestions] = useState<VacancyProfession[]>([]);
  const [isProfessionDropdownOpen, setIsProfessionDropdownOpen] = useState(false);
  const [isLoadingProfession, setIsLoadingProfession] = useState(false);

  const [publicationCityIds, setPublicationCityIds] = useState<number[]>([]);
  const [selectedCities, setSelectedCities] = useState<CityOption[]>([]);
  const [cityQuery, setCityQuery] = useState<string>('');
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const [regionInput, setRegionInput] = useState<string>('');
  const [regionSuggestions, setRegionSuggestions] = useState<RegionOption[]>([]);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);

  const [isEmploymentOpen, setIsEmploymentOpen] = useState(false);
  const [isEducationOpen, setIsEducationOpen] = useState(false);
  const [isWorkFormatOpen, setIsWorkFormatOpen] = useState(false);
  const [isWorkScheduleTypeOpen, setIsWorkScheduleTypeOpen] = useState(false);
  const [isWorkScheduleOpen, setIsWorkScheduleOpen] = useState(false);
  const [isDayLengthOpen, setIsDayLengthOpen] = useState(false);
  const [isShiftTypeOpen, setIsShiftTypeOpen] = useState(false);

  const [isSalaryFrequencyOpen, setIsSalaryFrequencyOpen] = useState(false);
  const [isSalaryPeriodOpen, setIsSalaryPeriodOpen] = useState(false);
  const [isSalaryTypeOpen, setIsSalaryTypeOpen] = useState(false);
  const [isWorkExperienceOpen, setIsWorkExperienceOpen] = useState(false);

  const professionDropdownRef = useRef<HTMLDivElement | null>(null);
  const cityDropdownRef = useRef<HTMLDivElement | null>(null);
  const regionDropdownRef = useRef<HTMLDivElement | null>(null);

  const salaryFrequencyRef = useRef<HTMLDivElement | null>(null);
  const salaryPeriodRef = useRef<HTMLDivElement | null>(null);
  const salaryTypeRef = useRef<HTMLDivElement | null>(null);
  const workExperienceRef = useRef<HTMLDivElement | null>(null);

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

  const workExperienceOptions = [
    { label: 'без опыта', value: '0' },
    { label: 'до 1 года', value: '0_1' },
    { label: 'от 1 до 3 лет', value: '1_3' },
    { label: 'от 3 до 6 лет', value: '3_5' },
    { label: 'более 6 лет', value: 'more_5' },
  ];

  const hasCriticalErrors = useMemo(() => {
    const titleMissing = !form.title || !form.title.trim();
    const descMissing = !form.description || !form.description.trim();
    const noProfession = !form.profession_id;
    const salaryInvalid =
      typeof form.salary_min === 'number' &&
      typeof form.salary_max === 'number' &&
      form.salary_min > form.salary_max;
    const citiesOver = publicationCityIds.length > 10;
    const regionsOver = regionIds.length > 10;
    const noCity = !(Array.isArray(publicationCityIds) && publicationCityIds.length > 0) && !form.publication_city_id;
    const noWorkExp = !form.work_experience;
    return titleMissing || descMissing || noProfession || noCity || salaryInvalid || citiesOver || regionsOver || noWorkExp;
  }, [
    form.title,
    form.description,
    form.profession_id,
    form.salary_min,
    form.salary_max,
    form.publication_city_id,
    form.work_experience,
    publicationCityIds,
    regionIds,
  ]);

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!form.title || !form.title.trim()) nextErrors.title = 'Укажите название вакансии';
    if (!form.description || !form.description.trim()) nextErrors.description = 'Укажите описание вакансии';
    if (!form.profession_id) nextErrors.profession_id = 'Выберите профессию из списка';

    if (!((Array.isArray(publicationCityIds) && publicationCityIds.length > 0) || form.publication_city_id)) {
      nextErrors.city_ids = 'Выберите хотя бы один город публикации';
    }

    if (typeof form.salary_min === 'number' && typeof form.salary_max === 'number' && form.salary_min > form.salary_max) {
      nextErrors.salary = 'Минимальная зарплата не может быть больше максимальной';
    }

    if (publicationCityIds.length > 10) nextErrors.city_ids = 'Можно выбрать не более 10 городов';
    if (regionIds.length > 1) nextErrors.region_ids = 'Можно выбрать только один регион';

    if (!form.work_experience) nextErrors.work_experience = 'Выберите опыт работы';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

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

  // Загрузка профиля компании (для проверки наличия и адресов)
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_ENDPOINTS.companies.profile, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (res.status === 404) {
          setIsCompanyMissing(true);
          return;
        }

        if (res.ok) {
          setIsCompanyMissing(false);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // Инициализация состояния формы
  useEffect(() => {
    if (mode === 'create') {
      setForm({
        title: '',
        description: '',
        profession_id: undefined,
        publication_city_id: undefined,
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
      setRegionInput('');
      setProfessionInput('');
      setEmploymentTypeIds([]);
      setEducationTypeIds([]);
      setWorkFormatIds([]);
      setWorkScheduleTypeIds([]);
      setWorkScheduleIds([]);
      setDayLengthIds([]);
      setShiftTypeIds([]);
      setAddresses([{ city_id: '', city_name: '', address: '' }]);
      setAddressesTouched(false);
      return;
    }

    if (mode === 'edit' && jobId) {
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await jobsApi.getCompanyJob(jobId);
          if (res.error) {
            setError(res.error);
            return;
          }
          const full = res.data as JobPosting | undefined;
          if (!full) {
            setError('Не удалось загрузить данные вакансии.');
            return;
          }

          setForm({
            id: full.job_id,
            title: full.title,
            description: full.description,
            profession_id: full.profession_id,
            publication_city_id: full.publication_city_id,
            is_active: full.is_active,
            is_contract_possible: full.is_contract_possible,
            salary_min: full.salary_min,
            salary_max: full.salary_max,
            salary_currency: full.salary_currency,
            salary_frequency: full.salary_frequency,
            salary_period: full.salary_period,
            salary_type: full.salary_type,
            employment_type: (full as any).employment_type,
            experience_level: full.experience_level,
            work_experience: full.work_experience,
            work_format: (full as any).work_format,
            work_schedule: (full as any).work_schedule,
            hours_per_day: (full as any).hours_per_day,
            shifts: (full as any).shifts,
            expiration_date: full.expiration_date,
          });

          try {
            const jobAddressesRaw = Array.isArray((full as any)?.addresses) ? ((full as any).addresses as any[]) : [];
            if (jobAddressesRaw.length > 0) {
              setAddresses(
                jobAddressesRaw
                  .map((a: any) => ({
                    city_id: a?.city_id ? String(a.city_id) : '',
                    city_name: String(a?.city_name || ''),
                    address: String(a?.address || ''),
                  }))
                  .filter((a: VacancyAddressFormItem) => !!a.city_id || !!a.address)
                  .slice(0, 10)
              );
              setAddressesTouched(false);
            } else {
              setAddresses([{ city_id: '', city_name: '', address: '' }]);
              setAddressesTouched(false);
            }
          } catch {
            setAddresses([{ city_id: '', city_name: '', address: '' }]);
            setAddressesTouched(false);
          }

          try {
            const profName = String((full as any)?.profession?.name || '');
            if (profName) setProfessionInput(profName);
          } catch {
            // ignore
          }

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
          } catch {
            // ignore
          }

          try {
            const anyV = full as any;
            const pickIds = (ids: any, entities: any[], key: string): number[] => {
              if (Array.isArray(ids)) return ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
              if (Array.isArray(entities)) return entities.map((e) => Number(e?.[key])).filter((n) => Number.isFinite(n));
              return [];
            };

            const initEmployment = pickIds(anyV.employment_type_ids, anyV.employment_types, 'employment_type_id');
            setEmploymentTypeIds(initEmployment);

            const initEducation = pickIds(anyV.education_type_ids, anyV.education_types, 'education_type_id');
            setEducationTypeIds(initEducation);

            const initWorkFormats = pickIds(anyV.work_format_ids, anyV.work_formats, 'work_format_id');
            setWorkFormatIds(initWorkFormats);

            const initScheduleTypes = pickIds(anyV.work_schedule_type_ids, anyV.work_schedule_types, 'schedule_type_id');
            setWorkScheduleTypeIds(initScheduleTypes);

            const initSchedules = pickIds(anyV.work_schedule_ids, anyV.work_schedules, 'schedule_id');
            setWorkScheduleIds(initSchedules);

            const initDayLengthsA = pickIds(anyV.day_length_ids, anyV.work_day_lengths, 'day_length_id');
            const initDayLengthsB = pickIds(undefined, anyV.day_lengths, 'day_length_id');
            setDayLengthIds(Array.from(new Set([...(initDayLengthsA || []), ...(initDayLengthsB || [])])));

            const initShifts = pickIds(anyV.shift_type_ids, anyV.shift_types, 'shift_type_id');
            setShiftTypeIds(initShifts);

            const initRegions = pickIds(anyV.region_ids, anyV.regions, 'region_id');
            setRegionIds(initRegions);
            try {
              const firstRegionName = String((anyV.regions?.[0]?.name) || '');
              if (firstRegionName) setRegionInput(firstRegionName);
            } catch {
              // ignore
            }
          } catch {
            // ignore
          }
        } catch {
          setError('Не удалось загрузить вакансию. Попробуйте обновить страницу позже.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [mode, jobId]);

  // Поиск профессий
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
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [professionInput]);

  // Поиск городов
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
            ? data.map((c: any) => ({ id: c.city_id ?? c.id, name: c.name }))
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
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [cityQuery]);

  // Поиск регионов
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
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [regionInput]);

  // Закрытие дропдаунов по клику вне
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;

      if (isCityDropdownOpen) {
        const el = cityDropdownRef.current;
        if (el && target instanceof Node && !el.contains(target)) setIsCityDropdownOpen(false);
      }

      if (isRegionDropdownOpen) {
        const el = regionDropdownRef.current;
        if (el && target instanceof Node && !el.contains(target)) setIsRegionDropdownOpen(false);
      }

      if (isProfessionDropdownOpen) {
        const el = professionDropdownRef.current;
        if (el && target instanceof Node && !el.contains(target)) setIsProfessionDropdownOpen(false);
      }

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

      if (isEmploymentOpen) {
        const el = employmentRef.current;
        if (el && !el.contains(target)) setIsEmploymentOpen(false);
      }
      if (isEducationOpen) {
        const el = educationRef.current;
        if (el && !el.contains(target)) setIsEducationOpen(false);
      }
      if (isWorkFormatOpen) {
        const el = workFormatRef.current;
        if (el && !el.contains(target)) setIsWorkFormatOpen(false);
      }
      if (isWorkScheduleTypeOpen) {
        const el = workScheduleTypeRef.current;
        if (el && !el.contains(target)) setIsWorkScheduleTypeOpen(false);
      }
      if (isWorkScheduleOpen) {
        const el = workScheduleRef.current;
        if (el && !el.contains(target)) setIsWorkScheduleOpen(false);
      }
      if (isDayLengthOpen) {
        const el = dayLengthRef.current;
        if (el && !el.contains(target)) setIsDayLengthOpen(false);
      }
      if (isShiftTypeOpen) {
        const el = shiftTypeRef.current;
        if (el && !el.contains(target)) setIsShiftTypeOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [
    isCityDropdownOpen,
    isRegionDropdownOpen,
    isProfessionDropdownOpen,
    isSalaryFrequencyOpen,
    isSalaryPeriodOpen,
    isSalaryTypeOpen,
    isWorkExperienceOpen,
    isEmploymentOpen,
    isEducationOpen,
    isWorkFormatOpen,
    isWorkScheduleTypeOpen,
    isWorkScheduleOpen,
    isDayLengthOpen,
    isShiftTypeOpen,
  ]);

  async function handleSubmit() {
    if (isCompanyMissing) {
      setError('Сначала создайте профиль компании, чтобы публиковать вакансии.');
      return;
    }

    if (mode === 'edit' && !form.id) return;

    if (!validate()) return;

    setLoading(true);
    setError(null);

    const cityIds = Array.isArray(publicationCityIds) && publicationCityIds.length > 0
      ? publicationCityIds
      : (form.publication_city_id ? [Number(form.publication_city_id)] : []);

    const payload: JobUpsertPayload = {
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

    const preparedAddresses = addresses
      .filter((a) => a.city_id && a.address && a.address.trim())
      .map((a) => ({
        city_id: Number(a.city_id),
        district_id: null,
        address: String(a.address).trim(),
        metro_station_ids: [],
      }))
      .slice(0, 10);

    if (mode === 'create') {
      payload.addresses = preparedAddresses;
    }

    try {
      const res = mode === 'create'
        ? await jobsApi.create(payload as any)
        : await jobsApi.update(form.id!, payload as any);

      if (res.error) {
        setError(res.error);
        return;
      }

      const savedJobId = mode === 'create' ? Number((res.data as any)?.job_id) : Number(form.id);

      if (mode === 'edit' && addressesTouched && Number.isFinite(savedJobId) && savedJobId > 0) {
        const addrRes = await jobsApi.replaceAddresses(savedJobId, preparedAddresses);
        if (addrRes.error) {
          setError(addrRes.error);
          return;
        }
      }

      router.push('/employer/vacancies');
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? 'Новая вакансия' : 'Редактирование вакансии'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'create'
                  ? 'Заполните данные и опубликуйте вакансию'
                  : 'Обновите данные вакансии и сохраните изменения'}
              </p>
            </div>
            <Link
              href="/employer/vacancies"
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Назад
            </Link>
          </div>

          {isCompanyMissing && (
            <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-md">
              Сначала создайте профиль компании, чтобы публиковать вакансии.{" "}
              <Link href="/employer/addcompany" className="text-blue-600 font-medium hover:underline">
                Перейти к созданию компании
              </Link>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {Object.keys(errors).length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-md">
              Пожалуйста, исправьте ошибки в форме и попробуйте снова.
            </div>
          )}

          {loading && (
            <div className="mb-6 p-4 bg-gray-50 text-gray-600 rounded-md">Загрузка...</div>
          )}

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative" ref={professionDropdownRef}>
            <label className="block text-xs text-gray-500 mb-1">Профессия</label>
            <input
              type="text"
              value={professionInput}
              onChange={(e) => {
                setProfessionInput(e.target.value);
                setIsProfessionDropdownOpen(true);
              }}
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
                    const { profession_id, ...rest } = (prev || {}) as any;
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
                    <div
                      key={p.profession_id}
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

            <div>
              <label className="block text-xs text-gray-500 mb-1">Описание</label>
              <div className="border border-gray-200 rounded-lg resizable-editor">
                <RichTextEditor
                  value={form.description || ''}
                  onChange={(val) => setForm((s) => ({ ...s, description: val }))}
                  placeholder="Краткое описание вакансии"
                />
              </div>
              {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
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
                const cur = workExperienceOptions.find((o) => o.value === (form as any).work_experience);
                return cur ? cur.label : 'Выберите опыт работы';
              })()}
            </button>
            {isWorkExperienceOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200">
                <div className="py-1">
                  {workExperienceOptions.map((opt) => (
                    <div
                      key={opt.value}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setForm((s) => ({ ...s, work_experience: opt.value as any }));
                        setIsWorkExperienceOpen(false);
                        setErrors((prev) => {
                          const { work_experience, ...rest } = (prev || {}) as any;
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
                        onChange={() => setEducationTypeIds((prev) => (checked ? prev.filter((v) => v !== id) : [...prev, id]))}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{t.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Зарплата мин</label>
            <input
              type="number"
              value={form.salary_min ?? ''}
              onChange={(e) =>
                setForm((s) => ({ ...s, salary_min: e.target.value ? Number(e.target.value) : undefined }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Зарплата макс</label>
            <input
              type="number"
              value={form.salary_max ?? ''}
              onChange={(e) =>
                setForm((s) => ({ ...s, salary_max: e.target.value ? Number(e.target.value) : undefined }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            {errors.salary && <p className="text-xs text-red-600 mt-1">{errors.salary}</p>}
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
                const cur = salaryPeriodOptions.find((o) => o.value === form.salary_period);
                return cur ? cur.label : 'Выберите период зарплаты';
              })()}
            </button>
            {isSalaryPeriodOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200">
                <div className="py-1">
                  {salaryPeriodOptions.map((opt) => (
                    <div
                      key={opt.value}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setForm((s) => ({ ...s, salary_period: opt.value }));
                        setIsSalaryPeriodOpen(false);
                      }}
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
                const cur = salaryTypeOptions.find((o) => o.value === form.salary_type);
                return cur ? cur.label : 'Выберите тип зарплаты';
              })()}
            </button>
            {isSalaryTypeOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200">
                <div className="py-1">
                  {salaryTypeOptions.map((opt) => (
                    <div
                      key={opt.value}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setForm((s) => ({ ...s, salary_type: opt.value }));
                        setIsSalaryTypeOpen(false);
                      }}
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
          <div className="relative" ref={salaryFrequencyRef}>
            <label className="block text-xs text-gray-500 mb-1">Частота выплаты</label>
            <button
              type="button"
              onClick={() => setIsSalaryFrequencyOpen((v) => !v)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white"
            >
              {(() => {
                const cur = salaryFrequencyOptions.find((o) => o.value === form.salary_frequency);
                return cur ? cur.label : 'Выберите частоту выплаты';
              })()}
            </button>
            {isSalaryFrequencyOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto border border-gray-200">
                <div className="py-1">
                  {salaryFrequencyOptions.map((opt) => (
                    <div
                      key={opt.value}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setForm((s) => ({ ...s, salary_frequency: opt.value }));
                        setIsSalaryFrequencyOpen(false);
                      }}
                    >
                      <span className="block truncate text-sm">{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
                    <div className="flex items-center gap-2 mt-6">
            <input
              id="is_contract_possible"
              type="checkbox"
              checked={!!form.is_contract_possible}
              onChange={(e) => setForm((s) => ({ ...s, is_contract_possible: e.target.checked }))}
              className="h-4 w-4"
            />
            <label htmlFor="is_contract_possible" className="text-sm text-gray-700">
              Возможно заключение договора ГПХ/с ИП/с самозанятыми
            </label>
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
                          setEmploymentTypeIds((prev) => (checked ? prev.filter((v) => v !== id) : [...prev, id]));
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{t.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
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
                        onChange={() => setWorkFormatIds((prev) => (checked ? prev.filter((v) => v !== id) : [...prev, id]))}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{t.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
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
                        onChange={() => setWorkScheduleTypeIds((prev) => (checked ? prev.filter((v) => v !== id) : [...prev, id]))}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{t.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
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
                        onChange={() => setWorkScheduleIds((prev) => (checked ? prev.filter((v) => v !== id) : [...prev, id]))}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{t.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
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
                        onChange={() => setDayLengthIds((prev) => (checked ? prev.filter((v) => v !== id) : [...prev, id]))}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{t.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
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
                        onChange={() => setShiftTypeIds((prev) => (checked ? prev.filter((v) => v !== id) : [...prev, id]))}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{t.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative" ref={cityDropdownRef}>
            <label className="block text-xs text-gray-500 mb-1">Города публикации (до 10)</label>
            <button
              type="button"
              onClick={() => {
                if (isLoadingCities) return;
                setIsCityDropdownOpen((v) => !v);
              }}
              disabled={isLoadingCities}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left bg-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {publicationCityIds.length > 0 ? `Выбрано: ${publicationCityIds.length}/10` : 'Выберите города'}
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
                              setPublicationCityIds((prev) => prev.filter((id) => id !== c.id));
                              setSelectedCities((prev) => prev.filter((x) => x.id !== c.id));
                            } else {
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
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200"
                  >
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
              onChange={(e) => {
                setRegionInput(e.target.value);
                setIsRegionDropdownOpen(true);
              }}
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
                onClick={() => {
                  setRegionIds([]);
                  setRegionInput('');
                }}
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
                    <div
                      key={r.id}
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

        <div>
          <label className="block text-xs text-gray-500 mb-1">Адреса места работы (необязательно)</label>
          <div className="space-y-4 mt-2">
            {addresses.map((item, index) => (
              <div key={index} className="p-4 border rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">Населенный пункт</span>
                    <CityAutocomplete
                      value={item.city_id}
                      initialCityName={item.city_name || ''}
                      onChange={(cityId) => {
                        setAddressesTouched(true);
                        setAddresses((prev) =>
                          prev.map((a, i) => (i === index ? { ...a, city_id: cityId, city_name: '' } : a))
                        );
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Адрес</label>
                    <input
                      type="text"
                      value={item.address}
                      onChange={(e) => {
                        setAddressesTouched(true);
                        const value = e.target.value;
                        setAddresses((prev) => prev.map((a, i) => (i === index ? { ...a, address: value } : a)));
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      placeholder="Улица, дом, офис"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setAddressesTouched(true);
                      setAddresses((prev) => prev.filter((_, i) => i !== index));
                    }}
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
              onClick={() => {
                if (addresses.length >= 10) return;
                setAddressesTouched(true);
                setAddresses((prev) => [...prev, { city_id: '', address: '' }]);
              }}
              className="text-blue-600 text-sm hover:underline"
            >
              + Добавить ещё адрес
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Можно добавить до 10 адресов.</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/employer/vacancies"
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Отмена
          </Link>
          <button
            disabled={loading || hasCriticalErrors || isCompanyMissing}
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {mode === 'create' ? 'Создать' : 'Сохранить'}
          </button>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
