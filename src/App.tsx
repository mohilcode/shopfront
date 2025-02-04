import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

import { CustomSelect } from './components/CustomSelect'
import { BarcodeScanner } from './components/BarcodeScanner'
import { IngredientsScanner } from './components/IngredientsScanner'
import { EarthquakeInfo } from './components/EarthquakeInfo'
import { languages } from './constants'
import type { Device, ProductInfo } from './types'

const App: FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    return savedTheme ? savedTheme === 'dark' : true
  })
  const [activeTab, setActiveTab] = useState<'barcode' | 'ingredients' | 'earthquake'>('barcode')
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('selectedLanguage') || 'en'
  })
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<Device[]>([])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
      return newTheme
    })
  }

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await Html5Qrcode.getCameras()
        const videoDevices = devices
          .sort((a, b) => {
            const aLabel = a.label.toLowerCase()
            const bLabel = b.label.toLowerCase()
            if (aLabel.includes('back') || aLabel.includes('rear')) {
              return -1
            }
            if (bLabel.includes('back') || bLabel.includes('rear')) {
              return 1
            }
            return 0
          })
          .map(device => ({
            deviceId: device.id,
            label: device.label || `Camera ${device.id.slice(0, 5)}`,
          }))

        setDevices(videoDevices)
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId)
        }
      } catch (err) {
        console.error('Failed to access camera:', err)
      }
    }

    getDevices()
  }, [])

  useEffect(() => {
    localStorage.setItem('selectedLanguage', selectedLanguage)
  }, [selectedLanguage])

  const handleBarcodeScan = async (data: string) => {
    if (!loading) {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `https://apishop.mohil.dev/barcode/${data}/${selectedLanguage}`
        )
        if (!response.ok) {
          throw new Error('Product not found')
        }
        setProductInfo(await response.json())
        setScannedData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div
      className={`min-h-screen font-mono relative overflow-hidden p-4 ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}
    >
      <div
        className={`absolute inset-0 bg-[linear-gradient(to_right,${
          isDarkMode ? '#ffffff08' : '#00000008'
        }_1px,transparent_1px),linear-gradient(to_bottom,${
          isDarkMode ? '#ffffff08' : '#00000008'
        }_1px,transparent_1px)] bg-[size:24px_24px]`}
        style={{
          backgroundImage: `linear-gradient(to right, ${
            isDarkMode ? '#ffffff08' : '#00000008'
          } 1px, transparent 1px), linear-gradient(to bottom, ${
            isDarkMode ? '#ffffff08' : '#00000008'
          } 1px, transparent 1px)`,
        }}
      />
      <div className="max-w-md mx-auto relative">
        <div
          className={`text-center border-b pb-4 mb-6 ${isDarkMode ? 'border-white/20' : 'border-black/20'}`}
        >
          <h1 className="text-3xl font-bold mb-2 font-[Monaco] tracking-wider">SCANOIR</h1>
          <div className="text-sm opacity-60">Scanner v2.0</div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`absolute top-0 right-0 p-2 transition-colors ${
              isDarkMode ? 'border-white/50 hover:bg-white/10' : 'border-black/50 hover:bg-black/10'
            } border`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div
          className={`space-y-4 border-b pb-6 mb-6 ${isDarkMode ? 'border-white/20' : 'border-black/20'}`}
        >
          <CustomSelect
            options={languages}
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            label="LANGUAGE"
            isDarkMode={isDarkMode}
          />
          <CustomSelect
            options={devices.map(d => ({ id: d.deviceId, name: d.label }))}
            value={selectedCamera}
            onChange={setSelectedCamera}
            label="CAMERA"
            isDarkMode={isDarkMode}
          />
        </div>

        <div className="flex justify-center mb-4">
          <button
            type="button"
            className={`px-4 py-2 border ${
              activeTab === 'barcode'
                ? isDarkMode
                  ? 'bg-white text-black'
                  : 'bg-black text-white'
                : isDarkMode
                  ? 'bg-black text-white'
                  : 'bg-white text-black'
            } ${isDarkMode ? 'border-white' : 'border-black'}`}
            onClick={() => setActiveTab('barcode')}
          >
            Barcode
          </button>
          <button
            type="button"
            className={`px-4 py-2 border ${
              activeTab === 'ingredients'
                ? isDarkMode
                  ? 'bg-white text-black'
                  : 'bg-black text-white'
                : isDarkMode
                  ? 'bg-black text-white'
                  : 'bg-white text-black'
            } ${isDarkMode ? 'border-white' : 'border-black'}`}
            onClick={() => setActiveTab('ingredients')}
          >
            Ingredients
          </button>
          <button
            type="button"
            className={`px-4 py-2 border ${
              activeTab === 'earthquake'
                ? isDarkMode
                  ? 'bg-white text-black'
                  : 'bg-black text-white'
                : isDarkMode
                  ? 'bg-black text-white'
                  : 'bg-white text-black'
            } ${isDarkMode ? 'border-white' : 'border-black'}`}
            onClick={() => setActiveTab('earthquake')}
          >
            Earthquake
          </button>
        </div>

        <div className={`border rounded p-4 ${isDarkMode ? 'border-white/20' : 'border-black/20'}`}>
          {activeTab === 'barcode' ? (
            <BarcodeScanner
              onScan={handleBarcodeScan}
              selectedCamera={selectedCamera}
              isDarkMode={isDarkMode}
              loading={loading}
              error={error}
              productInfo={productInfo}
              scannedData={scannedData}
            />
          ) : activeTab === 'ingredients' ? (
            <IngredientsScanner
              selectedCamera={selectedCamera}
              isDarkMode={isDarkMode}
              selectedLanguage={selectedLanguage}
            />
          ) : activeTab === 'earthquake' ? (
            <EarthquakeInfo isDarkMode={isDarkMode} selectedLanguage={selectedLanguage} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default App
