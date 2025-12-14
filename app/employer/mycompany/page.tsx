import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const MyCompanyPageClient = dynamic(() => import('./MyCompanyPageClient'), { ssr: false });

export const metadata: Metadata = {
  title: 'Моя компания — Профиль компании',
  description: 'Просмотр и редактирование профиля компании работодателя: описание, отрасли, адреса и контакты.',
};

export default function MyCompanyPage() {
  return <MyCompanyPageClient />;
}