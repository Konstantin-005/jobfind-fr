/**
 * @file: VacancySlugClient.tsx
 * @description: Клиентский компонент для кнопки отклика на странице вакансий по городу
 * @dependencies: app/components/ApplicationModal, app/components/useUser
 * @created: 2025-12-03
 */
'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/app/components/useUser'
import ApplicationModal from '@/app/components/ApplicationModal'

interface VacancySlugClientProps {
  jobId: number
  jobTitle: string
  isPromo: boolean
  noResumeApply?: boolean
}

export default function VacancySlugClient({ jobId, jobTitle, isPromo, noResumeApply = false }: VacancySlugClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { role } = useUser()

  const handleApplyClick = () => {
    if (role === 'job_seeker') {
      setIsModalOpen(true)
    } else if (role === 'guest') {
      window.location.href = '/login?redirect=' + encodeURIComponent(`/vacancy/${jobId}`)
    }
  }

  if (isPromo) {
    return (
      <Link
        href={`/vacancy/${jobId}/to`}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex justify-center bg-[#2B81B0] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#18608a] transition w-auto"
      >
        Откликнуться
      </Link>
    )
  }

  return (
    <>
      <button 
        type="button" 
        onClick={handleApplyClick}
        className="inline-flex justify-center bg-[#2B81B0] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#18608a] transition w-auto"
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
