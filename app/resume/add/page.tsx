"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "../../config/api";

const steps = [
  { label: "Должность" },
  { label: "Стаж в должности" },
  { label: "Навыки" },
  { label: "Город поиска работы" },
  { label: "Зарплата" },
  { label: "Уровень образования" },
];

export default function ResumeAddPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    title: "",
    salary_expectation: "",
    // ... остальные поля для следующих шагов
  });
  const [suggestions, setSuggestions] = useState<Array<{ profession_id: number; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

  return (
    <div className="flex min-h-screen bg-[#FAFCFE]">
      {/* Sidebar */}
      <aside className="w-72 bg-[#F5F8FB] flex flex-col justify-between py-8 px-4 border-r border-gray-100">
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
      <main className="flex-1 flex flex-col items-center justify-start pt-12">
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
                <label className="block text-lg font-medium mb-2">Желаемый уровень дохода</label>
                <input
                  type="number"
                  className="w-full bg-[#F5F8FB] border border-gray-200 rounded-lg px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                  placeholder="Введите сумму"
                  value={form.salary_expectation}
                  onChange={handleSalaryChange}
                />
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
          {/* Здесь будут остальные шаги */}
        </div>
      </main>
    </div>
  );
} 