/**
 * @file: ApplicationModal.tsx
 * @description: Модальное окно для отправки отклика на вакансию с выбором резюме
 * @dependencies: app/types/auth, app/config/api
 * @created: 2025-12-03
 */
'use client'
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { API_ENDPOINTS } from '../config/api'
import RichTextEditor from './RichTextEditor'

interface Resume {
  resume_id: number
  title: string
  profession_name?: string
  salary_expectation?: number
}

interface ApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: number
  jobTitle: string
  noResumeApply?: boolean
}

export default function ApplicationModal({ isOpen, onClose, jobId, jobTitle, noResumeApply = false }: ApplicationModalProps) {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Всегда загружаем резюме, чтобы проверить их наличие
      fetchResumes()
      setSuccess(false)
      setError(null)
      setCoverLetter('')
      setSelectedResumeId(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  const fetchResumes = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Необходима авторизация')
        return
      }

      const response = await fetch(API_ENDPOINTS.resumes.my, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки резюме')
      }

      const data = await response.json()
      setResumes(data || [])
      
      // Автоматически выбираем первое резюме только если вакансия требует резюме
      if (!noResumeApply && data && data.length > 0) {
        setSelectedResumeId(data[0].resume_id)
      }
    } catch (err) {
      setError('Не удалось загрузить резюме')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Если вакансия требует резюме (no_resume_apply = false) и резюме не выбрано
    if (!noResumeApply && !selectedResumeId) {
      setError('Выберите резюме')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Необходима авторизация')
        return
      }

      // Формируем тело запроса согласно API
      const requestBody: {
        resume_id: number | null
        cover_letter?: string
      } = {
        resume_id: selectedResumeId,
        cover_letter: coverLetter || undefined,
      }

      const response = await fetch(API_ENDPOINTS.applications.apply(jobId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Обрабатываем специфичные ошибки от API
        const errorMessage = errorData.message || 'Ошибка при отправке отклика'
        throw new Error(errorMessage)
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при отправке отклика'
      setError(errorMessage)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !mounted) return null

  const modal = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold">Отклик на вакансию</h2>
            <p className="text-gray-600 text-sm mt-1">{jobTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Закрыть"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Отклик отправлен!</h3>
              <p className="text-gray-600">Работодатель получит ваше резюме</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Если вакансия требует резюме (no_resume_apply = false) и резюме нет */}
              {!noResumeApply && resumes.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800">
                    У вас нет резюме. <a href="/resume/add" className="underline font-semibold">Создайте резюме</a>, чтобы откликаться на вакансии.
                  </p>
                </div>
              ) : (
                <>
                  {/* Показываем выбор резюме если:
                      1. Вакансия требует резюме (!noResumeApply) ИЛИ
                      2. Вакансия не требует резюме (noResumeApply) но у пользователя есть резюме */}
                  {(!noResumeApply || (noResumeApply && resumes.length > 0)) && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Выберите резюме {noResumeApply && <span className="text-gray-400">(необязательно)</span>}
                      </label>
                      <div className="space-y-2">
                        {noResumeApply && (
                          <label
                            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                              selectedResumeId === null
                                ? 'border-[#2B81B0] bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="resume"
                              value=""
                              checked={selectedResumeId === null}
                              onChange={() => setSelectedResumeId(null)}
                              className="mt-1 mr-3"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">Без резюме</div>
                              <div className="text-sm text-gray-600">Отправить отклик без прикрепления резюме</div>
                            </div>
                          </label>
                        )}
                        {resumes.map((resume) => (
                          <label
                            key={resume.resume_id}
                            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                              selectedResumeId === resume.resume_id
                                ? 'border-[#2B81B0] bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="resume"
                              value={resume.resume_id}
                              checked={selectedResumeId === resume.resume_id}
                              onChange={() => setSelectedResumeId(resume.resume_id)}
                              className="mt-1 mr-3"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{resume.title}</div>
                              {resume.profession_name && (
                                <div className="text-sm text-gray-600">{resume.profession_name}</div>
                              )}
                              {resume.salary_expectation && (
                                <div className="text-sm text-gray-600">
                                  {resume.salary_expectation.toLocaleString('ru-RU')} ₽
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Сопроводительное письмо <span className="text-gray-400">(необязательно)</span>
                    </label>
                    <RichTextEditor
                      value={coverLetter}
                      onChange={setCoverLetter}
                      placeholder="Расскажите, почему вы подходите на эту должность..."
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-red-800 font-medium">{error}</p>
                      {error.includes('Уже есть отклик') && (
                        <p className="text-red-700 text-sm mt-1">
                          Вы уже откликались на эту вакансию. Проверьте свои отклики в личном кабинете.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || (!noResumeApply && resumes.length === 0)}
                  className="flex-1 bg-[#2B81B0] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#18608a] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Отправка...' : 'Откликнуться'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
