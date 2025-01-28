import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import { BarcodeScanner, type DetectedBarcode } from 'react-barcode-scanner'
import 'react-barcode-scanner/polyfill'
import { ChevronDown, Camera, RotateCw } from 'lucide-react'

const languages = [
  { code: 'ar', name: 'Arabic' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'iw', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'ko', name: 'Korean' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'no', name: 'Norwegian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'es', name: 'Spanish' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'vi', name: 'Vietnamese' },
]

interface Device {
  deviceId: string
  label: string
}

interface ProductInfo {
  name: string
  description: string
}

interface IngredientsResponse {
  ingredients: string[]
  vegetarian: boolean
  containsMeat: boolean
  containsFish: boolean
  isVegan: boolean
  note: string
}

interface CustomSelectProps {
  options: Array<{ code?: string; id?: string; name: string }>
  value: string
  onChange: (value: string) => void
  label: string
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, label }) => {
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
      <label htmlFor={`select-${label}`} className="block text-white/80 mb-1 text-xs">
        {label}
      </label>
      <button
        id={`select-${label}`}
        type="button"
        className="w-full bg-black border border-white/50 rounded px-3 py-2 text-left flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {options.find(opt => opt.code === value || opt.id === value)?.name}
        </span>
        <ChevronDown className="w-4 h-4 text-white" />
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-black border border-white/50 rounded shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => (
            <button
              type="button"
              key={option.code || option.id}
              className="w-full px-3 py-2 text-left hover:bg-white/10 transition-colors truncate"
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'barcode' | 'ingredients'>('barcode')
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [showIngredientsCamera, setShowIngredientsCamera] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('selectedLanguage') || 'en'
  })
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [ingredientsInfo, setIngredientsInfo] = useState<IngredientsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [ingredientsLoading, setIngredientsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ingredientsError, setIngredientsError] = useState<string | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices
          .filter(device => device.kind === 'videoinput')
          .sort((a, b) => {
            const aLabel = a.label.toLowerCase()
            const bLabel = b.label.toLowerCase()
            if (aLabel.includes('back') || aLabel.includes('rear')) return -1
            if (bLabel.includes('back') || bLabel.includes('rear')) return 1
            return 0
          })
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
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

  useEffect(() => {
    if (activeTab === 'ingredients') {
      setShowScanner(false)
    } else {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        for (const track of stream.getTracks()) {
          track.stop()
        }
        videoRef.current.srcObject = null
        setShowIngredientsCamera(false)
      }
    }
  }, [activeTab])

  const handleBarcodeScan = async (barcodes: DetectedBarcode[]) => {
    if (barcodes?.length > 0 && !loading) {
      const data = barcodes[0].rawValue
      setLoading(true)
      setError(null)
      setShowScanner(false)
      try {
        const response = await fetch(
          `https://apishop.mohil.dev/barcode/${data}/${selectedLanguage}`
        )
        if (!response.ok) throw new Error('Product not found')
        setProductInfo(await response.json())
        setScannedData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product')
      } finally {
        setLoading(false)
      }
    }
  }

  const startIngredientsCamera = () => {
    setShowIngredientsCamera(true)
  }

  useEffect(() => {
    const initCamera = async () => {
      if (!showIngredientsCamera) return

      try {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream
          for (const track of stream.getTracks()) {
            track.stop()
          }
        }

        const constraints: MediaStreamConstraints = {
          video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (err) {
        console.error('Camera error:', err)
        setIngredientsError('Failed to access camera. Please check permissions.')
        setShowIngredientsCamera(false)
      }
    }

    initCamera()
  }, [showIngredientsCamera, selectedCamera])

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        canvasRef.current.toBlob(async blob => {
          if (blob) await analyzeIngredients(blob)
        }, 'image/jpeg')
      }
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      for (const track of stream.getTracks()) {
        track.stop()
      }

      videoRef.current.srcObject = null
    }
    setShowIngredientsCamera(false)
  }

  const analyzeIngredients = async (imageBlob: Blob) => {
    setIngredientsLoading(true)
    setIngredientsError(null)
    try {
      const formData = new FormData()
      formData.append('file', imageBlob, 'image.jpg')
      formData.append('lang', selectedLanguage)

      const response = await fetch('https://apishop.mohil.dev/ingredients', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to analyze ingredients')
      setIngredientsInfo(await response.json())
    } catch (err) {
      setIngredientsError(err instanceof Error ? err.message : 'Failed to analyze ingredients')
    } finally {
      setIngredientsLoading(false)
    }
  }

  const renderBooleanIcon = (value: boolean) => (
    <span
      className={`inline-block w-4 h-4 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}
    />
  )

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="max-w-md mx-auto relative">
        <div className="text-center border-b border-white/20 pb-4 mb-6">
          <h1 className="text-3xl font-bold mb-2">SCANTOMO</h1>
          <div className="text-sm opacity-60">Scanner v2.0</div>
        </div>

        <div className="space-y-4 border-b border-white/20 pb-6 mb-6">
          <CustomSelect
            options={languages}
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            label="LANGUAGE"
          />
          <CustomSelect
            options={devices.map(d => ({ id: d.deviceId, name: d.label }))}
            value={selectedCamera}
            onChange={setSelectedCamera}
            label="CAMERA"
          />
        </div>

        <div className="flex justify-center mb-4">
          <button
            type="button"
            className={`px-4 py-2 ${activeTab === 'barcode' ? 'bg-white text-black' : 'bg-black text-white'} border border-white`}
            onClick={() => setActiveTab('barcode')}
          >
            Barcode
          </button>
          <button
            type="button"
            className={`px-4 py-2 ${activeTab === 'ingredients' ? 'bg-white text-black' : 'bg-black text-white'} border border-white`}
            onClick={() => setActiveTab('ingredients')}
          >
            Ingredients
          </button>
        </div>

        <div className="border border-white/20 rounded p-4">
          {activeTab === 'barcode' ? (
            showScanner ? (
              <div className="space-y-4">
                <div className="aspect-square bg-black rounded relative overflow-hidden">
                  <BarcodeScanner
                    options={{
                      formats: ['code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e'],
                      delay: 500,
                    }}
                    onCapture={handleBarcodeScan}
                    trackConstraints={{
                      deviceId: { exact: selectedCamera },
                    }}
                  />
                  <div className="absolute inset-0 border-2 border-white/20 rounded pointer-events-none">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
                  </div>
                </div>
                <div className="text-center text-sm opacity-60">
                  Position barcode within the frame
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">SYSTEM</span>
                    <span className="opacity-60">{loading ? 'PROCESSING' : 'READY'}</span>
                  </div>
                  <div className="text-sm opacity-60 border-l-2 border-white/20 pl-4 py-1">
                    {error || 'Press the button to initiate scanning'}
                  </div>
                </div>

                {loading ? (
                  <div className="text-center text-white/80 animate-pulse">
                    LOOKING UP PRODUCT...
                  </div>
                ) : error ? (
                  <div>
                    <div className="text-center text-white/80 mb-4">{error}</div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowScanner(true)
                        setProductInfo(null)
                        setScannedData(null)
                        setError(null)
                      }}
                      className="w-full py-2 border border-white/20 rounded text-center hover:bg-white/5 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <RotateCw className="w-4 h-4" />
                      SCAN AGAIN
                    </button>
                  </div>
                ) : productInfo && scannedData ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-white/10 flex items-center justify-center">
                        <span className="text-white">ID</span>
                      </div>
                      <div>
                        <div className="font-bold">SCAN RESULT</div>
                        <div className="opacity-60 text-sm">{new Date().toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white/5 p-4 rounded border border-white/10">
                        <h3 className="font-bold mb-2">Product Name</h3>
                        <p className="text-sm opacity-80">{productInfo.name}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded border border-white/10">
                        <h3 className="font-bold mb-2">Description</h3>
                        <p className="text-sm opacity-80 whitespace-pre-wrap">
                          {productInfo.description}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowScanner(true)
                        setProductInfo(null)
                        setScannedData(null)
                      }}
                      className="w-full py-2 border border-white/20 rounded text-center hover:bg-white/5 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <RotateCw className="w-4 h-4" />
                      SCAN AGAIN
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="w-full py-4 border border-white/20 rounded text-center hover:bg-white/5 transition-colors group relative overflow-hidden flex items-center justify-center gap-2"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                    <Camera className="w-5 h-5 relative" />
                    <span className="relative">INITIATE SCAN</span>
                  </button>
                )}
              </>
            )
          ) : showIngredientsCamera ? (
            <div className="space-y-4">
              <div className="aspect-square bg-black rounded relative overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  aria-label="Barcode scanner camera feed"
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" width={640} height={640} />
                <div className="absolute inset-0 border-2 border-white/20 rounded pointer-events-none">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
                </div>
              </div>
              <button
                type="button"
                onClick={captureImage}
                className="w-full py-2 border border-white/20 rounded text-center hover:bg-white/5 transition-colors text-sm"
              >
                CAPTURE IMAGE
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">SYSTEM</span>
                  <span className="opacity-60">{ingredientsLoading ? 'ANALYZING' : 'READY'}</span>
                </div>
                <div className="text-sm opacity-60 border-l-2 border-white/20 pl-4 py-1">
                  {ingredientsError || 'Take a picture of the ingredients label'}
                </div>
              </div>

              {ingredientsLoading ? (
                <div className="text-center text-white/80 animate-pulse">
                  ANALYZING INGREDIENTS...
                </div>
              ) : ingredientsError ? (
                <div>
                  <div className="text-center text-white/80 mb-4">{ingredientsError}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowIngredientsCamera(true)
                      setIngredientsInfo(null)
                      setIngredientsError(null)
                    }}
                    className="w-full py-2 border border-white/20 rounded text-center hover:bg-white/5 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    TRY AGAIN
                  </button>
                </div>
              ) : ingredientsInfo ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-white/10 flex items-center justify-center">
                      <span className="text-white">IN</span>
                    </div>
                    <div>
                      <div className="font-bold">INGREDIENTS ANALYSIS</div>
                      <div className="opacity-60 text-sm">{new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold">Ingredients:</h3>
                    <ul className="list-disc list-inside">
                      {ingredientsInfo.ingredients.map(ingredient => (
                        <li key={ingredient} className="text-sm">
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between p-2 rounded">
                      <span>Vegan:</span>
                      {renderBooleanIcon(ingredientsInfo.isVegan)}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded">
                      <span>Contains Meat:</span>
                      {renderBooleanIcon(ingredientsInfo.containsMeat)}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded">
                      <span>Vegetarian:</span>
                      {renderBooleanIcon(ingredientsInfo.vegetarian)}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded">
                      <span>Contains Fish:</span>
                      {renderBooleanIcon(ingredientsInfo.containsFish)}
                    </div>
                  </div>
                  {ingredientsInfo.note && (
                    <div className="bg-white/5 p-2 rounded">
                      <h3 className="font-bold mb-1">Note:</h3>
                      <p className="text-sm">{ingredientsInfo.note}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowIngredientsCamera(false)
                      setIngredientsInfo(null)
                    }}
                    className="w-full py-2 border border-white/20 rounded text-center hover:bg-white/5 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    ANALYZE AGAIN
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startIngredientsCamera}
                  className="w-full py-4 border border-white/20 rounded text-center hover:bg-white/5 transition-colors group relative overflow-hidden flex items-center justify-center gap-2"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                  <Camera className="w-5 h-5 relative" />
                  <span className="relative">TAKE PICTURE</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
