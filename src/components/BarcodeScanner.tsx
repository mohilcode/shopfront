import type { FC } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Camera, RotateCw } from 'lucide-react'

const scannerStyles = `
  #reader {
    width: 100% !important;
    border: none !important;
  }
  #reader video {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    border-radius: 4px;
  }
  #reader__scan_region {
    background: transparent !important;
  }
  #reader__scan_region > img {
    display: none !important;
  }
  #reader div[style*="border"] {
    border: none !important;
  }
`

interface Reviews {
  rakuten?: {
    count: number
    average: number
  }
  yahoo?: {
    count: number
    average: number
  }
}

interface ProductInfo {
  name: string
  description: string
  reviews?: Reviews
}

interface BarcodeScannerProps {
  onScan: (data: string) => Promise<void>
  selectedCamera: string
  isDarkMode: boolean
  loading: boolean
  error: string | null
  productInfo: ProductInfo | null
  scannedData: string | null
}

const formatRating = (rating: number) => rating.toFixed(1)

export const BarcodeScanner: FC<BarcodeScannerProps> = ({
  onScan,
  selectedCamera,
  isDarkMode,
  loading,
  error,
  productInfo,
  scannedData,
}) => {
  const [showScanner, setShowScanner] = useState(false)
  const [scannerRef, setScannerRef] = useState<Html5Qrcode | null>(null)

  const stopScanner = useCallback(async () => {
    if (scannerRef?.isScanning) {
      try {
        await scannerRef.stop()
        setShowScanner(false)
      } catch (err) {
        console.error('Failed to stop scanner:', err)
      }
    }
  }, [scannerRef])

  const startScanner = useCallback(async () => {
    try {
      if (!scannerRef) {
        const newScanner = new Html5Qrcode('reader', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
          ],
          verbose: false,
        })
        setScannerRef(newScanner)
      }

      await scannerRef?.start(
        { deviceId: { exact: selectedCamera } },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async decodedText => {
          await onScan(decodedText)
          void stopScanner()
        },
        () => {}
      )
      setShowScanner(true)
    } catch (err) {
      console.error('Failed to start scanner:', err)
      setShowScanner(false)
    }
  }, [scannerRef, selectedCamera, onScan, stopScanner])

  useEffect(() => {
    if (showScanner) {
      void stopScanner().then(() => void startScanner())
    }
  }, [showScanner, stopScanner, startScanner])

  useEffect(() => {
    return () => {
      void stopScanner()
    }
  }, [stopScanner])

  return (
    <>
      <style>{`
        ${scannerStyles}
        ${
          !isDarkMode
            ? `
          #reader__dashboard_section_csr span {
            color: black !important;
          }
        `
            : ''
        }
      `}</style>

      {showScanner ? (
        <div className="space-y-4">
          <div className="aspect-square bg-black rounded relative overflow-hidden">
            <div id="reader" className="w-full h-full" />
            <div
              className={`absolute inset-0 border-2 rounded pointer-events-none ${
                isDarkMode ? 'border-white/20' : 'border-black/20'
              }`}
            >
              <div
                className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${
                  isDarkMode ? 'border-white' : 'border-black'
                }`}
              />
              <div
                className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${
                  isDarkMode ? 'border-white' : 'border-black'
                }`}
              />
              <div
                className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${
                  isDarkMode ? 'border-white' : 'border-black'
                }`}
              />
              <div
                className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${
                  isDarkMode ? 'border-white' : 'border-black'
                }`}
              />
            </div>
          </div>
          <div className="text-center text-sm opacity-60">Position barcode within the frame</div>
        </div>
      ) : (
        <>
          <div className="space-y-1 mb-6">
            <div className="flex items-center justify-between">
              <span className={isDarkMode ? 'text-white/80' : 'text-black/80'}>SYSTEM</span>
              <span className="opacity-60">{loading ? 'PROCESSING' : 'READY'}</span>
            </div>
            <div
              className={`text-sm opacity-60 border-l-2 pl-4 py-1 ${
                isDarkMode ? 'border-white/20' : 'border-black/20'
              }`}
            >
              {error || 'Press the button to initiate scanning'}
            </div>
          </div>

          {loading ? (
            <div
              className={`text-center animate-pulse ${
                isDarkMode ? 'text-white/80' : 'text-black/80'
              }`}
            >
              LOOKING UP PRODUCT...
            </div>
          ) : error ? (
            <div>
              <div className={`text-center mb-4 ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
                {error}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowScanner(true)
                }}
                className={`w-full py-2 border rounded text-center transition-colors text-sm flex items-center justify-center gap-2 ${
                  isDarkMode
                    ? 'border-white/20 hover:bg-white/5'
                    : 'border-black/20 hover:bg-black/5'
                }`}
              >
                <RotateCw className="w-4 h-4" />
                SCAN AGAIN
              </button>
            </div>
          ) : productInfo && scannedData ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-8 h-8 flex items-center justify-center ${
                    isDarkMode ? 'bg-white/10' : 'bg-black/10'
                  }`}
                >
                  <span>ID</span>
                </div>
                <div>
                  <div className="font-bold">SCAN RESULT</div>
                  <div className="opacity-60 text-sm">{new Date().toLocaleDateString()}</div>
                </div>
              </div>
              <div
                className={`space-y-2 p-4 rounded border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                }`}
              >
                <h3 className="font-bold">Product Name</h3>
                <p className="text-sm opacity-80">{productInfo.name}</p>
              </div>
              <div
                className={`space-y-2 p-4 rounded border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                }`}
              >
                <h3 className="font-bold">Description</h3>
                <p className="text-sm opacity-80 whitespace-pre-wrap">{productInfo.description}</p>
              </div>
              {productInfo.reviews && Object.keys(productInfo.reviews).length > 0 && (
                <div
                  className={`space-y-3 p-4 rounded border ${
                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                  }`}
                >
                  <h3 className="font-bold">Reviews</h3>
                  <div className="space-y-4">
                    {productInfo.reviews.rakuten && (
                      <div className="text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Rakuten</span>
                            <span className="opacity-60">
                              {productInfo.reviews.rakuten.count} reviews
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isDarkMode ? 'bg-white/10' : 'bg-black/10'
                          }`}>
                            {formatRating(productInfo.reviews.rakuten.average)}/5.0
                          </span>
                        </div>
                      </div>
                    )}
                    {productInfo.reviews.yahoo && (
                      <div className="text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Yahoo</span>
                            <span className="opacity-60">
                              {productInfo.reviews.yahoo.count} reviews
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isDarkMode ? 'bg-white/10' : 'bg-black/10'
                          }`}>
                            {formatRating(productInfo.reviews.yahoo.average)}/5.0
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowScanner(true)
                }}
                className={`w-full py-2 border rounded text-center transition-colors text-sm flex items-center justify-center gap-2 ${
                  isDarkMode
                    ? 'border-white/20 hover:bg-white/5'
                    : 'border-black/20 hover:bg-black/5'
                }`}
              >
                <RotateCw className="w-4 h-4" />
                SCAN AGAIN
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className={`w-full py-4 border rounded text-center transition-colors group relative overflow-hidden flex items-center justify-center gap-2 ${
                isDarkMode ? 'border-white/20' : 'border-black/20'
              }`}
            >
              <div
                className={`absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform ${
                  isDarkMode ? 'bg-white/10' : 'bg-black/10'
                }`}
              />
              <Camera className="w-5 h-5 relative" />
              <span className="relative">INITIATE SCAN</span>
            </button>
          )}
        </>
      )}
    </>
  )
}

export default BarcodeScanner