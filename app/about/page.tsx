/**
 * @file: page.tsx
 * @description: SSR страница «О проекте» для платформы E77.top
 * @dependencies: Next.js App Router, глобальные стили Tailwind
 * @created: 2025-12-23
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'О проекте | E77.top',
  description:
    'Узнайте о платформе E77.top: миссия, ценности, преимущества для соискателей и работодателей, безопасность и качество сервисов.',
}

export default function AboutPage() {
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">О проекте E77.top</h1>
        <p className="text-gray-700 mb-8">
          E77.top — платформа поиска работы и подбора персонала, объединяющая соискателей и работодателей с
          акцентом на прозрачность, скорость и безопасность. Мы развиваем сервис в соответствии с законодательством РФ,
          поддерживаем удобные инструменты общения и стремимся сокращать время выхода на работу.
        </p>

        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Миссия и ценности</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Помогать людям находить подходящую работу быстрее и осознаннее.</li>
              <li>Давать работодателям точные инструменты поиска кандидатов и управления откликами.</li>
              <li>Соблюдать прозрачность, защищать данные пользователей и уважать их время.</li>
              <li>Упрощать взаимодействие: поиск, отклик, чат и оффер — в одном интерфейсе.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">Что доступно сегодня</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Поиск вакансий с фильтрами по городу, опыту, формату работы и зарплате.</li>
              <li>Публикация и управление вакансиями для работодателей, работа с откликами.</li>
              <li>Чат между соискателями и работодателями, интегрированный в отклики.</li>
              <li>Публичные ссылки на резюме и просмотр карточек кандидатов.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">Почему E77.top</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Фокус на российский рынок труда и локальные требования.</li>
              <li>Соблюдение законодательства РФ (152-ФЗ, ГК РФ, ЗоЗПП) и защита персональных данных.</li>
              <li>Удобные сценарии для обеих ролей: соискатель видит статус отклика, работодатель — актуальные резюме.</li>
              <li>Техническая поддержка и регулярные обновления функционала.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">Прозрачность и безопасность</h2>
            <p className="text-gray-700">
              Мы используем защищённые каналы передачи данных, применяем организационные и технические меры для защиты
              аккаунтов и персональных данных. Подробнее — в Политике обработки персональных данных и Политике cookie.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">Кому подходит</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Соискателям, которые хотят быстро откликаться и общаться с работодателем в одном окне.</li>
              <li>Работодателям, которым важны точные фильтры, прозрачные статусы откликов и коммуникация с кандидатами.</li>
              <li>HR-командам, желающим вести вакансии и получать аналитику по откликам.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">Как связаться</h2>
            <p className="text-gray-700">
              По вопросам сотрудничества и предложений пишите на{' '}
              <a className="text-blue-600 hover:text-blue-700" href="mailto:partnership@e77.top">
                partnership@e77.top
              </a>
              . По вопросам поддержки — <a className="text-blue-600 hover:text-blue-700" href="mailto:support@e77.top">support@e77.top</a>.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
