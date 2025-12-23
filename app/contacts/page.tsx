/**
 * @file: page.tsx
 * @description: SSR страница «Контакты» для платформы E77.top
 * @dependencies: Next.js App Router, глобальные стили Tailwind
 * @created: 2025-12-23
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Контакты | E77.top',
  description:
    'Контакты команды E77.top: поддержка пользователей, партнёрства, юридические вопросы, адрес и реквизиты.',
}

export default function ContactsPage() {
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Контакты</h1>
        <p className="text-gray-700 mb-8">
          Свяжитесь с командой E77.top по вопросам поддержки, партнёрств и юридической информации. Мы отвечаем в рабочие
          дни и стараемся помочь максимально быстро.
        </p>

        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Поддержка пользователей</h2>
            <p className="text-gray-700">
              Почта: <a className="text-blue-600 hover:text-blue-700" href="mailto:support@e77.top">support@e77.top</a>
            </p>
            <p className="text-gray-700">Часы работы: пн–пт, 10:00–19:00 (MSK).</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">Партнёрства и реклама</h2>
            <p className="text-gray-700">
              Почта: <a className="text-blue-600 hover:text-blue-700" href="mailto:partnership@e77.top">partnership@e77.top</a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">Юридические вопросы и данные</h2>
            <p className="text-gray-700">
              Почта: <a className="text-blue-600 hover:text-blue-700" href="mailto:privacy@e77.top">privacy@e77.top</a>
            </p>
            <p className="text-gray-700">Используйте этот адрес для запросов по персональным данным и отзывов согласия.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">Обратная связь</h2>
            <p className="text-gray-700">
              Если вы нашли ошибку или хотите предложить улучшения, напишите на адрес поддержки. Пожалуйста, укажите:
              устройство, браузер, URL страницы и краткое описание проблемы — это ускорит ответ.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
