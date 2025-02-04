import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Activity, MapPin, ChevronDown, Navigation, RefreshCw } from 'lucide-react'
import type { EarthquakeData } from '../types'
import { JMA_LANGUAGE_MAPPING } from '../constants'

const getSupportedLanguage = (language: string): string => {
  return language in JMA_LANGUAGE_MAPPING ? language : 'en'
}

const isLanguageSupported = (language: string): boolean => {
  return language in JMA_LANGUAGE_MAPPING
}

interface UseEarthquakeDataReturn {
  data: EarthquakeData | null
  loading: boolean
  error: string | null
  forceRefresh: () => void
}

function useEarthquakeData(language: string): UseEarthquakeDataReturn {
  const [data, setData] = useState<EarthquakeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forceCounter, setForceCounter] = useState(0)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const supportedLanguage = getSupportedLanguage(language)
        const url = new URL(`https://apishop.mohil.dev/earthquakes/${supportedLanguage}`)
        if (forceCounter > 0) {
          url.searchParams.set('force', 'true')
        }
        const response = await fetch(url.toString())
        if (!response.ok) {
          throw new Error('Failed to fetch earthquake data')
        }
        const result: EarthquakeData = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [language, forceCounter])

  const forceRefresh = useCallback(() => {
    setForceCounter(prev => prev + 1)
  }, [])

  return { data, loading, error, forceRefresh }
}

interface EarthquakeInfoProps {
  isDarkMode: boolean
  selectedLanguage: string
}

export const EarthquakeInfo: React.FC<EarthquakeInfoProps> = ({ isDarkMode, selectedLanguage }) => {
  const { data: earthquakeData, loading, error, forceRefresh } = useEarthquakeData(selectedLanguage)
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set())

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const supportedLanguage = getSupportedLanguage(selectedLanguage)
    return date.toLocaleString(supportedLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [selectedLanguage])

  const toggleExpanded = useCallback((index: number) => {
    setExpandedIndices(prev => {
      const newExpanded = new Set(prev)
      newExpanded.has(index) ? newExpanded.delete(index) : newExpanded.add(index)
      return newExpanded
    })
  }, [])

  const allQuakes = [
    ...(earthquakeData?.data.detailed.map(q => ({ ...q, type: 'detailed' as const })) || []),
    ...(earthquakeData?.data.basic.map(q => ({ ...q, type: 'basic' as const })) || []),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return (
    <div className="space-y-4">
      <div className="space-y-1 mb-6">
        {!isLanguageSupported(selectedLanguage) && (
          <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={16} />
              <p className="text-sm text-red-600 dark:text-red-400">
                Earthquake information is only available in English, Chinese, Korean, Portuguese, Spanish, Vietnamese, Thai, and Indonesian. Showing in English.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className={isDarkMode ? 'text-white/80' : 'text-black/80'}>SYSTEM</span>
          <div className="flex items-center gap-2">
            <span className="opacity-60">
              {loading ? 'FETCHING' : earthquakeData ? 'REFRESH' : 'IDLE'}
            </span>
            <button
              type="button"
              onClick={forceRefresh}
              disabled={loading}
              aria-label="Force refresh earthquake data"
              className={`p-1.5 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className={`text-sm opacity-60 border-l-2 pl-4 py-1 ${
          isDarkMode ? 'border-white/20' : 'border-black/20'
        }`}>
          {error || `Last updated: ${
            earthquakeData?.last_updated ? formatDate(earthquakeData.last_updated) : 'N/A'
          }`}
        </div>
      </div>

      {loading ? (
        <div className={`text-center animate-pulse ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
          FETCHING EARTHQUAKE DATA...
        </div>
      ) : error ? (
        <div className={`text-center ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {allQuakes.map((quake, index) => {
            const isExpanded = expandedIndices.has(index)
            const isDetailed = quake.type === 'detailed'

            return (
              <div
                key={`${quake.time}-${quake.location.code}`}
                className={`rounded border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(index)}
                  className="w-full text-left focus:outline-none p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 flex items-center justify-center rounded ${
                        isDarkMode ? 'bg-white/10' : 'bg-black/10'
                      }`}>
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold">EARTHQUAKE</div>
                        <div className="opacity-60 text-sm">{formatDate(quake.time)}</div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
                    <div className="flex items-center gap-2 min-w-fit">
                      <Activity className="w-4 h-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">M: {quake.magnitude}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{quake.location.code}</span>
                    </div>
                  </div>

                  {quake.comments.hasTsunamiWarning && (
                    <div className="text-red-500 font-bold mt-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      Tsunami Warning Issued
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 py-3 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {isDetailed && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span>Max Intensity: {quake.maxInt}</span>
                        </div>
                      )}
                      <div title={quake.location.coordinate} className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 flex-shrink-0" />
                        <span>{quake.location.coordinate}</span>
                      </div>
                    </div>

                    {isDetailed && (
                      <div className="mt-2">
                        <h4 className="font-bold mb-2">Affected Areas:</h4>
                        <div className="space-y-4" role="tree">
                          {quake.regions.map(region => (
                            <div key={region.prefecture} className="space-y-2" role="treeitem">
                              <div className="font-bold text-base flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  isDarkMode ? 'bg-white/60' : 'bg-black/60'
                                }`} />
                                {region.prefecture}
                              </div>
                              <div className="space-y-1">
                                {region.areas.map((area) => (
                                  <div key={area.area_code} role="treeitem">
                                    <div className={`pl-4 border-l text-sm font-medium ${
                                      isDarkMode ? 'border-white/20' : 'border-black/20'
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        <div className={`w-3 h-px ${
                                          isDarkMode ? 'bg-white/20' : 'bg-black/20'
                                        }`} />
                                        {area.area_code}
                                      </div>
                                      {area.cities.length > 0 && (
                                        <div className="ml-4 space-y-0.5 mt-1">
                                          {area.cities.map(city => (
                                            <div
                                              key={city.city_code}
                                              className={`pl-4 border-l text-sm opacity-70 ${
                                                isDarkMode ? 'border-white/10' : 'border-black/10'
                                              }`}
                                              role="treeitem"
                                            >
                                              <div className="flex items-center gap-2">
                                                <div className={`w-2 h-px ${
                                                  isDarkMode ? 'bg-white/10' : 'bg-black/10'
                                                }`} />
                                                {city.city_code}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default EarthquakeInfo