'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyResumes } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

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
  const [copyingResumeId, setCopyingResumeId] = useState<number | null>(null);
  const [deletingResumeId, setDeletingResumeId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
        if (res.error.includes('Job seeker profile not found')) {
          router.push('/profile?from=resumeAdd');
          return;
        }
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

  useEffect(() => {
    fetchResumes();
  }, [router]);

  const handleCopyResume = async (resumeId: number) => {
    setCopyingResumeId(resumeId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Не авторизовано');
        return;
      }

      const response = await fetch(API_ENDPOINTS.resumes.copy(resumeId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при копировании резюме');
      }

      await fetchResumes();
    } catch (error) {
      setError('Ошибка при копировании резюме');
    } finally {
      setCopyingResumeId(null);
    }
  };

  const handleDeleteClick = (resume: Resume) => {
    setResumeToDelete(resume);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (!resumeToDelete) return;
    
    setDeletingResumeId(resumeToDelete.resume_id);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Не авторизовано');
        return;
      }

      const response = await fetch(API_ENDPOINTS.resumes.delete(resumeToDelete.resume_id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при удалении резюме');
      }

      await fetchResumes();
    } catch (error) {
      setError('Ошибка при удалении резюме');
    } finally {
      setDeletingResumeId(null);
      setDeleteModalOpen(false);
      setResumeToDelete(null);
    }
  };

  const handleMenuClick = (e: React.MouseEvent, resumeId: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Menu clicked for resume:', resumeId);
    setOpenMenuId(openMenuId === resumeId ? null : resumeId);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto pt-12 pb-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Мои резюме</h1>
        <Link href="/resume/add" className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-5 py-2 rounded-lg font-semibold text-base shadow hover:bg-blue-100 transition">
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
        <div className="text-center text-gray-500 py-8">У вас пока нет резюме. Создайте его, чтобы откликнуться на вакансии.</div>
      ) : (
        <div className="divide-y divide-gray-200 space-y-6">
          {resumes.map((resume) => (
            <div className="py-8 px-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow" key={resume.resume_id}>
              <div className="mb-3">
                <Link href={`/resume/${resume.resume_id}`}>
                  <span className="text-xl font-bold text-[#2B81B0] hover:text-[#18608a] transition">{resume.title}</span>
                </Link>
              </div>
              <div className="text-lg text-gray-700 mb-3">
                {resume.salary_expectation ? `от ${resume.salary_expectation.toLocaleString()} руб.` : ''}
              </div>
              <div className="text-gray-500 text-sm mb-4">
                {/* Здесь можно добавить дату обновления, если появится в API */}
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Можно добавить теги или статусы */}
              </div>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Link href={`/resume/${resume.resume_id}/edit`} className="text-blue-600 hover:underline font-medium">Редактировать</Link>
                <span className="text-gray-400">•</span>
                <button 
                  onClick={() => handleCopyResume(resume.resume_id)}
                  disabled={copyingResumeId === resume.resume_id}
                  className="text-blue-600 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copyingResumeId === resume.resume_id ? 'Копирование...' : 'Копировать'}
                </button>
                <span className="text-gray-400">•</span>
                <div className="relative inline-block">
                  <button 
                    type="button"
                    onClick={() => setOpenMenuId(openMenuId === resume.resume_id ? null : resume.resume_id)}
                    className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                  >
                    Ещё <span className="align-middle">▼</span>
                  </button>
                  {openMenuId === resume.resume_id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(resume)}
                        disabled={deletingResumeId === resume.resume_id}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingResumeId === resume.resume_id ? 'Удаление...' : 'Удалить'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-row gap-12 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl text-blue-700 font-bold">0</div>
                  <div className="text-gray-500 text-sm">Приглашений</div>
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

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && resumeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Подтверждение удаления</h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить резюме "{resumeToDelete.title}"?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setResumeToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                disabled={deletingResumeId === resumeToDelete.resume_id}
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingResumeId === resumeToDelete.resume_id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingResumeId === resumeToDelete.resume_id ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 