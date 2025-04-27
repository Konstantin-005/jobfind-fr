'use client';

import Header from './components/Header';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">{children}</main>
    </>
  );
} 