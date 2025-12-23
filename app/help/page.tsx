/**
 * @file: page.tsx
 * @description: SSR страница «Помощь» для пользователей платформы E77.top
 * @dependencies: Next.js App Router, глобальные стили Tailwind
 * @created: 2025-12-23
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Помощь | E77.top',
  description:
    'Справка по E77.top: как зарегистрироваться, искать вакансии, публиковать вакансии, работать с откликами и чатами, а также как получить поддержку.',
}

export default function HelpPage() {
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Помощь</h1>
        <p className="text-gray-700 mb-8">
          Эта страница поможет быстро разобраться с основными сценариями на E77.top. Если ответа нет ниже — напишите в
          поддержку, мы постараемся помочь.
        </p>

        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">1. Регистрация и вход</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Для начала создайте аккаунт соискателя или работодателя на странице регистрации.</li>
              <li>Подтвердите email по ссылке из письма. Без подтверждения вход может быть ограничен.</li>
              <li>Если не получили письмо, проверьте «Спам» или воспользуйтесь кнопкой повторной отправки.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">2. Поиск вакансий</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Введите запрос на главной странице или используйте фильтры по городу, опыту, зарплате и формату работы.</li>
              <li>На странице вакансии вы увидите описание, условия и кнопку «Откликнуться».</li>
              <li>Следите за статусом отклика в личном кабинете и в чате.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">3. Создание и управление вакансиями</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Работодатели создают профиль компании, затем публикуют вакансии.</li>
              <li>Заполняйте требования, условия, зарплату и контакты — это повышает конверсию откликов.</li>
              <li>Управляйте откликами: меняйте статусы, переходите в чат с кандидатом, отправляйте приглашения.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">4. Резюме и публичные ссылки</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Создайте резюме в личном кабинете и включите публичную ссылку, если хотите делиться им напрямую.</li>
              <li>Обновляйте опыт, навыки и контакты — свежие резюме получают больше просмотров.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">5. Чаты и уведомления</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Чат доступен из отклика или через общую страницу чатов.</li>
              <li>Статусы прочтения сообщений отображаются для прозрачной коммуникации.</li>
              <li>Проверяйте уведомления в интерфейсе; при необходимости пишите в поддержку.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">6. Безопасность</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Не передавайте пароль третьим лицам, используйте сложные комбинации.</li>
              <li>При потере доступа используйте восстановление пароля или напишите в поддержку.</li>
              <li>Сообщайте о подозрительной активности через privacy@e77.top.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">7. Поддержка</h2>
            <p className="text-gray-700">
              Если нужна помощь, напишите на <a className="text-blue-600 hover:text-blue-700" href="mailto:support@e77.top">support@e77.top</a>.
              Укажите URL страницы, краткое описание проблемы, устройство и браузер. Мы ответим в рабочие часы (пн–пт,
              10:00–19:00 MSK).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">8. Полезные ссылки</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><a className="text-blue-600 hover:text-blue-700" href="/about">О проекте</a></li>
              <li><a className="text-blue-600 hover:text-blue-700" href="/contacts">Контакты</a></li>
              <li><a className="text-blue-600 hover:text-blue-700" href="/privacy">Политика обработки персональных данных</a></li>
              <li><a className="text-blue-600 hover:text-blue-700" href="/terms">Пользовательское соглашение</a></li>
              <li><a className="text-blue-600 hover:text-blue-700" href="/cookie-policy">Политика cookie</a></li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}
