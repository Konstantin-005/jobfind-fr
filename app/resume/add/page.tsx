"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "../../config/api";
import employmentTypes from "../../config/employment_types_202505222228.json";
import workFormats from "../../config/work_formats_202505222228.json";
import educationTypes from "../../config/education_types_202505242225.json";

const steps = [
  { label: "Должность" },
  { label: "Условия работы" },
  { label: "Опыт работы" },
  { label: "Уровень образования" },
  { label: "О себе" },
  { label: "Контакты и настройки видимости" },
];

export default function ResumeAddPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    title: "",
    salary_expectation: "",
    employment_type_ids: [] as number[],
    work_format_ids: [] as number[],
    business_trips: "" as "yes" | "no" | "sometimes" | "",
    city_id: undefined as number | undefined,
    city_name: "",
    citySuggestions: [] as Array<{ city_id: number; name: string }>,
    isLoadingCity: false,
    work_experiences: [
      {
        company_id: undefined as number | undefined,
        company_name: "",
        city_id: undefined as number | undefined,
        city_name: "",
        position: "",
        profession_id: undefined as number | undefined,
        profession_name: "",
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

  // Месяцы для select
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

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
  const handleSuggestionClick = (name: string) => {
    setForm((prev) => ({ ...prev, title: name }));
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
          company_id: undefined,
          company_name: "",
          city_id: undefined,
          city_name: "",
          position: "",
          profession_id: undefined,
          profession_name: "",
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

  // Автокомплит для компании
  const handleCompanyInput = async (idx: number, value: string) => {
    handleWorkExpChange(idx, "company_name", value);
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
      // Приводим к виду { city_id, name }
      data = data.map((city: any) => ({ city_id: city.city_id ?? city.id, name: city.name }));
      handleWorkExpChange(idx, "citySuggestions", data);
    } catch (e) {
      handleWorkExpChange(idx, "citySuggestions", []);
    }
    handleWorkExpChange(idx, "isLoadingCity", false);
  };
  const handleCitySelect = (idx: number, city: { city_id: number; name: string }) => {
    handleWorkExpChange(idx, "city_id", city.city_id);
    handleWorkExpChange(idx, "city_name", city.name);
    handleWorkExpChange(idx, "citySuggestions", []);
  };

  // Автокомплит для должности
  const handleProfessionInput = async (idx: number, value: string) => {
    handleWorkExpChange(idx, "profession_name", value);
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
    handleWorkExpChange(idx, "profession_name", prof.name);
    handleWorkExpChange(idx, "professionSuggestions", []);
  };

  // Переход к следующему шагу (заглушка)
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Переход к предыдущему шагу (заглушка)
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Сохранить и выйти (заглушка)
  const handleSaveAndExit = () => {
    router.push("/resume");
  };

  const handleSearchCityInput = async (value: string) => {
    setForm((prev) => ({ ...prev, city_name: value }));
    if (!value.trim()) {
      setForm((prev) => ({ ...prev, citySuggestions: [] }));
      return;
    }
    setForm((prev) => ({ ...prev, isLoadingCity: true }));
    try {
      const res = await fetch(`${API_ENDPOINTS.citiesSearch}?query=${encodeURIComponent(value)}`);
      let data = await res.json();
      data = data.map((city: any) => ({ city_id: city.city_id ?? city.id, name: city.name }));
      setForm((prev) => ({ ...prev, citySuggestions: data }));
    } catch (e) {
      setForm((prev) => ({ ...prev, citySuggestions: [] }));
    }
    setForm((prev) => ({ ...prev, isLoadingCity: false }));
  };

  const handleSearchCitySelect = (city: { city_id: number; name: string }) => {
    setForm((prev) => ({
      ...prev,
      city_id: city.city_id,
      city_name: city.name,
      citySuggestions: [],
    }));
  };

  // 1. Добавляю функцию для удаления блока опыта работы
  const handleRemoveWorkExp = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      work_experiences: prev.work_experiences.filter((_, i) => i !== idx),
    }));
  };

  const handleEducationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, education_type_id: Number(e.target.value) }));
  };

  const handleEducationChange = (idx: number, field: string, value: any) => {
    setForm((prev) => {
      const updated = [...prev.educations];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, educations: updated };
    });
  };

  const handleAddEducation = () => {
    setForm((prev) => ({
      ...prev,
      educations: [
        ...prev.educations,
        {
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

  // 2. Обработчики для автокомплита учебного заведения
  const handleInstitutionInput = async (idx: number, value: string) => {
    handleEducationChange(idx, "institution", value);
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

  // 3. Обработчики для автокомплита специальности
  const handleSpecializationInput = async (idx: number, value: string) => {
    handleEducationChange(idx, "specialization", value);
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

  // 2. Добавляю обработчик для поля professional_summary
  const handleProfessionalSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, professional_summary: e.target.value }));
  };

  // 2. Добавляю обработчики для полей контактов и настроек видимости
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Маска для телефона: +7(XXX)XXX-XX-XX
    const maskedValue = value.replace(/\D/g, "").replace(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/, (_, p1, p2, p3, p4) => {
      let result = "+7";
      if (p1) result += `(${p1}`;
      if (p2) result += `)${p2}`;
      if (p3) result += `-${p3}`;
      if (p4) result += `-${p4}`;
      return result;
    });
    setForm((prev) => ({ ...prev, phone: maskedValue }));
  };

  const handlePhoneCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, phoneComment: e.target.value }));
  };

  const handleHasWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, hasWhatsapp: e.target.checked }));
  };

  const handleHasTelegramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, hasTelegram: e.target.checked }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, email: e.target.value }));
  };

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, website: e.target.value }));
  };

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

  const handleSave = async () => {
    try {
      // Проверка обязательных полей
      if (!form.title) {
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

      if (!form.city_id) {
        setErrorMessage('Укажите город поиска работы');
        setIsErrorModalOpen(true);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/resume/add');
        return;
      }

      const response = await fetch(API_ENDPOINTS.resumes.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          professional_summary: form.professional_summary,
          salary_expectation: form.salary_expectation ? Number(form.salary_expectation) : undefined,
          visibility: form.visibility,
          phone: form.phone,
          email: form.email,
          has_whatsapp: form.hasWhatsapp,
          has_telegram: form.hasTelegram,
          employment_type_ids: form.employment_type_ids.map(id => Number(id)),
          work_format_ids: form.work_format_ids.map(id => Number(id)),
          work_experiences: form.work_experiences.map(exp => ({
            company_id: exp.company_id,
            company_name: exp.company_name,
            city_id: exp.city_id,
            position: exp.profession_name,
            profession_id: exp.profession_id,
            start_month: exp.start_month,
            start_year: Number(exp.start_year),
            end_month: exp.end_month,
            end_year: exp.end_year ? Number(exp.end_year) : undefined,
            is_current: exp.is_current,
            responsibilities: exp.responsibilities,
          })),
          educations: form.educations.map(edu => ({
            institution_id: edu.institution_id,
            specialization_id: edu.specialization_id,
            end_year: Number(edu.end_year),
          })),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Произошла ошибка при создании резюме';
        
        switch (response.status) {
          case 400:
            errorMessage = 'Проверьте правильность заполнения данных формы';
            break;
          case 401:
            localStorage.removeItem('token');
            router.push('/login?redirect=/resume/add');
            return;
          case 403:
            errorMessage = 'У вас нет прав для выполнения этого действия';
            break;
          case 404:
            errorMessage = 'Страница не найдена';
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
      console.error('Error creating resume:', error);
      setErrorMessage('Произошла ошибка при создании резюме. Пожалуйста, попробуйте позже');
      setIsErrorModalOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFCFE]">
      {/* Sidebar */}
      <aside className="w-72 bg-white flex flex-col justify-between py-8 px-4 border-r border-gray-100">
        <div>
          <h2 className="text-lg font-bold mb-8">Создайте своё резюме</h2>
          <ol className="space-y-2">
            {steps.map((step, idx) => (
              <li key={step.label}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium text-base ${
                    idx === currentStep
                      ? "bg-white text-[#2B81B0] shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full border text-base font-bold mr-2 ${
                      idx === currentStep
                        ? "bg-[#2B81B0] text-white border-[#2B81B0]"
                        : "bg-gray-100 border-gray-200 text-gray-400"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  {step.label}
                </div>
              </li>
            ))}
          </ol>
        </div>
        <button
          className="mt-8 w-full bg-white border border-gray-200 rounded-lg py-3 font-semibold text-base text-gray-800 hover:bg-gray-50 transition shadow"
          onClick={handleSaveAndExit}
        >
          Сохранить и выйти
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start pt-12 bg-gray-200">
        <div className="w-full max-w-2xl">
          {currentStep === 0 && (
            <section>
              <h1 className="text-2xl font-bold mb-6">Кем вы хотите работать?</h1>
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-4 text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                  placeholder="Желаемая должность"
                  value={form.title}
                  onChange={handleTitleChange}
                />
                {isLoading && <div className="absolute right-4 top-4">Loading...</div>}
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.profession_id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSuggestionClick(suggestion.name)}
                      >
                        {suggestion.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-6">
                <label className="block text-lg font-medium mb-2">Желаемый уровень дохода (можно не указывать)</label>
                <input
                  type="number"
                  className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                  placeholder="Сумма в месяц"
                  value={form.salary_expectation}
                  onChange={handleSalaryChange}
                />
              </div>
              <div className="relative mb-4 mt-6">
                <input
                  type="text"
                  className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-4 text-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                  placeholder="Город поиска работы"
                  value={form.city_name}
                  onChange={e => handleSearchCityInput(e.target.value)}
                  autoComplete="off"
                />
                {form.isLoadingCity && <div className="absolute right-4 top-4">...</div>}
                {form.citySuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                    {form.citySuggestions.map(cityRaw => {
                      const city = {
                        city_id: (cityRaw as any).city_id ?? (cityRaw as any).id,
                        name: cityRaw.name,
                      };
                      return (
                        <li
                          key={city.city_id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSearchCitySelect(city)}
                        >
                          {city.name}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="flex justify-end mt-12">
                <button
                  className="bg-[#2B81B0] text-white px-10 py-3 rounded-lg font-semibold shadow hover:bg-[#18608a] transition text-lg"
                  onClick={handleNext}
                  disabled={!form.title.trim()}
                >
                  Далее
                </button>
              </div>
            </section>
          )}

          {currentStep === 1 && (
            <section>
              <h1 className="text-2xl font-bold mb-6">Условия работы</h1>
              
              {/* Тип занятости */}
              <div className="mb-8">
                <label className="block text-lg font-medium mb-4">Тип занятости</label>
                <div className="space-y-3">
                  {employmentTypes.employment_types.map((type) => (
                    <label key={type.employment_type_id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-[#2B81B0] border-gray-300 rounded focus:ring-[#2B81B0]"
                        checked={form.employment_type_ids.includes(type.employment_type_id)}
                        onChange={() => handleEmploymentTypeChange(type.employment_type_id)}
                      />
                      <span className="text-base">{type.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Формат работы */}
              <div className="mb-8">
                <label className="block text-lg font-medium mb-4">Формат работы</label>
                <div className="space-y-3">
                  {workFormats.work_formats.map((format) => (
                    <label key={format.work_format_id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-[#2B81B0] border-gray-300 rounded focus:ring-[#2B81B0]"
                        checked={form.work_format_ids.includes(format.work_format_id)}
                        onChange={() => handleWorkFormatChange(format.work_format_id)}
                      />
                      <span className="text-base">{format.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Командировки */}
              <div className="mb-8">
                <label className="block text-lg font-medium mb-4">Готовность к командировкам</label>
                <div className="space-y-3">
                  {[
                    { value: "yes", label: "Да" },
                    { value: "no", label: "Нет" },
                    { value: "sometimes", label: "Иногда" },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="business_trips"
                        className="w-5 h-5 text-[#2B81B0] border-gray-300 focus:ring-[#2B81B0]"
                        checked={form.business_trips === option.value}
                        onChange={() => handleBusinessTripsChange(option.value as "yes" | "no" | "sometimes")}
                      />
                      <span className="text-base">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-12">
                <button
                  className="bg-white text-[#2B81B0] border border-[#2B81B0] px-10 py-3 rounded-lg font-semibold shadow hover:bg-gray-50 transition text-lg"
                  onClick={handlePrev}
                >
                  Назад
                </button>
                <button
                  className="bg-[#2B81B0] text-white px-10 py-3 rounded-lg font-semibold shadow hover:bg-[#18608a] transition text-lg"
                  onClick={handleNext}
                  disabled={form.employment_type_ids.length === 0 || form.work_format_ids.length === 0 || !form.business_trips}
                >
                  Далее
                </button>
              </div>
            </section>
          )}

          {currentStep === 2 && (
            <section>
              <h1 className="text-2xl font-bold mb-6">Опыт работы</h1>
              {form.work_experiences.map((exp, idx) => (
                <div key={idx} className="mb-10 p-6 bg-gray-200 rounded-xl border border-gray-400 relative">
                  {/* Кнопка удалить */}
                  {idx > 0 && (
                    <button
                      type="button"
                      className="absolute top-4 right-4 p-2 rounded-full bg-white z-20 hover:bg-gray-300 transition"
                      onClick={() => handleRemoveWorkExp(idx)}
                      aria-label="Удалить опыт работы"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5V19a2 2 0 002 2h8a2 2 0 002-2V7.5M9.75 11.25v4.5m4.5-4.5v4.5M4.5 7.5h15m-10.125 0V5.25A1.5 1.5 0 0110.875 3.75h2.25a1.5 1.5 0 011.5 1.5V7.5" />
                      </svg>
                    </button>
                  )}
                  {/* Название компании */}
                  <div className="mb-4 relative z-10">
                    <input
                      type="text"
                      className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder="Название компании"
                      value={exp.company_name}
                      onChange={e => handleCompanyInput(idx, e.target.value)}
                      autoComplete="off"
                    />
                    {exp.isLoadingCompany && <div className="absolute right-4 top-3">...</div>}
                    {exp.companySuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                        {exp.companySuggestions.map(company => (
                          <li
                            key={company.company_id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleCompanySelect(idx, company)}
                          >
                            {company.company_name} {company.brand_name && <span className="text-gray-400">({company.brand_name})</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* Город */}
                  <div className="mb-4 relative">
                    <input
                      type="text"
                      className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder="Город или регион"
                      value={exp.city_name}
                      onChange={e => handleCityInput(idx, e.target.value)}
                      autoComplete="off"
                    />
                    {exp.isLoadingCity && <div className="absolute right-4 top-3">...</div>}
                    {exp.citySuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                        {exp.citySuggestions.map(cityRaw => {
                          const city = {
                            city_id: (cityRaw as any).city_id ?? (cityRaw as any).id,
                            name: cityRaw.name,
                          };
                          return (
                            <li
                              key={city.city_id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleCitySelect(idx, city)}
                            >
                              {city.name}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  {/* Должность */}
                  <div className="mb-4 relative">
                    <input
                      type="text"
                      className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder="Должность"
                      value={exp.profession_name}
                      onChange={e => handleProfessionInput(idx, e.target.value)}
                      autoComplete="off"
                    />
                    {exp.isLoadingProfession && <div className="absolute right-4 top-3">...</div>}
                    {exp.professionSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                        {exp.professionSuggestions.map(prof => (
                          <li
                            key={prof.profession_id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleProfessionSelect(idx, prof)}
                          >
                            {prof.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* Начало работы */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <select
                        className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-3 py-2"
                        value={exp.start_month || ""}
                        onChange={e => handleWorkExpChange(idx, "start_month", Number(e.target.value))}
                      >
                        <option value="">Месяц начала работы</option>
                        {months.map((m, i) => (
                          <option key={i} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-3 py-2"
                        placeholder="Год начала работы"
                        value={exp.start_year}
                        onChange={e => handleWorkExpChange(idx, "start_year", e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Окончание работы */}
                  {!exp.is_current && (
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <select
                          className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-3 py-2"
                          value={exp.end_month || ""}
                          onChange={e => handleWorkExpChange(idx, "end_month", Number(e.target.value))}
                        >
                          <option value="">Месяц окончания</option>
                          {months.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-3 py-2"
                          placeholder="Год окончания"
                          value={exp.end_year}
                          onChange={e => handleWorkExpChange(idx, "end_year", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  {/* Чекбокс "Продолжаю работать" */}
                  <div className="mb-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={exp.is_current}
                        onChange={e => handleWorkExpChange(idx, "is_current", e.target.checked)}
                      />
                      Работаю сейчас
                    </label>
                  </div>
                  {/* Описание обязанностей */}
                  <div className="mb-4">
                    <textarea
                      className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder="Описание"
                      value={exp.responsibilities}
                      onChange={e => handleWorkExpChange(idx, "responsibilities", e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="w-full bg-gray-300 border border-gray-400 text-[#2B81B0] rounded-full py-4 text-xl font-semibold shadow hover:bg-gray-400 transition"
                onClick={handleAddWorkExp}
              >
                + Добавить еще
              </button>
              <div className="flex justify-between mt-12">
                <button
                  className="bg-white text-[#2B81B0] border border-[#2B81B0] px-10 py-3 rounded-lg font-semibold shadow hover:bg-gray-50 transition text-lg"
                  onClick={handlePrev}
                >
                  Назад
                </button>
                <button
                  className="bg-[#2B81B0] text-white px-10 py-3 rounded-lg font-semibold shadow hover:bg-[#18608a] transition text-lg"
                  onClick={handleNext}
                >
                  Далее
                </button>
              </div>
            </section>
          )}

          {currentStep === 3 && (
            <section>
              <h1 className="text-2xl font-bold mb-6">Уровень образования</h1>
              <div className="mb-8">
                <label className="block text-lg font-medium mb-2">Образование</label>
                <select
                  className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                  value={form.education_type_id || ""}
                  onChange={handleEducationTypeChange}
                >
                  <option value="">Выберите уровень образования</option>
                  {educationTypes.education_types.map((type) => (
                    <option key={type.education_type_id} value={type.education_type_id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-8">
                <label className="block text-lg font-medium mb-2">Учебные заведения</label>
                {form.educations.map((edu, idx) => (
                  <div key={idx} className="mb-6 p-4 rounded-lg border border-gray-400 relative">
                    {idx > 0 && (
                      <button
                        type="button"
                        className="absolute top-2 right-2 p-1 rounded-full bg-white z-20 hover:bg-gray-300 transition"
                        onClick={() => handleRemoveEducation(idx)}
                        aria-label="Удалить учебное заведение"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5V19a2 2 0 002 2h8a2 2 0 002-2V7.5M9.75 11.25v4.5m4.5-4.5v4.5M4.5 7.5h15m-10.125 0V5.25A1.5 1.5 0 0110.875 3.75h2.25a1.5 1.5 0 011.5 1.5V7.5" />
                        </svg>
                      </button>
                    )}
                    <input
                      type="text"
                      className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base mb-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder="Учебное заведение"
                      value={edu.institution}
                      onChange={e => handleInstitutionInput(idx, e.target.value)}
                      autoComplete="off"
                    />
                    {edu.isLoadingInstitution && <div className="absolute right-4 top-3">...</div>}
                    {edu.institutionSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                        {edu.institutionSuggestions.map(inst => (
                          <li
                            key={inst.institution_id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleInstitutionSelect(idx, inst)}
                          >
                            {inst.name}
                          </li>
                        ))}
                      </ul>
                    )}
                    <input
                      type="text"
                      className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base mb-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder="Специальность"
                      value={edu.specialization}
                      onChange={e => handleSpecializationInput(idx, e.target.value)}
                      autoComplete="off"
                    />
                    {edu.isLoadingSpecialization && <div className="absolute right-4 top-3">...</div>}
                    {edu.specializationSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                        {edu.specializationSuggestions.map(spec => (
                          <li
                            key={spec.specialization_id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSpecializationSelect(idx, spec)}
                          >
                            {spec.name}
                          </li>
                        ))}
                      </ul>
                    )}
                    <input
                      type="number"
                      className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder="Год окончания"
                      value={edu.end_year}
                      onChange={e => handleEducationChange(idx, "end_year", e.target.value)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="w-full bg-gray-300 border border-gray-400 text-[#2B81B0] rounded-full py-3 text-lg font-semibold shadow hover:bg-gray-400 transition"
                  onClick={handleAddEducation}
                >
                  + Добавить учебное заведение
                </button>
              </div>
              <div className="flex justify-between mt-12">
                <button
                  className="bg-white text-[#2B81B0] border border-[#2B81B0] px-10 py-3 rounded-lg font-semibold shadow hover:bg-gray-50 transition text-lg"
                  onClick={handlePrev}
                >
                  Назад
                </button>
                <button
                  className="bg-[#2B81B0] text-white px-10 py-3 rounded-lg font-semibold shadow hover:bg-[#18608a] transition text-lg"
                  onClick={handleNext}
                >
                  Далее
                </button>
              </div>
            </section>
          )}

          {currentStep === 4 && (
            <section>
              <h1 className="text-2xl font-bold mb-6">О себе</h1>
              <div className="mb-8">
                <label className="block text-lg font-medium mb-2">Расскажите о себе</label>
                <textarea
                  className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                  placeholder="Опишите свой опыт, навыки и достижения"
                  value={form.professional_summary}
                  onChange={handleProfessionalSummaryChange}
                  rows={8}
                />
              </div>
              <div className="flex justify-between mt-12">
                <button
                  className="bg-white text-[#2B81B0] border border-[#2B81B0] px-10 py-3 rounded-lg font-semibold shadow hover:bg-gray-50 transition text-lg"
                  onClick={handlePrev}
                >
                  Назад
                </button>
                <button
                  className="bg-[#2B81B0] text-white px-10 py-3 rounded-lg font-semibold shadow hover:bg-[#18608a] transition text-lg"
                  onClick={handleNext}
                >
                  Далее
                </button>
              </div>
            </section>
          )}

          {currentStep === 5 && (
            <section>
              <h1 className="text-2xl font-bold mb-6">Контакты и настройки видимости</h1>
              <div className="mb-8">
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder="Телефон в формате +7(XXX)XXX-XX-XX"
                      value={form.phone}
                      onChange={handlePhoneChange}
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={form.hasWhatsapp}
                        onChange={handleHasWhatsappChange}
                      />
                      Есть Вотсап
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={form.hasTelegram}
                        onChange={handleHasTelegramChange}
                      />
                      Есть Телеграм
                    </label>
                  </div>
                  <div>
                    <input
                      type="text"
                      className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder="Комментарий к номеру телефона"
                      value={form.phoneComment}
                      onChange={handlePhoneCommentChange}
                    />
                  </div>               
                  <div>
                    <input
                      type="email"
                      className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder="Email"
                      value={form.email}
                      onChange={handleEmailChange}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder="Веб-сайт"
                      value={form.website}
                      onChange={handleWebsiteChange}
                    />
                  </div>
                </div>
              </div>
              <div className="mb-8">
                <h2 className="text-lg font-medium mb-4">Настройки приватности</h2>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={form.hideNameAndPhoto}
                      onChange={handleHideNameAndPhotoChange}
                    />
                    Скрыть ФИО и фото
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={form.hidePhone}
                      onChange={handleHidePhoneChange}
                    />
                    Скрыть номер телефона
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={form.hideEmail}
                      onChange={handleHideEmailChange}
                    />
                    Скрыть Емайл
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={form.hideOtherContacts}
                      onChange={handleHideOtherContactsChange}
                    />
                    Скрыть остальные контакты
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={form.hideCompanyNames}
                      onChange={handleHideCompanyNamesChange}
                    />
                    Скрыть названия компаний в опыте работы
                  </label>
                  <div>
                    <label className="block text-base mb-2">Видимость резюме</label>
                    <div className="space-y-2">
                      {[
                        { value: "public", label: "Видно всем зарегистрированным работодателям на сайте" },
                        { value: "excluded_companies", label: "Видно всем, кроме работодателей из черного списка" },
                        { value: "selected_companies", label: "Видно только работодателям из белого списка" },
                        { value: "link_only", label: "Доступ только по прямой ссылке" },
                        { value: "private", label: "Не видно никому" },
                      ].map((option) => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="radio"
                            name="visibility"
                            className="mr-2"
                            value={option.value}
                            checked={form.visibility === option.value}
                            onChange={handleVisibilityChange}
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-12">
                <button
                  className="bg-white text-[#2B81B0] border border-[#2B81B0] px-10 py-3 rounded-lg font-semibold shadow hover:bg-gray-50 transition text-lg"
                  onClick={handlePrev}
                >
                  Назад
                </button>
                <button
                  className="bg-[#2B81B0] text-white px-10 py-3 rounded-lg font-semibold shadow hover:bg-[#18608a] transition text-lg"
                  onClick={handleSave}
                >
                  Сохранить
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Модальное окно с ошибкой */}
      {isErrorModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Ошибка</h3>
              <button
                onClick={() => setIsErrorModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
      )}
    </div>
  );
} 