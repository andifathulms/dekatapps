import { useState, useEffect } from 'react'
import { formatInTimeZone } from 'date-fns-tz'

// WMO weather code → { emoji, label }
function weatherInfo(code) {
  if (code === 0) return { emoji: '☀️', label: 'Clear' }
  if (code <= 2) return { emoji: '🌤️', label: 'Partly cloudy' }
  if (code === 3) return { emoji: '☁️', label: 'Overcast' }
  if (code <= 48) return { emoji: '🌫️', label: 'Foggy' }
  if (code <= 57) return { emoji: '🌦️', label: 'Drizzle' }
  if (code <= 67) return { emoji: '🌧️', label: 'Rain' }
  if (code <= 77) return { emoji: '❄️', label: 'Snow' }
  if (code <= 82) return { emoji: '🌧️', label: 'Showers' }
  if (code <= 86) return { emoji: '🌨️', label: 'Snow showers' }
  return { emoji: '⛈️', label: 'Thunderstorm' }
}

function useWeather(latitude, longitude) {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    if (!latitude || !longitude) { setWeather(null); return }
    let cancelled = false
    const fetch_ = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto&forecast_days=1`
        )
        const data = await res.json()
        if (!cancelled && data.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
          })
        }
      } catch (e) {
        // silently fail — weather is non-critical
      }
    }
    fetch_()
    // refresh every 10 minutes
    const interval = setInterval(fetch_, 10 * 60 * 1000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [latitude, longitude])

  return weather
}

function ClockCard({ user, color }) {
  const [now, setNow] = useState(new Date())
  const weather = useWeather(user?.latitude, user?.longitude)

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!user) {
    return (
      <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center">
        <p className="text-gray-300 text-sm">—</p>
      </div>
    )
  }

  const tz = user.timezone || 'UTC'
  const time = formatInTimeZone(now, tz, 'HH:mm:ss')
  const date = formatInTimeZone(now, tz, 'EEE, d MMM')
  const cityLabel = user.city || tz.split('/').pop().replace(/_/g, ' ')
  const info = weather ? weatherInfo(weather.code) : null

  return (
    <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-2"
        style={{ backgroundColor: color }}
      >
        {(user.display_name || '?')[0].toUpperCase()}
      </div>
      <p className="text-xs font-semibold text-gray-500 mb-1">{user.display_name}</p>
      <p className="text-2xl font-mono font-bold text-gray-800">{time}</p>
      <p className="text-xs text-gray-400 mt-1">{date}</p>
      <p className="text-xs text-gray-300 mt-0.5">{cityLabel}</p>
      {info && (
        <div className="mt-2 flex items-center justify-center gap-1">
          <span className="text-base leading-none">{info.emoji}</span>
          <span className="text-sm font-semibold text-gray-700">{weather.temp}°C</span>
        </div>
      )}
      {!info && user.latitude && (
        <p className="text-xs text-gray-300 mt-2">…</p>
      )}
    </div>
  )
}

export default function DualClock({ meUser, partnerUser }) {
  return (
    <div className="flex gap-3">
      <ClockCard user={meUser} color="#7F77DD" />
      <ClockCard user={partnerUser} color="#D85A30" />
    </div>
  )
}
