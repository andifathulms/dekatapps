import { useState, useEffect } from 'react'
import { reverseGeocode, createCheckIn } from '../api/checkins'

const MOODS = ['😊', '😴', '🍜', '💪', '☕', '🏠', '💼', '😔', '🥰', '😤']

export default function CheckInModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('locating')
  const [coords, setCoords] = useState(null)
  const [placeData, setPlaceData] = useState(null)
  const [placeName, setPlaceName] = useState('')
  const [note, setNote] = useState('')
  const [moodEmoji, setMoodEmoji] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const locate = () => {
    setStep('locating')
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCoords({ latitude, longitude })
        try {
          const res = await reverseGeocode(latitude, longitude)
          setPlaceData(res.data)
          setPlaceName(res.data.place_name)
          setStep('confirm')
        } catch {
          setError('Could not determine your location name. Please try again.')
          setStep('error')
        }
      },
      (err) => {
        setError('Could not get your location. Please allow location access.')
        setStep('error')
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
      locate()
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!coords) return
    setLoading(true)
    try {
      await createCheckIn({
        latitude: parseFloat(coords.latitude.toFixed(6)),
        longitude: parseFloat(coords.longitude.toFixed(6)),
        place_name: placeName,
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {step === 'locating' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Getting your location...</p>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-8">
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              onClick={locate}
              className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-semibold"
            >
              Retry
            </button>
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
          </div>
        )}
      </div>
    </div>
  )
}
