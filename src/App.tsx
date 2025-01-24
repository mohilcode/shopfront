import type React from "react"
import { useState, useEffect } from "react"
import { QrReader } from "react-qr-reader"
import { ChevronDown, Camera, RotateCw } from "lucide-react"

const languages = [
  { code: "ar", name: "Arabic" },
  { code: "bn", name: "Bengali" },
  { code: "bg", name: "Bulgarian" },
  { code: "zh", name: "Chinese" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" },
  { code: "et", name: "Estonian" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "iw", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hu", name: "Hungarian" },
  { code: "id", name: "Indonesian" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "no", name: "Norwegian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "sr", name: "Serbian" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "es", name: "Spanish" },
  { code: "sw", name: "Swahili" },
  { code: "sv", name: "Swedish" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "uk", name: "Ukrainian" },
  { code: "vi", name: "Vietnamese" }
]

const cameras = [
  { id: "environment", name: "Back Camera" },
  { id: "user", name: "Front Camera" },
]

interface Device {
  deviceId: string
  label: string
}

interface ProductInfo {
  name: string
  description: string
}

interface CustomSelectProps {
  options: Array<{ code?: string; id?: string; name: string }>
  value: string
  onChange: (value: string) => void
  label: string
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative w-full">
      <label className="block text-green-500 mb-1 text-xs">{label}</label>
      <button
        type="button"
        className="w-full bg-black border border-green-500/50 rounded px-3 py-2 text-left flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{options.find((opt) => opt.code === value || opt.id === value)?.name}</span>
        <ChevronDown className="w-4 h-4 text-green-500" />
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-black border border-green-500/50 rounded shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              type="button"
              key={option.code || option.id}
              className="w-full px-3 py-2 text-left hover:bg-green-500/10 transition-colors truncate"
              onClick={() => {
                onChange(option.code || option.id || "")
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
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [selectedCamera, setSelectedCamera] = useState("environment")
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<Device[]>([])

  useEffect(() => {
    const getDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices
          .filter((device) => device.kind === "videoinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${devices.indexOf(device) + 1}`,
          }))

        setDevices(videoDevices)
        for (const track of stream.getTracks()) {
          track.stop()
        }
      } catch (err) {
        console.error("Failed to access camera:", err)
      }
    }

    getDevices()
  }, [])

  const handleScan = async (data: string | null) => {
    if (data) {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`https://apishop.mohil.dev/barcode/${data}/${selectedLanguage}`)
        if (!response.ok) throw new Error("Product not found")
        const result = await response.json()
        setProductInfo(result)
        setScannedData(data)
        setShowScanner(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch product")
        setShowScanner(false)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center border-b border-green-500/20 pb-4 mb-6">
          <h1 className="text-3xl font-bold mb-2">SCAN JAPAN</h1>
          <div className="text-sm opacity-60">Barcode Scanner v1.0</div>
        </div>

        {/* Settings */}
        <div className="space-y-4 border-b border-green-500/20 pb-6 mb-6">
          <CustomSelect options={languages} value={selectedLanguage} onChange={setSelectedLanguage} label="LANGUAGE" />
          <CustomSelect options={cameras} value={selectedCamera} onChange={setSelectedCamera} label="CAMERA" />
        </div>

        {/* Content */}
        <div className="border border-green-500/20 rounded p-4">
          {showScanner ? (
            <div className="space-y-4">
              <div className="aspect-square bg-black rounded relative overflow-hidden">
                <QrReader
                  onResult={(result, error) => {
                    if (result) {
                      handleScan(result?.getText())
                    }
                    if (error) {
                      console.error("Scanner error:", error)
                    }
                  }}
                  constraints={{
                    facingMode: selectedCamera,
                    deviceId: devices.find((d) =>
                      d.label.toLowerCase().includes(selectedCamera === "environment" ? "back" : "front"),
                    )?.deviceId,
                  }}
                  className="w-full h-full"
                  videoStyle={{ objectFit: "cover" }}
                />
                <div className="absolute inset-0 border-2 border-green-500/20 rounded pointer-events-none">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500" />
                </div>
              </div>
              <div className="text-center text-sm opacity-60">Position barcode within the frame</div>
            </div>
          ) : (
            <>
              <div className="space-y-1 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-green-500/80">SYSTEM</span>
                  <span className="opacity-60">{loading ? "PROCESSING..." : "READY"}</span>
                </div>
                <div className="text-sm opacity-60 border-l-2 border-green-500/20 pl-4 py-1">
                  {error || "Press the button to initiate scanning"}
                </div>
              </div>

              {productInfo && scannedData ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-500/10 flex items-center justify-center">
                      <span className="text-green-500">ID</span>
                    </div>
                    <div>
                      <div className="font-bold">SCAN RESULT</div>
                      <div className="opacity-60 text-sm">{new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed opacity-80 bg-green-500/5 p-4 rounded border border-green-500/10 text-xs">
                    {`Product Name: ${productInfo.name}
Description: ${productInfo.description}
Scanned Code: ${scannedData}

Language: ${languages.find((l) => l.code === selectedLanguage)?.name}`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      setShowScanner(true)
                      setProductInfo(null)
                      setScannedData(null)
                    }}
                    className="w-full py-2 border border-green-500/20 rounded text-center hover:bg-green-500/5 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    SCAN AGAIN
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="w-full py-4 border border-green-500/20 rounded text-center hover:bg-green-500/5 transition-colors group relative overflow-hidden flex items-center justify-center gap-2"
                >
                  <div className="absolute inset-0 bg-green-500/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                  <Camera className="w-5 h-5 relative" />
                  <span className="relative">INITIATE SCAN</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* ASCII Art Footer */}
        <div className="mt-8 border-t border-green-500/20 pt-4">
          <pre className="text-center text-xs opacity-40 text-green-500">
            {`
+-----------------+
|    COMPLETE    |
+-----------------+
`}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default App