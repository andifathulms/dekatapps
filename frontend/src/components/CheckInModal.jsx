import { useState, useEffect } from 'react'
import { reverseGeocode, createCheckIn } from '../api/checkins'

const MOODS = ['😊', '😴', '🍜', '💪', '☕', '🏠', '💼', '😔', '🥰', '😤']

// Prompt user to paste coordinates from Google Maps
function ManualCoords({ onConfirm }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const parse = () => {
    // Accept "lat, lon" or "lat,lon" format as copied from Google Maps
    const match = input.trim().match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
    if (!match) {
      setError('Enter coordinates as: -6.200000, 106.816666')
      return
    }
    const lat = parseFloat(match[1])
    const lon = parseFloat(match[2])
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Invalid coordinates range.')
      return
    }
    onConfirm(lat, lon)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 leading-relaxed">
        Open <strong>Google Maps</strong>, long-press your location, then copy the coordinates shown at the top.
      </p>
      <input
        type="text"
        value={input}
        onChange={(e) => { setInput(e.target.value); setError('') }}
        placeholder="-6.200000, 106.816666"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
        autoFocus
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={parse}
        disabled={!input.trim()}
        className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
      >
        Use These Coordinates
      </button>
    </div>
  )
}

export default function CheckInModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('locating') // locating | manual | confirm | error
  const [coords, setCoords] = useState(null)
  const [placeData, setPlaceData] = useState(null)
  const [placeName, setPlaceName] = useState('')
  const [note, setNote] = useState('')
  const [moodEmoji, setMoodEmoji] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [geoBlocked, setGeoBlocked] = useState(false)

  const geocodeAndConfirm = async (lat, lon) => {
    setStep('locating')
    try {
      const res = await reverseGeocode(lat, lon)
      setPlaceData(res.data)
      setPlaceName(res.data.place_name)
      setCoords({ latitude: lat, longitude: lon })
      setStep('confirm')
    } catch {
      setError('Could not look up place name. You can enter it manually.')
      setCoords({ latitude: lat, longitude: lon })
      setPlaceName('')
      setStep('confirm')
    }
  }

  const locate = () => {
    setStep('locating')
    setError('')
    setGeoBlocked(false)

    if (!navigator.geolocation) {
      setGeoBlocked(true)
      setStep('manual')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        geocodeAndConfirm(
          parseFloat(latitude.toFixed(6)),
          parseFloat(longitude.toFixed(6))
        )
      },
      (err) => {
        // PERMISSION_DENIED (1) or HTTPS required → show manual fallback
        setGeoBlocked(true)
        setStep('manual')
      },
      { timeout: 10000 }
    )
  }

  useEffect(() => {
    if (isOpen) {
      setStep('locating')
      setCoords(null)
      setPlaceData(null)
      setPlaceName('')
      setNote('')
      setMoodEmoji('')
      setError('')
      setGeoBlocked(false)
      locate()
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!coords) return
    setLoading(true)
    try {
      await createCheckIn({
        latitude: coords.latitude,
        longitude: coords.longitude,
        place_name: placeName || 'Unknown place',
        place_type: placeData?.place_type || 'place',
        note,
        mood_emoji: moodEmoji,
      })
      onSuccess()
      onClose()
    } catch {
      setError('Failed to save check-in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-800">Check In</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {step === 'locating' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Getting your location...</p>
          </div>
        )}

        {step === 'manual' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              📍 Location access requires HTTPS. Enter your coordinates manually.
            </div>
            <ManualCoords onConfirm={(lat, lon) => geocodeAndConfirm(lat, lon)} />
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Place</label>
              <input
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Where are you?"
              />
              {placeData?.display_address && (
                <p className="text-xs text-gray-400 mt-1 truncate">{placeData.display_address}</p>
              )}
              {coords && (
                <p className="text-xs text-gray-300 mt-0.5">
                  {coords.latitude}, {coords.longitude}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Note <span className="font-normal text-gray-400">({note.length}/200)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="What are you up to? (optional)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Mood</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setMoodEmoji(moodEmoji === emoji ? '' : emoji)}
                    className={`text-2xl p-1.5 rounded-xl transition-all ${
                      moodEmoji === emoji ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || !placeName.trim()}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving...' : '📍 Check In'}
            </button>

            {/* Allow switching to manual if auto-locate worked but user wants different coords */}
            {!geoBlocked && (
              <button onClick={() => setStep('manual')} className="w-full text-xs text-gray-400 hover:text-primary transition-colors">
                Enter coordinates manually instead
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
