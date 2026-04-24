/**
 * @file: app/vacancy/[id]/VacancyMap.tsx
 * @description: Клиентский компонент для отображения карты вакансии с использованием pigeon-maps и OSM
 * @dependencies: pigeon-maps
 * @created: 2025-11-10
 */

'use client'

import React, { useState } from 'react'
import { Map, Marker, ZoomControl } from 'pigeon-maps'

interface VacancyMapProps {
  latitude: number
  longitude: number
  address: string
}

export default function VacancyMap({ latitude, longitude, address }: VacancyMapProps) {
  const [isMapVisible, setIsMapVisible] = useState(true)

  if (!latitude || !longitude) return null

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Адрес места работы</h2>
        <button
          onClick={() => setIsMapVisible(!isMapVisible)}
          className="text-[#2B81B0] hover:underline text-sm flex items-center gap-1"
        >
          {isMapVisible ? 'Скрыть карту' : 'Показать карту'}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transition-transform ${isMapVisible ? 'rotate-180' : ''}`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {address && <p className="text-gray-800 mb-4">{address}</p>}

      {isMapVisible && (
        <div className="h-[300px] md:h-[400px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
          <Map
            height={400}
            defaultCenter={[latitude, longitude]}
            defaultZoom={15}
            metaWheelZoom={true}
          >
            <Marker width={50} anchor={[latitude, longitude]} color="#FF4D4D" />
            <ZoomControl />
          </Map>
          <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] text-gray-500 z-10">
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:underline">OpenStreetMap</a> contributors
          </div>
        </div>
      )}
    </div>
  )
}
