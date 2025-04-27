import React from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] p-4 bg-cover bg-center" style={{backgroundImage: 'url(/bg.jpg)'}}>
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 drop-shadow-lg">Найдите работу уже завтра</h1>
        <form className="flex flex-col md:flex-row items-center gap-2 w-full">
          <input
            type="text"
            placeholder="Профессия, должность или компания"
            className="flex-1 rounded-md px-4 py-3 text-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-md text-lg shadow-md transition"
          >
            Найти
          </button>
          <button
            type="button"
            className="ml-2 flex items-center justify-center bg-white border border-gray-200 rounded-md p-3 shadow hover:bg-gray-100"
            title="Фильтры"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M9 18h6" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
} 