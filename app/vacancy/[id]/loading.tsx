/**
 * @file: app/vacancy/[id]/loading.tsx
 * @description: Skeleton-загрузка для страницы детальной вакансии
 * @dependencies: TailwindCSS классы
 * @created: 2025-11-10
 */

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-10 pt-20 animate-pulse">
      <div className="h-4 w-40 bg-gray-200 rounded mb-5" />

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 mb-6 md:mb-8">
        <div className="h-6 md:h-8 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="flex flex-wrap gap-2 mb-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-6 w-24 bg-gray-200 rounded-full" />
          ))}
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-gray-100 mb-6 md:mb-8 flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-gray-100 mb-6 md:mb-8">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
        <div className="flex flex-wrap gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-6 w-28 bg-gray-200 rounded-full" />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-gray-100 mb-12">
        <div className="h-4 bg-gray-200 rounded w-28 mb-4" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <div className="h-9 w-36 bg-gray-200 rounded" />
        <div className="h-9 w-36 bg-gray-200 rounded" />
        <div className="h-9 w-36 bg-gray-200 rounded" />
        <div className="h-9 w-36 bg-gray-200 rounded" />
      </div>
    </div>
  )
}
