import type { FC } from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, RotateCw } from 'lucide-react'
import type { IngredientsResponse } from '../types'

interface IngredientsScannerProps {
  selectedCamera: string
  isDarkMode: boolean
  selectedLanguage: string
}

export const IngredientsScanner: FC<IngredientsScannerProps> = ({
  selectedCamera,
  isDarkMode,
  selectedLanguage,
}) => {
  const [showCamera, setShowCamera] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ingredientsInfo, setIngredientsInfo] = useState<IngredientsResponse | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      for (const track of stream.getTracks()) {
        track.stop()
      }
      videoRef.current.srcObject = null
      setShowCamera(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const startCamera = async () => {
    setShowCamera(true)
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
      setError('Failed to access camera. Please check permissions.')
      setShowCamera(false)
    }
  }

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      return
    }

    const context = canvasRef.current.getContext('2d')
    if (!context) {
      return
    }

    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
    canvasRef.current.toBlob(async blob => {
      if (blob) {
        await analyzeIngredients(blob)
      }
    }, 'image/jpeg')

    stopCamera()
  }

  const analyzeIngredients = async (imageBlob: Blob) => {
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', imageBlob, 'image.jpg')
      formData.append('lang', selectedLanguage)

      const response = await fetch('https://apishop.mohil.dev/ingredients', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to analyze ingredients')
      }
      setIngredientsInfo(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze ingredients')
    } finally {
      setLoading(false)
    }
  }

  const renderBooleanIcon = (value: boolean) => (
    <span
      className={`inline-block w-4 h-4 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}
    />
  )

  if (showCamera) {
    return (
      <div className="space-y-4">
        <div className="aspect-square bg-black rounded relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label="Ingredients camera feed"
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" width={640} height={640} />
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
        <button
          type="button"
          onClick={captureImage}
          className={`w-full py-2 border rounded text-center transition-colors text-sm ${
            isDarkMode ? 'border-white/20 hover:bg-white/5' : 'border-black/20 hover:bg-black/5'
          }`}
        >
          CAPTURE IMAGE
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1 mb-6">
        <div className="flex items-center justify-between">
          <span className={isDarkMode ? 'text-white/80' : 'text-black/80'}>SYSTEM</span>
          <span className="opacity-60">{loading ? 'ANALYZING' : 'READY'}</span>
        </div>
        <div
          className={`text-sm opacity-60 border-l-2 pl-4 py-1 ${
            isDarkMode ? 'border-white/20' : 'border-black/20'
          }`}
        >
          {error || 'Take a picture of the ingredients label'}
        </div>
      </div>

      {loading ? (
        <div
          className={`text-center animate-pulse ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}
        >
          ANALYZING INGREDIENTS...
        </div>
      ) : error ? (
        <div>
          <div className={`text-center mb-4 ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
            {error}
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCamera(true)
              setIngredientsInfo(null)
              setError(null)
            }}
            className={`w-full py-2 border rounded text-center transition-colors text-sm flex items-center justify-center gap-2 ${
              isDarkMode ? 'border-white/20 hover:bg-white/5' : 'border-black/20 hover:bg-black/5'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            TRY AGAIN
          </button>
        </div>
      ) : ingredientsInfo ? (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-8 h-8 flex items-center justify-center ${
                isDarkMode ? 'bg-white/10' : 'bg-black/10'
              }`}
            >
              <span>IN</span>
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
                <li key={`ingredient-${ingredient}`} className="text-sm">
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
            <div
              className={`p-4 rounded border ${
                isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
              }`}
            >
              <h3 className="font-bold mb-1">Note:</h3>
              <p className="text-sm opacity-80">{ingredientsInfo.note}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setShowCamera(false)
              setIngredientsInfo(null)
            }}
            className={`w-full py-2 border rounded text-center transition-colors text-sm flex items-center justify-center gap-2 ${
              isDarkMode ? 'border-white/20 hover:bg-white/5' : 'border-black/20 hover:bg-black/5'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            ANALYZE AGAIN
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
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
          <span className="relative">TAKE PICTURE</span>
        </button>
      )}
    </>
  )
}

export default IngredientsScanner
