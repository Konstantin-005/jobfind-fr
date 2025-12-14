'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_ENDPOINTS } from '@/app/config/api';
import { useChat } from '@/app/context/ChatContext';
import { chatApi } from '@/app/utils/api';

interface ApplicationItem {
  application_id: number;
  job_id: number;
  job_title: string;
  company_id: number;
  company_name: string;
  company_logo_url: string | null;
  resume_id: number;
  resume_title: string;
  cover_letter: string;
  applicant_status: string;
  applied_date: string;
  viewed: string | null;
  chat_room_id: number | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  items_count: number;
  total_count: number;
}

interface ApplicationsResponse {
  items: ApplicationItem[];
  meta: PaginationMeta;
}

const COMPANY_LOGO_PREFIX = '/uploads/companyLogo/';

function buildCompanyLogoSrc(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
  if (/^(data|blob):/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `${COMPANY_LOGO_PREFIX}${trimmed}`;
}

const statusLabels: Record<string, string> = {
  all: 'Все',
  submitted: 'Отправлен',
  waiting: 'Просмотрен',
  interview: 'Собеседование',
  invitation: 'Приглашение',
  job_start: 'Выход на работу',
  rejected: 'Отказ',
  deleted: 'Удален',
  archived: 'Архив',
};

const statusColors: Record<string, string> = {
  all: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  submitted: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  waiting: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  interview: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  invitation: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  job_start: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  rejected: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  deleted: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  archived: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
};

export default function MyApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [statusTotal, setStatusTotal] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<ApplicationItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const { openChatWithRoom } = useChat();

  useEffect(() => {
    const status = searchParams.get('status') || 'all';
    setSelectedStatus(status);
  }, [searchParams]);

  const fetchApplicantStatusCounts = async (token: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.applications.myStatusCounts, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatusCounts(data.by_applicant_status || {});
        setStatusTotal(typeof data.total_count === 'number' ? data.total_count : null);
      }
    } catch (e) {
      console.error('Ошибка загрузки статистики откликов:', e);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const userType = typeof window !== 'undefined' ? localStorage.getItem('user_type') : null;
      if (userType !== 'job_seeker') {
        router.push('/');
        return;
      }

      await fetchApplicantStatusCounts(token);

      const params = new URLSearchParams({
        limit: '50',
        page: '1',
      });

      if (selectedStatus && selectedStatus !== 'all') {
        params.append('applicant_status', selectedStatus);
      }

      const response = await fetch(`${API_ENDPOINTS.applications.my}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicant_status: selectedStatus !== 'all' ? selectedStatus : undefined,
          limit: 50,
          page: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки откликов');
      }

      const data: ApplicationsResponse = await response.json();
      setApplications(data.items || []);
      setMeta(data.meta);
    } catch (e) {
      setError('Ошибка загрузки откликов');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus, router]);

  // Сбрасываем выбор при смене фильтра
  useEffect(() => {
    setSelectedIds([]);
  }, [selectedStatus]);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === 'all') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    router.push(`/user/my-applications?${params.toString()}`);
  };

  const handleDeleteClick = (application: ApplicationItem) => {
    setApplicationToDelete(application);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!applicationToDelete) return;

    setDeletingId(applicationToDelete.application_id);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Не авторизовано');
        return;
      }

      const response = await fetch(API_ENDPOINTS.applications.updateStatus(applicationToDelete.application_id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'deleted',
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при удалении отклика');
      }

      await fetchApplications();
    } catch (error) {
      setError('Ошибка при удалении отклика');
      console.error(error);
    } finally {
      setDeletingId(null);
      setDeleteModalOpen(false);
      setApplicationToDelete(null);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map((app) => app.application_id));
    }
  };

  const handleOpenChat = async (application: ApplicationItem) => {
    if (!application) return;

    // Если уже есть room_id в данных отклика — открываем напрямую
    if (application.chat_room_id) {
      openChatWithRoom(application.chat_room_id);
      return;
    }

    try {
      const { data, error } = await chatApi.getRoomByApplicationId(application.application_id);
      if (data?.room_id) {
        openChatWithRoom(data.room_id);
      } else {
        console.error('Не удалось получить комнату чата:', error);
      }
    } catch (e) {
      console.error('Ошибка открытия чата по отклику:', e);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setIsDeletingBulk(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Не авторизовано');
        return;
      }

      const response = await fetch(API_ENDPOINTS.applications.bulkStatus, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_ids: selectedIds,
          status: 'deleted',
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при массовом удалении');
      }

      setSelectedIds([]);
      await fetchApplications();
    } catch (error) {
      setError('Ошибка при массовом удалении');
      console.error(error);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const isBulkActionsAllowed = selectedStatus !== 'deleted' && selectedStatus !== 'archived';

  return (
    <div className="max-w-6xl mx-auto pt-12 pb-8 px-4">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Мои отклики</h1>

        {/* Фильтры по статусам */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(statusLabels).map(([status, label]) => {
            const count = status === 'all' ? statusTotal ?? meta?.total_count : statusCounts[status];
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  isActive
                    ? statusColors[status].replace('hover:', '')
                    : statusColors[status]
                } ${isActive ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
              >
                {label}
                {status !== 'archived' && count !== undefined && count > 0 && (
                  <span className="ml-2 bg-white bg-opacity-50 px-2 py-0.5 rounded-full text-sm">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bulk Actions Panel */}
        {applications.length > 0 && isBulkActionsAllowed && (
          <div className="mb-4 flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={toggleSelectAll}
              className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${
                selectedIds.length === applications.length && applications.length > 0
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-transparent hover:border-gray-400'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>

            <div className="flex-1 text-sm text-gray-600">
              {selectedIds.length > 0 ? (
                <span>Выбрано: <b>{selectedIds.length}</b></span>
              ) : (
                <span>Выбрать все</span>
              )}
            </div>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
                className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {isDeletingBulk ? 'Удаление...' : `Удалить выбранные (${selectedIds.length})`}
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : applications.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {selectedStatus === 'all'
            ? 'У вас пока нет откликов. Откликнитесь на вакансии, чтобы они появились здесь.'
            : `Нет откликов со статусом "${statusLabels[selectedStatus]}".`}
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div
              key={application.application_id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start gap-4">
                {/* Checkbox for selection */}
                {isBulkActionsAllowed && (
                  <div className="pt-1">
                    <button
                      onClick={() => toggleSelection(application.application_id)}
                      className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${
                        selectedIds.includes(application.application_id)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-transparent hover:border-gray-400'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="flex-1 flex justify-between gap-4">
                  <div className="flex-1">
                    {/* Status Badge at the top */}
                    <div className="mb-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[application.applicant_status] || statusColors.submitted
                        }`}
                      >
                        {statusLabels[application.applicant_status] || application.applicant_status}
                      </span>
                    </div>

                    <Link
                      href={`/vacancy/${application.job_id}`}
                      className="text-xl font-bold text-[#2B81B0] hover:text-[#18608a] transition block"
                    >
                      {application.job_title}
                    </Link>
                    <div className="text-gray-600 mt-1">{application.company_name}</div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{formatDate(application.applied_date)}</span>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleOpenChat(application)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition font-medium text-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Перейти в чат
                      </button>

                      {application.applicant_status !== 'deleted' && application.applicant_status !== 'archived' && (
                        <button
                          onClick={() => handleDeleteClick(application)}
                          disabled={deletingId === application.application_id}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                        >
                          {deletingId === application.application_id ? 'Удаление...' : 'Удалить'}
                        </button>
                      )}
                    </div>
                  </div>

                  {application.company_logo_url && (
                    <img
                      src={buildCompanyLogoSrc(application.company_logo_url)}
                      alt={application.company_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && applicationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Подтверждение удаления</h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить отклик на вакансию "{applicationToDelete.job_title}"?
              Отклик будет перемещен в статус "Удалено".
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setApplicationToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                disabled={deletingId === applicationToDelete.application_id}
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === applicationToDelete.application_id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === applicationToDelete.application_id ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
