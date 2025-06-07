"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
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

// Месяцы для select
const months = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

export default function ResumeEditPage({ params }: { params: { id: string } }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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

  // Загрузка данных резюме при монтировании компонента
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/resume/' + params.id + '/edit');
          return;
        }

        const response = await fetch(`/api/resumes/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Ошибка загрузки резюме');
        }

        const data = await response.json();
        
        // Преобразуем данные в формат формы
        setForm({
          title: data.title || "",
          profession_id: data.profession_id,
          salary_expectation: data.salary_expectation?.toString() || "",
          employment_type_ids: data.employmentTypes?.map((et: any) => et.employment_type_id) || [],
          work_format_ids: data.workFormats?.map((wf: any) => wf.work_format_id) || [],
          business_trips: data.business_trips || "",
          work_experiences: data.workExperiences?.map((exp: any) => ({
            experience_id: exp.experience_id,
            company_id: exp.company_id,
            company_name: exp.company_name || "",
            city_id: exp.city_id,
            city_name: exp.City?.name || "",
            position: exp.position || "",
            profession_id: exp.profession_id,
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
          })) || [{
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
          }],
          education_type_id: data.education_type_id,
          educations: data.education?.map((edu: any) => ({
            education_id: edu.education_id,
            institution: edu.EducationalInstitution?.name || "",
            institution_id: edu.institution_id,
            specialization: edu.Specialization?.name || "",
            specialization_id: edu.specialization_id,
            end_year: edu.end_year?.toString() || "",
            institutionSuggestions: [],
            specializationSuggestions: [],
            isLoadingInstitution: false,
            isLoadingSpecialization: false,
          })) || [{
            education_id: undefined,
            institution: "",
            institution_id: undefined,
            specialization: "",
            specialization_id: undefined,
            end_year: "",
            institutionSuggestions: [],
            specializationSuggestions: [],
            isLoadingInstitution: false,
            isLoadingSpecialization: false,
          }],
          professional_summary: data.professional_summary || "",
          phone: data.phone || "",
          phoneComment: data.phone_comment || "",
          hasWhatsapp: data.has_whatsapp || false,
          hasTelegram: data.has_telegram || false,
          email: data.email || "",
          website: data.website_url || "",
          hideNameAndPhoto: data.hide_full_name || false,
          hidePhone: data.hide_phone || false,
          hideEmail: data.hide_email || false,
          hideOtherContacts: data.hide_other_contacts || false,
          hideCompanyNames: data.hide_experience || false,
          visibility: data.visibility || "public",
        });

        if (data.photo_url) {
          const photoUrl = `${API_BASE_URL}/${data.photo_url}`;
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

  // Переход к следующему шагу
  const handleNext = () => {
    if (currentStep === 0) {
      if (!form.title.trim()) {
        setErrorMessage('Укажите желаемую должность');
        setIsErrorModalOpen(true);
        return;
      }
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Переход к предыдущему шагу
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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
    setForm((prev) => ({ ...prev, phone: e.target.value }));
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
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      if (form.phone) formData.append('phone', form.phone);
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

      const response = await fetch(`/api/resumes/${params.id}`, {
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
      if (form.phone) formData.append('phone', form.phone);
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

      const response = await fetch(`/api/resumes/${params.id}`, {
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
      {/* Sidebar */}
      <aside className="w-72 bg-gray-200 flex flex-col justify-between py-8 px-4 border-r border-gray-100 pt-16">
        <div>
          <h2 className="text-lg font-bold mb-8 text-gray-900">Редактирование резюме</h2>
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
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start pt-16 bg-white">
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
                        onClick={() => handleSuggestionClick(suggestion.name, suggestion.profession_id)}
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
              {/* Фото профиля */}
              <div className="mt-6">
                <label className="block text-lg font-medium mb-2">Ваше фото (не обязательно)</label>
              </div>
              <div className="mb-8 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Фото профиля"
                      className="w-full h-full object-cover rounded-full border-2 border-[#2B81B0]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer bg-white text-[#2B81B0] border border-[#2B81B0] px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition">
                  {photoPreview ? 'Изменить фото' : 'Добавить фото'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
              <div className="flex justify-between mt-12">
                <button
                  className="bg-white text-[#2B81B0] border border-[#2B81B0] px-10 py-3 rounded-lg font-semibold shadow hover:bg-gray-50 transition text-lg"
                  onClick={handleSaveAndClose}
                >
                  Сохранить и закрыть
                </button>
                <button
                  className="bg-[#2B81B0] text-white px-10 py-3 rounded-lg font-semibold shadow hover:bg-[#18608a] transition text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleNext}
                  disabled={currentStep === 0 && !form.title.trim()}
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
                <label className="block text-lg font-medium mb-4">Тип занятости <span className="text-red-500 ml-1">*</span></label>
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
                <label className="block text-lg font-medium mb-4">Формат работы <span className="text-red-500 ml-1">*</span></label>
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
                  onClick={handleSaveAndClose}
                >
                  Сохранить и закрыть
                </button>
                <button
                  className="bg-white text-[#2B81B0] border border-[#2B81B0] px-10 py-3 rounded-lg font-semibold shadow hover:bg-gray-50 transition text-lg"
                  onClick={handlePrev}
                >
                  Назад
                </button>
                <button
                  className="bg-[#2B81B0] text-white px-10 py-3 rounded-lg font-semibold shadow hover:bg-[#18608a] transition text-lg"
                  onClick={handleNext}
                  disabled={form.employment_type_ids.length === 0 || form.work_format_ids.length === 0}
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
                <div key={idx} className="mb-10 p-6 bg-white rounded-xl border border-gray-400 relative">
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
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition whitespace-pre-line break-words"
                        placeholder="Город или населенный пункт"
                        value={exp.city_name}
                        onChange={e => {
                          handleWorkExpChange(idx, "city_name", e.target.value);
                          handleWorkExpChange(idx, "city_id", undefined);
                          handleCityInput(idx, e.target.value);
                        }}
                        autoComplete="off"
                        readOnly={!!exp.city_id}
                        style={{ wordBreak: 'break-word' }}
                      />
                      {exp.city_id && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                          onClick={() => {
                            handleWorkExpChange(idx, "city_name", "");
                            handleWorkExpChange(idx, "city_id", undefined);
                          }}
                          tabIndex={-1}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
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
                                onClick={() => {
                                  handleWorkExpChange(idx, "city_id", city.city_id);
                                  handleWorkExpChange(idx, "city_name", city.name);
                                  handleWorkExpChange(idx, "citySuggestions", []);
                                }}
                              >
                                {city.name}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                  {/* Должность */}
                  <div className="mb-4 relative">
                    <input
                      type="text"
                      className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      placeholder="Должность"
                      value={exp.position}
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
                className="w-full bg-gray-300 border border-gray-400 text-[#2B81B0] rounded-lg py-4 text-xl font-semibold shadow hover:bg-gray-400 transition"
                onClick={handleAddWorkExp}
              >
                + Добавить еще компанию
              </button>
              <div className="flex justify-between mt-12">
                <button
                  className="bg-white text-[#2B81B0] border border-[#2B81B0] px-10 py-3 rounded-lg font-semibold shadow hover:bg-gray-50 transition text-lg"
                  onClick={handleSaveAndClose}
                >
                  Сохранить и закрыть
                </button>
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
                <label className="block text-lg font-medium mb-2">
                  Образование
                  <span className="text-red-500 ml-1">*</span>
                </label>
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
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 pr-10 text-base mb-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition whitespace-pre-line break-words"
                        placeholder="Учебное заведение"
                        value={edu.institution}
                        onChange={e => handleInstitutionInput(idx, e.target.value)}
                        autoComplete="off"
                        readOnly={!!edu.institution_id}
                        style={{ wordBreak: 'break-word' }}
                      />
                      {edu.institution_id && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                          onClick={() => {
                            handleEducationChange(idx, "institution", "");
                            handleEducationChange(idx, "institution_id", undefined);
                          }}
                          tabIndex={-1}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
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
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-3 pr-10 text-base mb-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition whitespace-pre-line break-words"
                        placeholder="Специальность"
                        value={edu.specialization}
                        onChange={e => handleSpecializationInput(idx, e.target.value)}
                        autoComplete="off"
                        readOnly={!!edu.specialization_id}
                        style={{ wordBreak: 'break-word' }}
                      />
                      {edu.specialization_id && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                          onClick={() => {
                            handleEducationChange(idx, "specialization", "");
                            handleEducationChange(idx, "specialization_id", undefined);
                          }}
                          tabIndex={-1}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
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
                    </div>
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
                  className="w-full bg-gray-300 border border-gray-400 text-[#2B81B0] rounded-lg py-3 text-lg font-semibold shadow hover:bg-gray-400 transition"
                  onClick={handleAddEducation}
                >
                  + Добавить учебное заведение
                </button>
              </div>
              <div className="flex justify-between mt-12">
                <button
                  className="bg-white text-[#2B81B0] border border-[#2B81B0] px-10 py-3 rounded-lg font-semibold shadow hover:bg-gray-50 transition text-lg"
                  onClick={handleSaveAndClose}
                >
                  Сохранить и закрыть
                </button>
                <button
                  className="bg-white text-[#2B81B0] border border-[#2B81B0] px-10 py-3 rounded-lg font-semibold shadow hover:bg-gray-50 transition text-lg"
                  onClick={handlePrev}
                >
                  Назад
                </button>
                <button
                  className="bg-[#2B81B0] text-white px-10 py-3 rounded-lg font-semibold shadow hover:bg-[#18608a] transition text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleNext}
                  disabled={!form.education_type_id}
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
                  onClick={handleSaveAndClose}
                >
                  Сохранить и закрыть
                </button>
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
                      placeholder="Телефон в формате +7XXXXXXXXXX"
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
                  onClick={handleSaveAndClose}
                >
                  Сохранить и закрыть
                </button>
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