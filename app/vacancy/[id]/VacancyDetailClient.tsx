/**
 * @file: VacancyDetailClient.tsx
 * @description: Клиентский компонент для детальной страницы вакансии с модальным окном отклика
 * @dependencies: app/components/ApplicationModal, app/components/useUser
 * @created: 2025-12-03
 */
'use client'
import React, { useState } from 'react'
import { useUser } from '@/app/components/useUser'
import ApplicationModal from '@/app/components/ApplicationModal'

interface VacancyDetailClientProps {
  jobId: number
  jobTitle: string
  isPromo: boolean
  promoRedirectPath: string | null
  noResumeApply?: boolean
}

export default function VacancyDetailClient({ 
  jobId, 
  jobTitle, 
  isPromo, 
  promoRedirectPath,
  noResumeApply = false
}: VacancyDetailClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { role } = useUser()

  const handleApplyClick = () => {
    if (role === 'job_seeker') {
      setIsModalOpen(true)
    } else if (role === 'guest') {
      // Перенаправляем на страницу входа
      window.location.href = '/login?redirect=' + encodeURIComponent(`/vacancy/${jobId}`)
    }
  }

  if (isPromo && promoRedirectPath) {
    return (
      <a
        href={promoRedirectPath}
        target="_blank"
        rel="noreferrer noopener"
        className="bg-[#2B81B0] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#18608a] transition"
      >
        Откликнуться
      </a>
    )
  }

  return (
    <>
      <button 
        type="button" 
        onClick={handleApplyClick}
        className="bg-[#2B81B0] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#18608a] transition"
      >
        Откликнуться
      </button>
      
      {role === 'job_seeker' && (
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          jobId={jobId}
          jobTitle={jobTitle}
          noResumeApply={noResumeApply}
        />
      )}
    </>
  )
}
