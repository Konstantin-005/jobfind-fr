'use client';

import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between bg-white border border-gray-200 rounded-xl shadow-lg px-6 py-4">
      <div className="text-gray-800 text-sm">
        Продолжая просмотр сайта, я соглашаюсь с использованием файлов cookie владельцем сайта в соответствии с{' '}
        <a href="/cookie-policy" className="text-blue-600 underline hover:text-blue-800 transition">Политикой в отношении файлов cookie</a>
      </div>
      <button
        onClick={handleAccept}
        className="ml-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition"
      >
        Принять и закрыть
      </button>
    </div>
  );
} 