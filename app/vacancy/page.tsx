'use client'
import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import JobFilters from '../components/JobFilters'

interface JobPosting {
  id: number
  title: string
  company: string
  salary_min: number
  salary_max: number
  experience_level: string
  employment_type: string
  work_format: string
  work_schedule: string
  publication_city_id: number
}

export default function Vacancy() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const query = searchParams.get('query')
        
        // Cancel any ongoing request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        
        // Create new AbortController for this request
        abortControllerRef.current = new AbortController()
        
        // Construct the API URL with query parameters
        const params = new URLSearchParams()
        if (query) {
          params.append('query', query)
        }

        // Add filter parameters
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v))
          } else if (value) {
            params.append(key, value.toString())
          }
        })
        
        const response = await fetch(`/api/jobs?${params.toString()}`, {
          signal: abortControllerRef.current.signal
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch jobs')
        }
        
        const data = await response.json()
        setJobs(data)
        setError(null)
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [searchParams, filters])

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        <JobFilters onFilterChange={handleFilterChange} />
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-8">Результаты поиска вакансий</h1>
          
          {jobs.length === 0 ? (
            <div className="text-center text-gray-500">
              По вашему запросу вакансий не найдено
            </div>
          ) : (
            <div className="grid gap-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
                  <p className="text-gray-600 mb-2">{job.company}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {job.experience_level}
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {job.employment_type}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      {job.work_format}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-gray-800">
                    {job.salary_min} - {job.salary_max} ₽
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 