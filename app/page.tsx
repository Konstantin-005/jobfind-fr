'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm) {
      router.push(`/vacancy?query=${encodeURIComponent(searchTerm)}`)
    }
  }

  const popularSearches = [
    'Разработчик Python',
    'Frontend Developer',
    'Data Scientist',
    'DevOps инженер',
    'UX/UI дизайнер',
    'Product Manager'
  ]

  const cityLinks = [
    { name: 'Москве', slug: 'moskva' },
    { name: 'Санкт-Петербурге', slug: 'sankt-peterburg' },
    { name: 'Новосибирске', slug: 'novosibirsk' },
    { name: 'Екатеринбурге', slug: 'ekaterinburg' },
    { name: 'Казани', slug: 'kazan' },
    { name: 'Нижнем Новгороде', slug: 'nizhniy-novgorod' },
    { name: 'Челябинске', slug: 'chelyabinsk' },
    { name: 'Самаре', slug: 'samara' },
    { name: 'Ростове-на-Дону', slug: 'rostov-na-donu' },
    { name: 'Уфе', slug: 'ufa' },
    { name: 'Красноярске', slug: 'krasnoyarsk' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Hero секция */}
      <div className="relative pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Найдите работу своей <span className="text-blue-600">мечты</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Тысячи вакансий от лучших IT-компаний России ждут вас. Начните поиск прямо сейчас.
            </p>

            {/* Поисковая форма */}
            <form className="max-w-2xl mx-auto mb-8" onSubmit={handleSearch}>
              <div className="flex flex-col md:flex-row gap-3 bg-white rounded-xl shadow-lg p-2 border border-gray-200">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Профессия, компания или навык"
                    className="w-full pl-10 pr-4 py-4 text-lg rounded-lg border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-lg shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Найти</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Популярные запросы */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <span className="text-sm text-gray-500 mr-2">Популярные запросы:</span>
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setSearchTerm(search)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition px-2 py-1 rounded"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600">Активных вакансий</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Компаний</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">50,000+</div>
              <div className="text-gray-600">Соискателей</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">95%</div>
              <div className="text-gray-600">Успешных наймов</div>
            </div>
          </div>

          {/* Преимущества платформы */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Почему выбирают E77.top?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Быстрый поиск</h3>
                <p className="text-gray-600">
                  Мощный алгоритм поиска помогает найти релевантные вакансии за секунды
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Проверенные компании</h3>
                <p className="text-gray-600">
                  Все компании проходят верификацию, гарантируя надежность вакансий
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Личный кабинет</h3>
                <p className="text-gray-600">
                  Управляйте резюме, отслеживайте отклики и общайтесь с работодателями
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA секция */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Готовы найти работу своей мечты?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Присоединяйтесь к тысячам соискателей, которые уже нашли работу через E77.top
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/register" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg text-lg shadow-md transition">
              Создать резюме бесплатно
            </a>
            <a href="/vacancy" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 rounded-lg text-lg transition">
              Посмотреть вакансии
            </a>
          </div>
        </div>
      </div>

      {/* Работа в других городах */}
      <div className="bg-slate-900 text-slate-100 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-bold mb-6">Работа в городах РФ</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {cityLinks.map((c) => (
              <Link
                key={c.slug}
                href={`/vakansii/${c.slug}`}
                className="text-slate-200 hover:text-white underline decoration-slate-500/60 hover:decoration-white underline-offset-4 transition"
              >
                В {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}