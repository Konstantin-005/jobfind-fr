/**
 * @file: ProfilePageClient.tsx
 * @description: Клиентская форма профиля соискателя с обработкой query-параметров и локальным состоянием.
 * @dependencies: app/config/api, app/components/CityAutocomplete
 * @created: 2025-11-15
 */
"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_ENDPOINTS } from "../config/api";
import languagesData from "../config/languages_202505172245.json";
import drivingLicenseCategoriesData from "../config/driving_license_categories_202505172315.json";
import CityAutocomplete from '../components/CityAutocomplete';

const jobSearchStatuses = [
  { value: "actively_looking", label: "Активно ищу работу" },
  { value: "considering_offers", label: "Рассматриваю предложения" },
  { value: "not_looking", label: "Не ищу работу" },
];
const genders = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
];
const proficiencyLevels = [
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
  { value: "C1", label: "C1" },
  { value: "C2", label: "C2" },
  { value: "native", label: "Родной" },
];
const drivingCategories = drivingLicenseCategoriesData.driving_license_categories.map(cat => ({
  value: cat.category_id,
  label: cat.code
}));

export default function ProfilePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState<any>({
    job_search_status: "actively_looking",
    last_name: "",
    first_name: "",
    middle_name: "",
    gender: "male",
    birth_date: "",
    city_id: "",
    languages: [],
    driving_licenses: [],
  });
  const [fromResumeAdd] = useState(searchParams.get("from") === "resumeAdd");
  const [showDrivingDropdown, setShowDrivingDropdown] = useState(false);
  const drivingDropdownRef = useRef<HTMLDivElement>(null);

  // Проверка авторизации и типа пользователя
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("user_type");

    if (!token || userType !== "job_seeker") {
      router.push("/vacancy");
      return;
    }
  }, [router]);

  // Получение городов
  useEffect(() => {
    fetch(API_ENDPOINTS.locations)
      .then((r) => r.json())
      .then((data) => setCities(data.cities || []));
  }, []);

  // Получение профиля
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    
    fetch(API_ENDPOINTS.jobSeekerProfile.me, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (r.status === 404) {
          setLoading(false);
          return; // Пустая форма
        }
        if (!r.ok) {
          setError("Ошибка загрузки профиля");
          setLoading(false);
          return;
        }
        const data = await r.json();

        // Получаем название города по ID
        let cityName = "";
        if (data.city_id) {
          try {
            const cityResponse = await fetch(API_ENDPOINTS.dictionaries.citiesByIds, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ city_ids: [data.city_id] }),
            });
            const cityData = await cityResponse.json();
            if (cityData && cityData.length > 0) {
              cityName = cityData[0].name;
            }
          } catch (error) {
            console.error('Error fetching city name:', error);
          }
        }

        setForm({
          ...form,
          ...data,
          birth_date: data.birth_date ? data.birth_date.split("T")[0] : "",
          languages: data.JobSeekerLanguages?.map((lang: any) => ({
            language_id: lang.language_id.toString(),
            proficiency_level: lang.proficiency_level
          })) || [],
          driving_licenses: data.JobSeekerDrivingLicenses?.map((license: any) => license.category_id) || [],
          city_name: cityName
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Ошибка загрузки профиля");
        setLoading(false);
      });
  }, []);

  // Закрытие dropdown при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        drivingDropdownRef.current &&
        !drivingDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDrivingDropdown(false);
      }
    }
    if (showDrivingDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDrivingDropdown]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleLangChange(idx: number, field: string, value: any) {
    setForm((prev: any) => {
      const langs = [...prev.languages];
      langs[idx] = { ...langs[idx], [field]: value };
      return { ...prev, languages: langs };
    });
  }
  function addLanguage() {
    setForm((prev: any) => ({ ...prev, languages: [...prev.languages, { language_id: "", proficiency_level: "" }] }));
  }
  function removeLanguage(idx: number) {
    setForm((prev: any) => {
      const langs = [...prev.languages];
      langs.splice(idx, 1);
      return { ...prev, languages: langs };
    });
  }
  function handleDrivingCheckboxChange(categoryId: number) {
    setForm((prev: any) => {
      const exists = prev.driving_licenses.includes(categoryId);
      let updated;
      if (exists) {
        updated = prev.driving_licenses.filter((id: number) => id !== categoryId);
      } else {
        updated = [...prev.driving_licenses, categoryId];
      }
      return { ...prev, driving_licenses: updated };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const method = form.profile_id ? "PUT" : "POST";
    const url = form.profile_id ? API_ENDPOINTS.jobSeekerProfile.update : API_ENDPOINTS.jobSeekerProfile.create;

    // Формируем тело запроса в соответствии со спецификацией API
    const requestBody = {
      first_name: form.first_name,
      last_name: form.last_name,
      middle_name: form.middle_name,
      birth_date: form.birth_date,
      gender: form.gender,
      job_search_status: form.job_search_status,
      city_id: parseInt(form.city_id),
      driving_licenses: form.driving_licenses.map((id: number) => ({
        category_id: id
      })),
      languages: form.languages.map((lang: any) => ({
        language_id: parseInt(lang.language_id),
        proficiency_level: lang.proficiency_level
      }))
    };

    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    })
      .then(async (r) => {
        if (!r.ok) {
          const errorData = await r.json().catch(() => ({}));
          setError(errorData.message || "Ошибка сохранения профиля");
          setLoading(false);
          return;
        }
        if (fromResumeAdd) {
          router.push("/resume/add");
        } else {
          setSuccess("Данные профиля успешно обновлены.");
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Ошибка сохранения профиля");
        setLoading(false);
      });
  }

  return (
    <div className="max-w-2xl mx-auto pt-12 pb-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Данные профиля</h1>
      {fromResumeAdd && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
          Видимость ФИО для работодателей можно будет указать в настройках резюме.
        </div>
      )}
      {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-800 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 text-green-800 rounded">{success}</div>}
      <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4" onSubmit={handleSubmit}>
        <label className="font-semibold text-sm flex items-center gap-1">Статус поиска работы <span className="text-red-500">*</span></label>
        <select name="job_search_status" value={form.job_search_status} onChange={handleChange} required className="border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition placeholder-gray-400">
          {jobSearchStatuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <label className="font-semibold text-sm flex items-center gap-1">Фамилия <span className="text-red-500">*</span></label>
        <input name="last_name" value={form.last_name} onChange={handleChange} required className="border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition placeholder-gray-400" placeholder="Введите фамилию" />
        <label className="font-semibold text-sm flex items-center gap-1">Имя <span className="text-red-500">*</span></label>
        <input name="first_name" value={form.first_name} onChange={handleChange} required className="border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition placeholder-gray-400" placeholder="Введите имя" />
        <label className="font-semibold text-sm">Отчество</label>
        <input name="middle_name" value={form.middle_name} onChange={handleChange} className="border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition placeholder-gray-400" placeholder="Необязательно" />
        <label className="font-semibold text-sm flex items-center gap-1">Пол <span className="text-red-500">*</span></label>
        <select name="gender" value={form.gender} onChange={handleChange} required className="border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition">
          {genders.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
        <label className="font-semibold text-sm flex items-center gap-1">Дата рождения <span className="text-red-500">*</span></label>
        <input name="birth_date" type="date" value={form.birth_date} onChange={handleChange} required className="border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition" placeholder="ДД.ММ.ГГГГ" />
        <label className="font-semibold text-sm flex items-center gap-1">Город проживания <span className="text-red-500">*</span></label>
        <CityAutocomplete
          value={form.city_id}
          onChange={(cityId) => setForm({ ...form, city_id: cityId })}
          required
          initialCityName={form.city_name}
        />
        <label className="font-semibold text-sm">Владение иностранными языками</label>
        <div>
          {form.languages.map((lang: any, idx: number) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <select value={lang.language_id} onChange={e => handleLangChange(idx, "language_id", e.target.value)} className="border rounded-lg px-2 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition">
                <option value="">Язык</option>
                {languagesData.languages.map((l: any) => (
                  <option key={l.language_id} value={l.language_id}>{l.name}</option>
                ))}
              </select>
              <select value={lang.proficiency_level} onChange={e => handleLangChange(idx, "proficiency_level", e.target.value)} className="border rounded-lg px-2 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition">
                <option value="">Уровень владения</option>
                {proficiencyLevels.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <button type="button" onClick={() => removeLanguage(idx)} className="text-red-500 font-bold text-xl px-2 hover:bg-red-50 rounded-full transition">×</button>
            </div>
          ))}
          <button type="button" onClick={addLanguage} className="text-[#2B81B0] font-semibold text-sm mt-1 hover:underline">+ Добавить язык</button>
        </div>
        <label className="font-semibold text-sm">Права на управление ТС</label>
        <div className="relative" ref={drivingDropdownRef}>
          <button
            type="button"
            className="w-full border rounded-lg px-3 py-3 text-base text-left focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition bg-white"
            onClick={() => setShowDrivingDropdown((v) => !v)}
          >
            {form.driving_licenses.length === 0
              ? "Категории"
              : drivingCategories
                  .filter((cat) => form.driving_licenses.includes(cat.value))
                  .map((cat) => cat.label)
                  .join(", ")}
          </button>
          {showDrivingDropdown && (
            <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto">
              {drivingCategories.map((cat) => (
                <label key={cat.value} className="flex items-center gap-2 px-2 py-1 hover:bg-blue-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.driving_licenses.includes(cat.value)}
                    onChange={() => handleDrivingCheckboxChange(cat.value)}
                    className="accent-blue-500"
                  />
                  {cat.label}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2 flex justify-end mt-6">
          <button type="submit" className="bg-[#2B81B0] text-white px-8 py-3 rounded-lg font-semibold shadow hover:bg-[#18608a] hover:shadow-lg transition text-lg">Сохранить</button>
        </div>
      </form>
    </div>
  );
} 