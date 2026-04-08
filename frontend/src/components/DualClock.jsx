import { useState, useEffect } from 'react'
import { formatInTimeZone } from 'date-fns-tz'

// ── WMO weather code → emoji + label ─────────────────────────────────────────
function weatherInfo(code) {
  if (code === 0) return { emoji: '☀️', label: 'Clear' }
  if (code <= 2)  return { emoji: '🌤️', label: 'Partly cloudy' }
  if (code === 3) return { emoji: '☁️', label: 'Overcast' }
  if (code <= 48) return { emoji: '🌫️', label: 'Foggy' }
  if (code <= 57) return { emoji: '🌦️', label: 'Drizzle' }
  if (code <= 67) return { emoji: '🌧️', label: 'Rain' }
  if (code <= 77) return { emoji: '❄️', label: 'Snow' }
  if (code <= 82) return { emoji: '🌧️', label: 'Showers' }
  if (code <= 86) return { emoji: '🌨️', label: 'Snow showers' }
  return { emoji: '⛈️', label: 'Thunderstorm' }
}

// ── AQI label ─────────────────────────────────────────────────────────────────
function aqiLabel(us_aqi) {
  if (us_aqi == null) return null
  if (us_aqi <= 50)  return { label: 'Good', color: 'text-green-500' }
  if (us_aqi <= 100) return { label: 'Moderate', color: 'text-yellow-500' }
  if (us_aqi <= 150) return { label: 'Unhealthy*', color: 'text-orange-500' }
  if (us_aqi <= 200) return { label: 'Unhealthy', color: 'text-red-500' }
  return { label: 'Hazardous', color: 'text-purple-700' }
}

// ── Moon phase (client-side calculation) ─────────────────────────────────────
// Returns { emoji, name, illumination (0–1) }
function getMoonPhase(date) {
  // Known new moon: Jan 6 2000 18:14 UTC (J2000.0 epoch reference)
  const knownNew = new Date('2000-01-06T18:14:00Z')
  const synodicPeriod = 29.53058867 // days
  const elapsed = (date - knownNew) / (1000 * 60 * 60 * 24)
  const phase = ((elapsed % synodicPeriod) + synodicPeriod) % synodicPeriod
  const illumination = (1 - Math.cos((phase / synodicPeriod) * 2 * Math.PI)) / 2

  let emoji, name
  if (phase < 1.85)       { emoji = '🌑'; name = 'New Moon' }
  else if (phase < 7.38)  { emoji = '🌒'; name = 'Waxing Crescent' }
  else if (phase < 9.22)  { emoji = '🌓'; name = 'First Quarter' }
  else if (phase < 14.76) { emoji = '🌔'; name = 'Waxing Gibbous' }
  else if (phase < 16.61) { emoji = '🌕'; name = 'Full Moon' }
  else if (phase < 22.15) { emoji = '🌖'; name = 'Waning Gibbous' }
  else if (phase < 23.99) { emoji = '🌗'; name = 'Last Quarter' }
  else if (phase < 29.53) { emoji = '🌘'; name = 'Waning Crescent' }
  else                    { emoji = '🌑'; name = 'New Moon' }

  return { emoji, name, illumination }
}

// ── Main weather + air quality hook ──────────────────────────────────────────
function useWeather(latitude, longitude) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!latitude || !longitude) { setData(null); return }
    let cancelled = false

    const load = async () => {
      try {
        const [weatherRes, aqRes] = await Promise.all([
          fetch(
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,apparent_temperature,weather_code,uv_index` +
            `&daily=sunrise,sunset` +
            `&timezone=auto&forecast_days=1`
          ),
          fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality` +
            `?latitude=${latitude}&longitude=${longitude}` +
            `&current=us_aqi` +
            `&timezone=auto`
          ),
        ])
        const weather = await weatherRes.json()
        const aq = await aqRes.json()

        if (cancelled) return

        setData({
          temp: Math.round(weather.current?.temperature_2m ?? 0),
          feelsLike: Math.round(weather.current?.apparent_temperature ?? 0),
          code: weather.current?.weather_code ?? 0,
          uv: weather.current?.uv_index ?? null,
          sunrise: weather.daily?.sunrise?.[0] ?? null,  // ISO string e.g. "2026-04-08T05:42"
          sunset: weather.daily?.sunset?.[0] ?? null,
          aqi: aq.current?.us_aqi ?? null,
        })
      } catch (e) {
        // non-critical — silently ignore
      }
    }

    load()
    const interval = setInterval(load, 10 * 60 * 1000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [latitude, longitude])

  return data
}

// ── Format HH:mm from ISO datetime string ────────────────────────────────────
function fmtTime(isoStr) {
  if (!isoStr) return null
  // "2026-04-08T05:42" → "05:42"
  return isoStr.slice(11, 16)
}

// ── UV index label ────────────────────────────────────────────────────────────
function uvLabel(uv) {
  if (uv == null) return null
  if (uv <= 2)  return { label: 'Low', color: 'text-green-500' }
  if (uv <= 5)  return { label: 'Moderate', color: 'text-yellow-500' }
  if (uv <= 7)  return { label: 'High', color: 'text-orange-500' }
  if (uv <= 10) return { label: 'Very High', color: 'text-red-500' }
  return { label: 'Extreme', color: 'text-purple-700' }
}

// ── Clock card ────────────────────────────────────────────────────────────────
function ClockCard({ user, color }) {
  const [now, setNow] = useState(new Date())
  const weather = useWeather(user?.latitude, user?.longitude)
  const moon = getMoonPhase(now)

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
  const uvInfo = weather ? uvLabel(weather.uv) : null
  const aqInfo = weather ? aqiLabel(weather.aqi) : null

  const hasLocation = user.latitude && user.longitude
  const loading = hasLocation && !weather

  return (
    <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center space-y-1">
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-2"
        style={{ backgroundColor: color }}
      >
        {(user.display_name || '?')[0].toUpperCase()}
      </div>

      {/* Name + clock */}
      <p className="text-xs font-semibold text-gray-500">{user.display_name}</p>
      <p className="text-2xl font-mono font-bold text-gray-800">{time}</p>
      <p className="text-xs text-gray-400">{date}</p>
      <p className="text-xs text-gray-300">{cityLabel}</p>

      {/* Moon phase — always shown (client-side, no location needed) */}
      <div className="flex items-center justify-center gap-1 pt-1">
        <span className="text-sm">{moon.emoji}</span>
        <span className="text-xs text-gray-400">{moon.name}</span>
        <span className="text-xs text-gray-300">({Math.round(moon.illumination * 100)}%)</span>
      </div>

      {/* Weather block (only when location is set) */}
      {loading && (
        <p className="text-xs text-gray-300 pt-1">Loading weather…</p>
      )}
      {info && (
        <div className="pt-1 space-y-1.5">
          {/* Current temp + condition */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xl leading-none">{info.emoji}</span>
            <div className="text-left">
              <span className="text-base font-bold text-gray-800">{weather.temp}°C</span>
              <span className="text-xs text-gray-400 ml-1">/ feels {weather.feelsLike}°C</span>
            </div>
          </div>

          {/* Sunrise / Sunset */}
          {(weather.sunrise || weather.sunset) && (
            <div className="flex justify-center gap-3 text-xs text-gray-500">
              {weather.sunrise && (
                <span>🌅 {fmtTime(weather.sunrise)}</span>
              )}
              {weather.sunset && (
                <span>🌇 {fmtTime(weather.sunset)}</span>
              )}
            </div>
          )}

          {/* UV + AQI */}
          <div className="flex justify-center gap-3 text-xs">
            {uvInfo && (
              <span>
                <span className="text-gray-400">UV </span>
                <span className={`font-semibold ${uvInfo.color}`}>
                  {Math.round(weather.uv)} · {uvInfo.label}
                </span>
              </span>
            )}
            {aqInfo && (
              <span>
                <span className="text-gray-400">AQI </span>
                <span className={`font-semibold ${aqInfo.color}`}>
                  {weather.aqi} · {aqInfo.label}
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Prompt when no location set yet */}
      {!hasLocation && (
        <p className="text-xs text-gray-300 pt-1">Set city in Profile for weather</p>
      )}
    </div>
  )
}

export default function DualClock({ meUser, partnerUser }) {
  return (
    <div className="flex gap-3 items-start">
      <ClockCard user={meUser} color="#7F77DD" />
      <ClockCard user={partnerUser} color="#D85A30" />
    </div>
  )
}
