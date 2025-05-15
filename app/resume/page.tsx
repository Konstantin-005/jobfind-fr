'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyResumes } from '../utils/api';

interface Resume {
  resume_id: number;
  title: string;
  profession_id: number;
  profession_name?: string;
  salary_expectation?: number;
  visibility: string;
  link_uuid: string;
}

const visibilityMap: Record<string, string> = {
  public: 'доступно всем',
  private: 'доступно только вам',
  selected_companies: 'доступно выбранным компаниям',
  excluded_companies: 'доступно только работодателям, кроме черного списка',
  link_only: 'по ссылке',
};

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchResumes = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          setError('Не авторизовано');
          setLoading(false);
          router.push('/login');
          return;
        }
        const userType = typeof window !== 'undefined' ? localStorage.getItem('user_type') : null;
        if (userType !== 'job_seeker') {
          setLoading(false);
          router.push('/');
          return;
        }
        const res = await getMyResumes(token);
        if (res.error) {
          setError(res.error);
        } else {
          setResumes(res.data || []);
        }
      } catch (e) {
        setError('Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, [router]);

  return (
    <div className="max-w-6xl mx-auto pt-12 pb-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Мои резюме</h1>
        <Link href="#" className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-5 py-2 rounded-lg font-semibold text-base shadow hover:bg-blue-100 transition">
          <span className="text-lg">+</span> Создать резюме
        </Link>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : resumes.length === 0 ? (
        <div className="text-center text-gray-500 py-8">У вас пока нет резюме</div>
      ) : (
        <div className="divide-y divide-gray-200">
          {resumes.map((resume) => (
            <div className="py-6" key={resume.resume_id}>
              <div className="mb-1">
                <span className="text-xl font-bold text-[#2B81B0]">{resume.title}</span>
              </div>
              <div className="text-lg text-gray-700 mb-1">
                {resume.salary_expectation ? `от ${resume.salary_expectation.toLocaleString()} руб.` : 'договорная з/п'}
              </div>
              <div className="text-gray-500 text-sm mb-1">
                {/* Здесь можно добавить дату обновления, если появится в API */}
                {visibilityMap[resume.visibility] || resume.visibility}
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {/* Можно добавить теги или статусы */}
              </div>
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition">Разместить</button>
                <Link href="#" className="text-blue-600 hover:underline font-medium">Редактировать</Link>
                <span className="text-gray-400">•</span>
                <Link href="#" className="text-blue-600 hover:underline font-medium">Распечатать</Link>
                <span className="text-gray-400">•</span>
                <Link href="#" className="text-blue-600 hover:underline font-medium">Скачать</Link>
                <span className="text-gray-400">•</span>
                <Link href="#" className="text-blue-600 hover:underline font-medium">Ещё <span className="align-middle">▼</span></Link>
              </div>
              <div className="flex flex-row gap-12 mt-2">
                <div className="text-center">
                  <div className="text-2xl text-blue-700 font-bold">0</div>
                  <div className="text-gray-500 text-sm">Просмотров</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl text-blue-700 font-bold">0</div>
                  <div className="text-gray-500 text-sm">Откликов</div>
                </div>
                <div className="text-center relative">
                  <div className="text-2xl text-blue-700 font-bold flex items-center justify-center">
                    0
                    <span className="ml-1 inline-block w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">0</span>
                  </div>
                  <div className="text-gray-500 text-sm">Вакансии</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 