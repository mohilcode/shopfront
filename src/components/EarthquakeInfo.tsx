import type React from 'react'
import { useState, useEffect } from 'react'
import { AlertTriangle, Activity, MapPin, ChevronDown } from 'lucide-react'
import type { EarthquakeData } from '../types'

interface EarthquakeInfoProps {
  isDarkMode: boolean
  selectedLanguage: string
}

export const EarthquakeInfo: React.FC<EarthquakeInfoProps> = ({ isDarkMode, selectedLanguage }) => {
  const [earthquakeData, setEarthquakeData] = useState<EarthquakeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchEarthquakes = async () => {
      setLoading(true)
      try {
        const response = await fetch(`https://apishop.mohil.dev/earthquakes/${selectedLanguage}`)
        if (!response.ok) {
          throw new Error('Failed to fetch earthquake data')
        }
        const data: EarthquakeData = await response.json()
        setEarthquakeData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchEarthquakes()
  }, [selectedLanguage])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(selectedLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedIndices)
    newExpanded.has(index) ? newExpanded.delete(index) : newExpanded.add(index)
    setExpandedIndices(newExpanded)
  }

  const allQuakes = [
    ...(earthquakeData?.data.detailed.map(q => ({ ...q, type: 'detailed' as const })) || []),
    ...(earthquakeData?.data.basic.map(q => ({ ...q, type: 'basic' as const })) || []),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return (
    <div className="space-y-4">
      <div className="space-y-1 mb-6">
        <div className="flex items-center justify-between">
          <span className={isDarkMode ? 'text-white/80' : 'text-black/80'}>SYSTEM</span>
          <span className="opacity-60">
            {loading ? 'FETCHING' : earthquakeData ? 'READY' : 'IDLE'}
          </span>
        </div>
        <div
          className={`text-sm opacity-60 border-l-2 pl-4 py-1 ${
            isDarkMode ? 'border-white/20' : 'border-black/20'
          }`}
        >
          {error ||
            `Last updated: ${
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
                className={`p-4 rounded border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(index)}
                  className="w-full text-left focus:outline-none"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 flex items-center justify-center ${
                          isDarkMode ? 'bg-white/10' : 'bg-black/10'
                        }`}
                      >
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
                </button>

                <div className="flex flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                    <Activity className="w-4 h-4" />
                    <span>Magnitude: {quake.magnitude}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                    <MapPin className="w-4 h-4" />
                    {/* Use the translated value in the `code` field */}
                    <span>Location: {quake.location.code}</span>
                  </div>
                  {isDetailed && (
                    <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Max Intensity: {quake.maxInt}</span>
                    </div>
                  )}
                </div>

                {quake.comments.hasTsunamiWarning && (
                  <div className="text-red-500 font-bold mt-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Tsunami Warning Issued
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">Location Code:</span>
                        {/* Display the translated location (available in the code field) */}
                        <span>{quake.location.code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">Coordinates:</span>
                        <span>{quake.location.coordinate}</span>
                      </div>
                    </div>

                    {isDetailed && (
                      <div className="mt-2">
                        <h4 className="font-bold mb-1">Affected Areas:</h4>
                        <ul className="list-disc list-inside text-sm">
                          {quake.regions.map(region => (
                            <li key={region.prefecture}>
                              {region.prefecture}
                              <ul className="list-[circle] list-inside ml-4">
                                {region.areas.map(area => (
                                  <li key={area.area_code}>
                                    {area.area_code}
                                    {area.cities.length > 0 && (
                                      <span className="opacity-60">
                                        (
                                        {area.cities
                                          .map(city => city.city_code)
                                          .join(', ')}
                                        )
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
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
