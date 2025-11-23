/**
 * @file: app/vacancy/[id]/to/page.tsx
 * @description: Промежуточная страница для промо-вакансий с серверным редиректом на внешнюю ссылку
 * @dependencies: app/config/api.ts (API_ENDPOINTS.jobById)
 * @created: 2025-11-22
 */

import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { API_ENDPOINTS } from '../../../config/api'

interface JobPostingLight {
  job_id: number
  link?: string | null
  is_promo?: boolean | null
}

async function fetchJob(id: number): Promise<JobPostingLight> {
  const h = headers()
  const proto = h.get('x-forwarded-proto') || 'http'
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const absUrl = new URL(API_ENDPOINTS.jobById(id), `${proto}://${host}`)

  const res = await fetch(absUrl.toString(), { cache: 'no-store' })
  if (res.status === 404) {
    notFound()
  }
  if (!res.ok) {
    throw new Error('Failed to load job for redirect')
  }
  return res.json()
}

function normalizeLink(link: string) {
  try {
    const url = new URL(link)
    return url.toString()
  } catch {
    const trimmed = link.trim().replace(/^\/+/, '')
    return `https://${trimmed}`
  }
}

export default async function VacancyPromoRedirectPage({ params }: { params: { id: string } }) {
  const idNum = Number(params.id)
  if (!Number.isFinite(idNum)) {
    notFound()
  }

  let job: JobPostingLight | null = null
  try {
    job = await fetchJob(idNum)
  } catch (error) {
    console.error('[VacancyPromoRedirectPage] job fetch failed', error)
    notFound()
  }

  if (!job?.is_promo || !job.link) {
    redirect(`/vacancy/${idNum}`)
  }

  const target = normalizeLink(job.link)
  redirect(target)
}
