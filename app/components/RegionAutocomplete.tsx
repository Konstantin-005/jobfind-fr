/**
 * @file: app/components/RegionAutocomplete.tsx
 * @description: Мультивыбор регионов с автодополнением по /api/locations?query=
 * @dependencies: app/config/api.ts (API_ENDPOINTS.locations)
 * @created: 2025-10-27
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';

type Region = { id: number; name: string; type?: string };

type RegionAutocompleteProps = {
  values: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  initialRegions?: Region[];
};

export default function RegionAutocomplete({ values, onChange, placeholder = 'Введите регион', initialRegions = [] }: RegionAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Region[]>([]);
  const [selected, setSelected] = useState<Region[]>(initialRegions);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Закрытие выпадающего списка при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Синхронизация выбранных ids из вне (на случай ресета формы)
  useEffect(() => {
    if (values.length === 0) {
      setSelected([]);
    }
  }, [values]);

  // Поиск с debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.locations}?query=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        const regions = Array.isArray(data)
          ? data
              .filter((item: any) => (item?.type ?? '').toLowerCase() === 'region' || item?.region_id)
              .map((item: any) => ({ id: item.id ?? item.region_id, name: item.name as string, type: item.type }))
          : [];
        setSuggestions(regions);
      } catch (e) {
        console.error('Failed to fetch regions', e);
        setSuggestions([]);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function addRegion(region: Region) {
    if (values.includes(region.id)) return;
    const nextIds = [...values, region.id];
    onChange(nextIds);
    setSelected((prev) => [...prev, region]);
    setQuery('');
    setSuggestions([]);
    setShow(false);
  }

  function removeRegion(id: number) {
    const nextIds = values.filter((v) => v !== id);
    onChange(nextIds);
    setSelected((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map((r) => (
          <span key={r.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {r.name}
            <button type="button" className="ml-1 text-blue-700 hover:text-blue-900" onClick={() => removeRegion(r.id)}>✕</button>
          </span>
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {show && (query.length >= 2 || loading) && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-2 text-gray-500">Загрузка...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((r) => (
              <div key={r.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => addRegion(r)}>
                {r.name}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">Ничего не найдено</div>
          )}
        </div>
      )}
    </div>
  );
}


