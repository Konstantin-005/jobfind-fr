import dynamic from 'next/dynamic';

const MyCompanyPageClient = dynamic(() => import('./MyCompanyPageClient'), { ssr: false });

export default function MyCompanyPage() {
  return <MyCompanyPageClient />;
}