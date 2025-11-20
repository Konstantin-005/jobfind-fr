'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { API_ENDPOINTS } from '../config/api'

interface JobFiltersProps {
  onFilterChange?: (filters: any) => void
}

interface Location {
  id: number
  name: string
  type: 'city' | 'reg'
}

interface SelectedLocation {
  id: number
  name: string
  type: 'city' | 'reg'
}

interface ProfessionGroup {
  group_id: number
  name: string
  professions: {
    profession_id: number
    name: string
  }[]
}

interface Industry {
  industry_id: number
  name: string
}

interface DropdownProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

const Dropdown: React.FC<DropdownProps> = ({ isOpen, onClose, children }) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (!isOpen) return null

  return (
    <div ref={dropdownRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto" style={{overflowX: 'hidden'}}>
      {children}
    </div>
  )
}

export default function JobFilters({ onFilterChange }: JobFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [salaryFrom, setSalaryFrom] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [locationResults, setLocationResults] = useState<Location[]>([])
  const [showLocationResults, setShowLocationResults] = useState(false)
  const [selectedLocations, setSelectedLocations] = useState<SelectedLocation[]>([])
  const locationSearchTimeout = useRef<NodeJS.Timeout>()
  const locationSearchRef = useRef<HTMLDivElement>(null)
  const isInitialMount = useRef(true)

  // Profession filter
  const [professionGroups, setProfessionGroups] = useState<ProfessionGroup[]>([])
  const [showProfessions, setShowProfessions] = useState(false)
  const [selectedProfessions, setSelectedProfessions] = useState<number[]>([])
  const [tempSelectedProfessions, setTempSelectedProfessions] = useState<number[]>([])
  const [openGroups, setOpenGroups] = useState<{ [id: number]: boolean }>({})

  // Industry filter
  const [industries, setIndustries] = useState<Industry[]>([])
  const [showIndustries, setShowIndustries] = useState(false)
  const [selectedIndustries, setSelectedIndustries] = useState<number[]>([])
  const [tempSelectedIndustries, setTempSelectedIndustries] = useState<number[]>([])

  // Education filter
  const [selectedEducation, setSelectedEducation] = useState<string[]>([])
  const educationOptions = [
    { value: 'not_required', label: 'Не требуется/не указано' },
    { value: 'school', label: 'Среднее' },
    { value: 'specialist', label: 'Среднее профессиональное' },
    { value: 'higher_edu', label: 'Высшее' }
  ]

  // Experience filter
  const [selectedExperience, setSelectedExperience] = useState<string[]>([])
  const experienceOptions = [
    { value: '0', label: 'Без опыта' },
    { value: '0_1', label: 'До 1 года' },
    { value: '1_3', label: 'От 1 до 3 лет' },
    { value: '3_5', label: 'От 3 до 5 лет' },
    { value: 'more_5', label: 'Более 5 лет' }
  ]

  // Employment type filter
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([])
  const employmentTypeOptions = [
    { value: 'full', label: 'Полный день' },
    { value: 'not_full', label: 'Неполный день' },
    { value: 'agile', label: 'Гибкий рабочий день' },
    { value: 'not_norm', label: 'Ненормированный рабочий день' },
    { value: 'shift', label: 'Сменный' },
    { value: 'vahta', label: 'Вахта' },
    { value: 'project', label: 'Проектный' },
    { value: 'intern', label: 'Стажировка' }
  ]

  // --- Новые состояния для поиска ---
  const [professionSearch, setProfessionSearch] = useState('')
  const [industrySearch, setIndustrySearch] = useState('')
  const [showEmploymentTypes, setShowEmploymentTypes] = useState(false)
  const [tempSelectedEmploymentTypes, setTempSelectedEmploymentTypes] = useState<string[]>([])

  // --- Фильтрация профессий по поиску ---
  const filteredProfessionGroups = professionGroups.map(group => ({
    ...group,
    professions: group.professions?.filter(p =>
      p.name.toLowerCase().includes(professionSearch.toLowerCase())
    ) || []
  })).filter(group => group.professions.length > 0)

  // --- Фильтрация отраслей по поиску ---
  const filteredIndustries = industries.filter(i =>
    i.name.toLowerCase().includes(industrySearch.toLowerCase())
  )

  // --- Новое состояние для модального окна выбора локаций ---
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [tempSelectedLocations, setTempSelectedLocations] = useState<SelectedLocation[]>([])
  const [tempLocationSearch, setTempLocationSearch] = useState('')
  const [tempLocationResults, setTempLocationResults] = useState<Location[]>([])

  // --- Поиск по локациям в модальном окне ---
  useEffect(() => {
    if (!showLocationModal) return
    if (tempLocationSearch.trim().length === 0) {
      setTempLocationResults([])
      return
    }
    setTempLocationResults([])
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.locations}?query=${encodeURIComponent(tempLocationSearch)}`)
        if (response.ok) {
          const data = await response.json()
          setTempLocationResults(data)
        } else {
          setTempLocationResults([])
        }
      } catch {
        setTempLocationResults([])
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [tempLocationSearch, showLocationModal])

  // --- Открытие модального окна ---
  const openLocationModal = () => {
    setTempSelectedLocations(selectedLocations)
    setTempLocationSearch('')
    setTempLocationResults([])
    setShowLocationModal(true)
  }

  // --- Закрытие модального окна ---
  const closeLocationModal = () => {
    setShowLocationModal(false)
  }

  // --- Добавление/удаление локации во временный список ---
  const handleTempLocationToggle = (location: Location) => {
    if (tempSelectedLocations.some(l => l.id === location.id)) {
      setTempSelectedLocations(prev => prev.filter(l => l.id !== location.id))
    } else {
      setTempSelectedLocations(prev => [...prev, location])
    }
  }
  const handleTempLocationRemove = (location: SelectedLocation) => {
    setTempSelectedLocations(prev => prev.filter(l => l.id !== location.id))
  }

  // --- Применить выбранные локации ---
  const handleLocationApply = () => {
    setSelectedLocations(tempSelectedLocations)
    setShowLocationModal(false)
    const cityIds = tempSelectedLocations.filter(l => l.type === 'city').map(l => l.id)
    const regionIds = tempSelectedLocations.filter(l => l.type === 'reg').map(l => l.id)
    const filterData: any = {
      locations: tempSelectedLocations.map(l => ({ id: l.id, type: l.type })),
      city_id: cityIds.length > 0 ? cityIds : undefined,
      region_id: regionIds.length > 0 ? regionIds : undefined
    }
    const urlFilterData: any = { ...filterData }
    if (cityIds.length > 0) urlFilterData.city_id = cityIds.join(',')
    if (regionIds.length > 0) urlFilterData.region_id = regionIds.join(',')
    updateURL(urlFilterData)
    onFilterChange?.(filterData)
  }

  // --- Отменить выбор ---
  const handleLocationCancel = () => {
    setShowLocationModal(false)
  }

  // Initialize filters from URL
  useEffect(() => {
    const initializeFilters = async () => {
      // Initialize salary
      const salary = searchParams.get('salary')
      if (salary) {
        setSalaryFrom(salary)
      }

      // Initialize locations
      const cityIds = searchParams.get('city_id')
      const regionIds = searchParams.get('region_id')
      let locations: SelectedLocation[] = []
      if (cityIds) {
        const ids = cityIds.split(',').map(Number)
        try {
          const response = await fetch(API_ENDPOINTS.dictionaries.citiesByIds, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city_ids: ids })
          })
          const data = await response.json()
          const cityLocations = data.map((city: any) => ({
            id: city.city_id,
            name: city.name,
            type: 'city' as const
          }))
          locations = locations.concat(cityLocations)
        } catch (error) {
          console.error('Failed to fetch city details:', error)
        }
      }
      if (regionIds) {
        const ids = regionIds.split(',').map(Number)
        try {
          const response = await fetch(API_ENDPOINTS.dictionaries.regionsByIds, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region_ids: ids })
          })
          const data = await response.json()
          const regionLocations = data.map((region: any) => ({
            id: region.region_id,
            name: region.name,
            type: 'reg' as const
          }))
          locations = locations.concat(regionLocations)
        } catch (error) {
          console.error('Failed to fetch region details:', error)
        }
      }
      if (locations.length > 0) {
        setSelectedLocations(locations)
      }

      // Initialize professions
      const professionIds = searchParams.get('profession_id')
      if (professionIds) {
        setSelectedProfessions(professionIds.split(',').map(Number))
      }

      // Initialize industries
      const industryIds = searchParams.get('industry_id')
      if (industryIds) {
        setSelectedIndustries(industryIds.split(',').map(Number))
      }

      // Initialize education
      const education = searchParams.get('education')
      if (education) {
        setSelectedEducation(education.split(','))
      }

      // Initialize experience
      const experience = searchParams.get('work_experience')
      if (experience) {
        setSelectedExperience(experience.split(','))
      }

      // Initialize employment types
      const employmentTypes = searchParams.get('employment_type')
      if (employmentTypes) {
        setSelectedEmploymentTypes(employmentTypes.split(','))
      }
    }

    initializeFilters()
  }, [searchParams])

  // Fetch profession groups
  useEffect(() => {
    const fetchProfessions = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.dictionaries.professions)
        if (!response.ok) throw new Error('Failed to fetch professions')
        const data = await response.json()
        // Преобразуем VacancyProfessions -> professions
        const normalized = data.map((group: any) => ({
          ...group,
          professions: group.VacancyProfessions || []
        }))
        setProfessionGroups(normalized)
      } catch (error) {
        console.error('Failed to fetch professions:', error)
      }
    }
    fetchProfessions()
  }, [])

  // Fetch industries
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.dictionaries.industries)
        if (!response.ok) {
          throw new Error('Failed to fetch industries')
        }
        const data = await response.json()
        setIndustries(data)
      } catch (error) {
        console.error('Failed to fetch industries:', error)
      }
    }

    fetchIndustries()
  }, [])

  const updateURL = (filters: any) => {
    const onVacancyList = pathname === '/vacancy'
    const onCitySlug = pathname.startsWith('/vakansii/')
    if (onVacancyList || onCitySlug) {
      // Собираем все фильтры из состояния и searchParams
      const allFilters: any = {
        salaryFrom,
        locations: selectedLocations.map(l => ({ id: l.id, type: l.type })),
        professions: selectedProfessions,
        industries: selectedIndustries,
        education: selectedEducation,
        work_experience: selectedExperience,
        employment_type: selectedEmploymentTypes,
        // сохраняем query из searchParams, если оно есть и не перезаписано явно
        query: typeof filters.query !== 'undefined' ? filters.query : (searchParams.get('query') || undefined),
        ...filters // перезаписываем только то, что явно меняется
      }

      // Формируем объект для url
      const params: Record<string, string> = {}
      if (allFilters.query) params['query'] = allFilters.query
      if (allFilters.salaryFrom) params['salary'] = allFilters.salaryFrom
      if (allFilters.locations && allFilters.locations.length > 0) {
        const cityIds = allFilters.locations.filter((loc: any) => loc.type === 'city').map((loc: any) => loc.id)
        if (cityIds.length > 0) params['city_id'] = cityIds.join(',')
        const regionIds = allFilters.locations.filter((loc: any) => loc.type === 'reg').map((loc: any) => loc.id)
        if (regionIds.length > 0) params['region_id'] = regionIds.join(',')
      }
      if (allFilters.professions && allFilters.professions.length > 0) params['profession_id'] = allFilters.professions.join(',')
      if (allFilters.industries && allFilters.industries.length > 0) params['industry_id'] = allFilters.industries.join(',')
      if (allFilters.education && allFilters.education.length > 0) params['education'] = allFilters.education.join(',')
      if (allFilters.work_experience && allFilters.work_experience.length > 0) params['work_experience'] = allFilters.work_experience.join(',')
      if (allFilters.employment_type && allFilters.employment_type.length > 0) params['employment_type'] = allFilters.employment_type.join(',')

      // Собираем строку вручную, чтобы не кодировать кириллицу и запятые
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')

      // Всегда ведём на общую страницу списка вакансий
      const targetPath = '/vacancy'
      router.replace(`${targetPath}${queryString ? '?' + queryString : ''}`, { scroll: false })
    }
  }

  const handleProfessionGroupSelect = (groupId: number) => {
    const group = professionGroups.find(g => g.group_id === groupId)
    if (!group || !Array.isArray(group.professions)) return

    const groupProfessionIds = group.professions.map(p => p.profession_id)
    const allSelected = groupProfessionIds.every(id => tempSelectedProfessions.includes(id))

    if (allSelected) {
      setTempSelectedProfessions(prev => prev.filter(id => !groupProfessionIds.includes(id)))
    } else {
      setTempSelectedProfessions(prev => [...new Set([...prev, ...groupProfessionIds])])
    }
  }

  const handleProfessionSelect = (professionId: number) => {
    setTempSelectedProfessions(prev => {
      if (prev.includes(professionId)) {
        return prev.filter(id => id !== professionId)
      }
      return [...prev, professionId]
    })
  }

  const handleProfessionApply = () => {
    setSelectedProfessions(tempSelectedProfessions)
    setShowProfessions(false)
    const filterData = { professions: tempSelectedProfessions }
    updateURL(filterData)
    onFilterChange?.(filterData)
  }

  const handleProfessionClear = () => {
    setTempSelectedProfessions([])
    setSelectedProfessions([])
    setShowProfessions(false)
    const filterData = { professions: [] }
    updateURL(filterData)
    onFilterChange?.(filterData)
  }

  const handleIndustrySelect = (industryId: number) => {
    setTempSelectedIndustries(prev => {
      if (prev.includes(industryId)) {
        return prev.filter(id => id !== industryId)
      }
      return [...prev, industryId]
    })
  }

  const handleIndustryApply = () => {
    setSelectedIndustries(tempSelectedIndustries)
    setShowIndustries(false)
    const filterData = { industries: tempSelectedIndustries }
    updateURL(filterData)
    onFilterChange?.(filterData)
  }

  const handleIndustryClear = () => {
    setTempSelectedIndustries([])
    setSelectedIndustries([])
    setShowIndustries(false)
    const filterData = { industries: [] }
    updateURL(filterData)
    onFilterChange?.(filterData)
  }

  const handleEducationChange = (value: string) => {
    setSelectedEducation(prev => {
      const newSelection = prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
      const filterData = { education: newSelection }
      updateURL(filterData)
      onFilterChange?.(filterData)
      return newSelection
    })
  }

  const handleExperienceChange = (value: string) => {
    setSelectedExperience(prev => {
      const newSelection = prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
      const filterData = { work_experience: newSelection }
      updateURL(filterData)
      onFilterChange?.(filterData)
      return newSelection
    })
  }

  const handleEmploymentTypeChange = (value: string) => {
    setSelectedEmploymentTypes(prev => {
      const newSelection = prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
      const filterData = { employment_type: newSelection }
      updateURL(filterData)
      onFilterChange?.(filterData)
      return newSelection
    })
  }

  const getFirstSelectedProfession = () => {
    if (selectedProfessions.length === 0) return 'Любая'
    if (!professionGroups || professionGroups.length === 0) return 'Любая'
    const firstProfession = professionGroups
      .flatMap(g => g.professions)
      .find(p => p.profession_id === selectedProfessions[0])
    return firstProfession?.name || 'Любая'
  }

  const getFirstSelectedIndustry = () => {
    if (selectedIndustries.length === 0) return 'Любая'
    if (!industries || industries.length === 0) return 'Любая'
    const firstIndustry = industries.find(i => i.industry_id === selectedIndustries[0])
    return firstIndustry?.name || 'Любая'
  }

  const handleLocationSelect = (location: Location) => {
    if (!selectedLocations.some(l => l.id === location.id)) {
      const newLocation: SelectedLocation = {
        id: location.id,
        name: location.name,
        type: location.type
      }
      const newLocations = [...selectedLocations, newLocation]
      setSelectedLocations(newLocations)
      setLocationSearch('')
      setShowLocationResults(false)
      
      const filterData = {
        locations: newLocations.map(l => ({
          id: l.id,
          type: l.type
        }))
      }
      
      updateURL(filterData)
      onFilterChange?.(filterData)
    }
  }

  const handleLocationRemove = (location: SelectedLocation) => {
    const newLocations = selectedLocations.filter(l => l.id !== location.id)
    setSelectedLocations(newLocations)
    
    const filterData = {
      locations: newLocations.map(l => ({
        id: l.id,
        type: l.type
      }))
    }
    
    updateURL(filterData)
    onFilterChange?.(filterData)
  }

  const toggleGroup = (groupId: number) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const isGroupChecked = (group: ProfessionGroup) =>
    Array.isArray(group.professions) &&
    group.professions.length > 0 &&
    group.professions.every(p => tempSelectedProfessions.includes(p.profession_id))

  const isGroupIndeterminate = (group: ProfessionGroup) => {
    if (!Array.isArray(group.professions) || group.professions.length === 0) return false
    const checkedCount = group.professions.filter(p => tempSelectedProfessions.includes(p.profession_id)).length
    return checkedCount > 0 && checkedCount < group.professions.length
  }

  // --- Поиск по "Город или Регион" ---
  useEffect(() => {
    if (locationSearch.trim().length === 0) {
      setLocationResults([])
      return
    }
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.locations}?query=${encodeURIComponent(locationSearch)}`)
        if (response.ok) {
          const data = await response.json()
          setLocationResults(data)
        } else {
          setLocationResults([])
        }
      } catch {
        setLocationResults([])
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [locationSearch])

  return (
    <div className="w-80 bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Фильтры</h2>
      
      {/* Salary Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Зарплата от
        </label>
        <input
          type="number"
          value={salaryFrom}
          onChange={(e) => {
            setSalaryFrom(e.target.value)
            const filterData = { salaryFrom: e.target.value }
            updateURL(filterData)
            onFilterChange?.(filterData)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Введите сумму"
        />
      </div>

      {/* Location Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Город или Регион
        </label>
        <div className="mt-2 space-y-2">
          {selectedLocations.map((location) => (
            <div key={location.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="w-5 h-5 accent-[#2B81B0] border-2 border-[#2B81B0] rounded focus:ring-2 focus:ring-[#2B81B0]"
              />
              <span className="font-medium">{location.name}</span>
              <button
                type="button"
                onClick={() => handleLocationRemove(location)}
                className="ml-auto text-black text-2xl leading-none hover:text-red-600"
                aria-label="Удалить"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={openLocationModal}
          className="mt-3 underline text-base text-[#2B81B0] hover:text-[#18608a]"
        >
          Добавить локацию
        </button>
      </div>

      {/* Модальное окно выбора локаций */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg w-96 max-w-full p-6 relative">
            <h3 className="text-lg font-semibold mb-4">Добавить локацию</h3>
            <input
              type="text"
              value={tempLocationSearch}
              onChange={e => setTempLocationSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              placeholder="Поиск по названию"
              autoFocus
            />
            <div className="max-h-40 overflow-y-auto border-b border-gray-200 mb-2">
              {tempLocationSearch && tempLocationResults.length === 0 && (
                <div className="text-gray-500 text-sm py-2 px-2">Нет результатов</div>
              )}
              {tempLocationResults.map(location => (
                <div
                  key={location.id}
                  className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleTempLocationToggle(location)}
                >
                  <input
                    type="checkbox"
                    checked={!!tempSelectedLocations.find(l => l.id === location.id)}
                    readOnly
                    className="w-5 h-5 accent-[#2B81B0] border-2 border-[#2B81B0] rounded"
                  />
                  <span className="font-medium">{location.name}</span>
                  <span className="text-sm text-gray-500">{location.type === 'city' ? 'Город' : 'Регион'}</span>
                </div>
              ))}
            </div>
            {/* Список выбранных локаций */}
            {tempSelectedLocations.length > 0 && (
              <div className="mb-2">
                <div className="font-medium text-sm mb-1">Выбранные:</div>
                <div className="space-y-1">
                  {tempSelectedLocations.map(location => (
                    <div key={location.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="w-5 h-5 accent-[#2B81B0] border-2 border-[#2B81B0] rounded"
                      />
                      <span className="font-medium">{location.name}</span>
                      <button
                        type="button"
                        onClick={() => handleTempLocationRemove(location)}
                        className="ml-auto text-black text-2xl leading-none hover:text-red-600"
                        aria-label="Удалить"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Кнопки управления */}
            <div className="flex justify-between items-center mt-4">
              <button
                type="button"
                onClick={handleLocationCancel}
                className="text-gray-600 hover:text-gray-800 px-4 py-1"
              >
                Отменить
              </button>
              <button
                type="button"
                onClick={handleLocationApply}
                className="bg-[#2B81B0] text-white px-4 py-1 rounded"
              >
                Применить
              </button>
            </div>
            <button
              type="button"
              onClick={closeLocationModal}
              className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-red-600"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Фильтр "Специализация" */}
      <div className="mb-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfessions(!showProfessions)
              setTempSelectedProfessions(selectedProfessions)
            }}
            className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 rounded-md text-gray-500"
          >
            <span>Специализация</span>
            {selectedProfessions.length > 0 && (
              <span className="ml-2 bg-blue-100 text-[#2B81B0] rounded-full px-2 py-0.5 text-xs">
                {selectedProfessions.length}
              </span>
            )}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <Dropdown isOpen={showProfessions} onClose={() => setShowProfessions(false)}>
            <div className="p-4 w-80 whitespace-normal break-words max-h-48 overflow-y-auto" style={{overflowX: 'hidden'}}>
              {professionGroups.length === 0 && (
                <div className="text-gray-500 text-sm py-2">Нет результатов</div>
              )}
              {professionGroups.map(group => (
                <div key={group.group_id}>
                  <div className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded">
                    <span
                      className="mr-2 select-none flex items-center"
                      onClick={e => {
                        e.stopPropagation();
                        toggleGroup(group.group_id);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {openGroups[group.group_id] ? (
                        <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={isGroupChecked(group)}
                      ref={el => {
                        if (el) el.indeterminate = isGroupIndeterminate(group)
                      }}
                      onChange={e => {
                        handleProfessionGroupSelect(group.group_id)
                      }}
                      onClick={e => e.stopPropagation()}
                      className="mr-2 w-5 h-5 accent-[#2B81B0] border-2 border-[#2B81B0] rounded focus:ring-2 focus:ring-[#2B81B0]"
                    />
                    <span
                      className="font-medium select-none"
                      onClick={e => {
                        e.stopPropagation();
                        toggleGroup(group.group_id);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {group.name}
                    </span>
                  </div>
                  {openGroups[group.group_id] && (
                    <div className="ml-4 space-y-1">
                      {Array.isArray(group.professions) && group.professions.length > 0 ? (
                        group.professions.map(profession => (
                          <label key={profession.profession_id} className="flex items-center py-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tempSelectedProfessions.includes(profession.profession_id)}
                              onChange={() => handleProfessionSelect(profession.profession_id)}
                              className="mr-2 w-5 h-5 accent-[#2B81B0] border-2 border-[#2B81B0] rounded focus:ring-2 focus:ring-[#2B81B0]"
                            />
                            <span className="flex-1">{profession.name}</span>
                          </label>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm py-2">Нет доступных профессий</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 left-0 right-0 bg-white pt-2 pb-2 px-4 flex justify-between border-t border-gray-200">
              <button type="button" onClick={handleProfessionClear} className="text-gray-600 hover:text-gray-800">Отменить</button>
              <button type="button" onClick={handleProfessionApply} className="bg-[#2B81B0] text-white px-4 py-1 rounded">Применить</button>
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Фильтр "Отрасль компании" */}
      <div className="mb-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowIndustries(!showIndustries)
              setTempSelectedIndustries(selectedIndustries)
            }}
            className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 rounded-md text-gray-500"
          >
            <span>Отрасль компании</span>
            {selectedIndustries.length > 0 && (
              <span className="ml-2 bg-blue-100 text-[#2B81B0] rounded-full px-2 py-0.5 text-xs">
                {selectedIndustries.length}
              </span>
            )}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <Dropdown isOpen={showIndustries} onClose={() => setShowIndustries(false)}>
            <div className="p-4 w-80 whitespace-normal break-words max-h-48 overflow-y-auto" style={{overflowX: 'hidden'}}>
              {filteredIndustries.length === 0 && (
                <div className="text-gray-500 text-sm py-2">Нет результатов</div>
              )}
              {filteredIndustries.map(industry => (
                <label key={industry.industry_id} className="flex items-center py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempSelectedIndustries.includes(industry.industry_id)}
                    onChange={() => handleIndustrySelect(industry.industry_id)}
                    className="mr-2 w-5 h-5 accent-[#2B81B0] border-2 border-[#2B81B0] rounded focus:ring-2 focus:ring-[#2B81B0]"
                  />
                  <span className="flex-1">{industry.name}</span>
                </label>
              ))}
            </div>
            <div className="sticky bottom-0 left-0 right-0 bg-white pt-2 pb-2 px-4 flex justify-between border-t border-gray-200">
              <button type="button" onClick={handleIndustryClear} className="text-gray-600 hover:text-gray-800">Отменить</button>
              <button type="button" onClick={handleIndustryApply} className="bg-[#2B81B0] text-white px-4 py-1 rounded">Применить</button>
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Фильтр "Вид занятости" */}
      <div className="mb-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowEmploymentTypes(!showEmploymentTypes)
              setTempSelectedEmploymentTypes(selectedEmploymentTypes)
            }}
            className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 rounded-md text-gray-500"
          >
            <span>Вид занятости</span>
            {selectedEmploymentTypes.length > 0 && (
              <span className="ml-2 bg-blue-100 text-[#2B81B0] rounded-full px-2 py-0.5 text-xs">
                {selectedEmploymentTypes.length}
              </span>
            )}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <Dropdown isOpen={showEmploymentTypes} onClose={() => setShowEmploymentTypes(false)}>
            <div className="p-4 w-80 whitespace-normal break-words max-h-48 overflow-y-auto" style={{overflowX: 'hidden'}}>
              {employmentTypeOptions.map(option => (
                <label key={option.value} className="flex items-center py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempSelectedEmploymentTypes.includes(option.value)}
                    onChange={() => {
                      setTempSelectedEmploymentTypes(prev =>
                        prev.includes(option.value)
                          ? prev.filter(v => v !== option.value)
                          : [...prev, option.value]
                      )
                    }}
                    className="mr-2 w-5 h-5 accent-[#2B81B0] border-2 border-[#2B81B0] rounded focus:ring-2 focus:ring-[#2B81B0]"
                  />
                  <span className="flex-1">{option.label}</span>
                </label>
              ))}
            </div>
            <div className="sticky bottom-0 left-0 right-0 bg-white pt-2 pb-2 px-4 flex justify-between border-t border-gray-200">
              <button type="button" onClick={() => { setTempSelectedEmploymentTypes(selectedEmploymentTypes); setShowEmploymentTypes(false); }} className="text-gray-600 hover:text-gray-800">Отменить</button>
              <button type="button" onClick={() => { setSelectedEmploymentTypes(tempSelectedEmploymentTypes); setShowEmploymentTypes(false); const filterData = { employment_type: tempSelectedEmploymentTypes }; updateURL(filterData); onFilterChange?.(filterData); }} className="bg-[#2B81B0] text-white px-4 py-1 rounded">Применить</button>
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Education Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Образование
        </label>
        <div className="space-y-2">
          {educationOptions.map(option => (
            <label
              key={option.value}
              className="flex items-center cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={selectedEducation.includes(option.value)}
                onChange={() => handleEducationChange(option.value)}
                className="w-5 h-5 accent-[#2B81B0] border-2 border-[#2B81B0] rounded mr-2 focus:ring-2 focus:ring-[#2B81B0]"
              />
              <span className={selectedEducation.includes(option.value) ? 'text-[#2B81B0] font-medium' : ''}>
                {option.label === 'Не требуется/не указано' ? 'Не требуется или не указано' : option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Опыт работы
        </label>
        <div className="space-y-2">
          {experienceOptions.map(option => (
            <label
              key={option.value}
              className="flex items-center cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={selectedExperience.includes(option.value)}
                onChange={() => handleExperienceChange(option.value)}
                className="w-5 h-5 accent-[#2B81B0] border-2 border-[#2B81B0] rounded mr-2 focus:ring-2 focus:ring-[#2B81B0]"
              />
              <span className={selectedExperience.includes(option.value) ? 'text-[#2B81B0] font-medium' : ''}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
} 