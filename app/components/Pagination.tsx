'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath?: string // Optional override, otherwise uses pathname
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPath = basePath || pathname

  // Плавный скролл к началу страницы при смене текущей страницы пагинации
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (pageNumber === 1) {
        params.delete('page')
    } else {
        params.set('page', pageNumber.toString())
    }
    // Ensure we don't have empty params string logic if desired, but Next.js handles ? cleanly
    const queryString = params.toString()
    return queryString ? `${currentPath}?${queryString}` : currentPath
  }

  if (totalPages <= 1) return null

  // Logic to determine which page numbers to show
  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    let l

    range.push(1)

    if (totalPages <= 1) return range

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i < totalPages && i > 1) {
        range.push(i)
      }
    }
    range.push(totalPages)

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }

  const pages = getPageNumbers()

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      {/* Prev Button */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          &larr;
        </Link>
      ) : (
        <span className="px-3 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed">
          &larr;
        </span>
      )}

      {/* Page Numbers */}
      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`dots-${index}`} className="px-3 py-2 text-gray-500">
              ...
            </span>
          )
        }
        
        const pageNum = Number(page)
        const isActive = pageNum === currentPage

        return (
          <Link
            key={pageNum}
            href={createPageUrl(pageNum)}
            className={`px-3 py-2 rounded-md border ${
              isActive
                ? 'bg-[#2B81B0] text-white border-[#2B81B0]'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {pageNum}
          </Link>
        )
      })}

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          &rarr;
        </Link>
      ) : (
        <span className="px-3 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed">
          &rarr;
        </span>
      )}
    </div>
  )
}
