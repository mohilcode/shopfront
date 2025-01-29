import type { FC } from 'react'
import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

export interface CustomSelectProps {
  options: Array<{ code?: string; id?: string; name: string }>
  value: string
  onChange: (value: string) => void
  label: string
  isDarkMode: boolean
}

export const CustomSelect: FC<CustomSelectProps> = ({ options, value, onChange, label, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label htmlFor={`select-${label}`} className={`block mb-1 text-xs ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
        {label}
      </label>
      <button
        id={`select-${label}`}
        type="button"
        className={`w-full border rounded px-3 py-2 text-left flex items-center justify-between ${
          isDarkMode ? 'bg-black border-white/50' : 'bg-white border-black/50'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {options.find(opt => opt.code === value || opt.id === value)?.name}
        </span>
        <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-white' : 'text-black'}`} />
      </button>
      {isOpen && (
        <div className={`absolute z-10 w-full mt-1 border rounded shadow-lg max-h-60 overflow-y-auto ${
          isDarkMode ? 'bg-black border-white/50' : 'bg-white border-black/50'
        }`}>
          {options.map(option => (
            <button
              type="button"
              key={option.code || option.id}
              className={`w-full px-3 py-2 text-left transition-colors truncate ${
                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
              }`}
              onClick={() => {
                onChange(option.code || option.id || '')
                setIsOpen(false)
              }}
            >
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}