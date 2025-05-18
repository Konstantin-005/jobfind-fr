import React, { useState, useEffect, useRef } from 'react';

interface City {
  id: number;
  name: string;
  type: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (cityId: string) => void;
  required?: boolean;
  initialCityName?: string;
}

export default function CityAutocomplete({ value, onChange, required = false, initialCityName = '' }: CityAutocompleteProps) {
  const [query, setQuery] = useState(initialCityName);
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Обновляем query при изменении initialCityName
  useEffect(() => {
    if (initialCityName) {
      setQuery(initialCityName);
    }
  }, [initialCityName]);

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const response = await fetch(`http://localhost:3000/api/locations?query=${encodeURIComponent(query)}`);
          const data = await response.json();
          // Фильтруем только города
          const cities = data.filter((item: City) => item.type === 'city');
          setSuggestions(cities);
        } catch (error) {
          console.error('Error fetching cities:', error);
          setSuggestions([]);
        }
        setLoading(false);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setShowSuggestions(true);
    if (!newValue) {
      onChange('');
      setSelectedCity(null);
    }
  };

  const handleSuggestionClick = (city: City) => {
    setSelectedCity(city);
    setQuery(city.name);
    onChange(city.id.toString());
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        required={required}
        className="w-full border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
        placeholder="Введите название города"
      />
      {showSuggestions && (query.length >= 2 || loading) && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-2 text-gray-500">Загрузка...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((city) => (
              <div
                key={city.id}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                onClick={() => handleSuggestionClick(city)}
              >
                {city.name}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">Город не найден</div>
          )}
        </div>
      )}
    </div>
  );
} 