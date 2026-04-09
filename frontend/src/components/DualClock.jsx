import { useState, useEffect, useMemo } from 'react'
import { formatInTimeZone } from 'date-fns-tz'

// ── Time-of-day sky theme ──────────────────────────────────────────────────
function getTimeTheme(hour) {
  if (hour >= 5 && hour < 7) return {
    bg: 'linear-gradient(160deg, #ff9a8b 0%, #ff6a88 55%, #ffc3a0 100%)',
    light: true, period: 'dawn',
  }
  if (hour >= 7 && hour < 11) return {
    bg: 'linear-gradient(160deg, #74b9ff 0%, #a8d8f0 65%, #dfe9f3 100%)',
    light: false, period: 'morning',
  }
  if (hour >= 11 && hour < 14) return {
    bg: 'linear-gradient(160deg, #f9d423 0%, #f8b500 60%, #ff9500 100%)',
    light: false, period: 'noon',
  }
  if (hour >= 14 && hour < 17) return {
    bg: 'linear-gradient(160deg, #48cae4 0%, #00b4d8 55%, #0096c7 100%)',
    light: false, period: 'afternoon',
  }
  if (hour >= 17 && hour < 19) return {
    bg: 'linear-gradient(160deg, #f4a261 0%, #e76f51 55%, #e63946 100%)',
    light: true, period: 'golden',
  }
  if (hour >= 19 && hour < 21) return {
    bg: 'linear-gradient(160deg, #c77dff 0%, #7b2d8b 60%, #3a0647 100%)',
    light: true, period: 'dusk',
  }
  // night 21–5
  return {
    bg: 'linear-gradient(160deg, #0d1b2a 0%, #1b2838 50%, #1a1a2e 100%)',
    light: true, period: 'night',
  }
}

// ── WMO weather code meta ──────────────────────────────────────────────────
function weatherMeta(code, isNight) {
  if (code === 0)  return { label: 'Clear',         emoji: isNight ? '🌙' : '☀️', anim: isNight ? 'stars' : 'sunny' }
  if (code <= 2)   return { label: 'Partly Cloudy', emoji: '⛅',                   anim: 'partly-cloudy' }
  if (code === 3)  return { label: 'Overcast',      emoji: '☁️',                   anim: 'cloudy' }
  if (code <= 48)  return { label: 'Foggy',         emoji: '🌫️',                  anim: 'fog' }
  if (code <= 57)  return { label: 'Drizzle',       emoji: '🌦️',                  anim: 'drizzle' }
  if (code <= 67)  return { label: 'Rain',          emoji: '🌧️',                  anim: 'rain' }
  if (code <= 77)  return { label: 'Snow',          emoji: '❄️',                   anim: 'snow' }
  if (code <= 82)  return { label: 'Showers',       emoji: '🌧️',                  anim: 'rain' }
  if (code <= 86)  return { label: 'Snow Showers',  emoji: '🌨️',                  anim: 'snow' }
  return             { label: 'Thunderstorm',       emoji: '⛈️',                   anim: 'thunder' }
}

// ── Moon phase ─────────────────────────────────────────────────────────────
function getMoonPhase(date) {
  const knownNew = new Date('2000-01-06T18:14:00Z')
  const synodic  = 29.53058867
  const elapsed  = (date - knownNew) / 86400000
  const phase    = ((elapsed % synodic) + synodic) % synodic
  const illum    = (1 - Math.cos((phase / synodic) * 2 * Math.PI)) / 2
  let emoji, name
  if      (phase < 1.85)  { emoji = '🌑'; name = 'New Moon' }
  else if (phase < 7.38)  { emoji = '🌒'; name = 'Waxing Crescent' }
  else if (phase < 9.22)  { emoji = '🌓'; name = 'First Quarter' }
  else if (phase < 14.76) { emoji = '🌔'; name = 'Waxing Gibbous' }
  else if (phase < 16.61) { emoji = '🌕'; name = 'Full Moon' }
  else if (phase < 22.15) { emoji = '🌖'; name = 'Waning Gibbous' }
  else if (phase < 23.99) { emoji = '🌗'; name = 'Last Quarter' }
  else                    { emoji = '🌘'; name = 'Waning Crescent' }
  return { emoji, name, illum }
}

// ── Sunrise/Sunset progress (0–1) ─────────────────────────────────────────
function getSunProgress(sunriseStr, sunsetStr, now, tz) {
  if (!sunriseStr || !sunsetStr) return null
  const toMins = s => { const [h, m] = s.slice(11, 16).split(':').map(Number); return h * 60 + m }
  const rise = toMins(sunriseStr)
  const set  = toMins(sunsetStr)
  const cur  = parseInt(formatInTimeZone(now, tz, 'H')) * 60 + parseInt(formatInTimeZone(now, tz, 'm'))
  return Math.max(0, Math.min(1, (cur - rise) / (set - rise)))
}

const fmtTime = s => s ? s.slice(11, 16) : null

// ── AQI / UV badge info ────────────────────────────────────────────────────
function aqiInfo(v) {
  if (v == null)  return null
  if (v <= 50)    return { label: 'Good',       bg: '#22c55e', fg: '#fff' }
  if (v <= 100)   return { label: 'Moderate',   bg: '#f59e0b', fg: '#fff' }
  if (v <= 150)   return { label: 'Sensitive',  bg: '#f97316', fg: '#fff' }
  if (v <= 200)   return { label: 'Unhealthy',  bg: '#ef4444', fg: '#fff' }
  return            { label: 'Hazardous',      bg: '#7c3aed', fg: '#fff' }
}

function uvInfo(v) {
  if (v == null) return null
  if (v <= 2)    return { label: 'Low',       bg: '#22c55e', fg: '#fff' }
  if (v <= 5)    return { label: 'Moderate',  bg: '#eab308', fg: '#1a1a1a' }
  if (v <= 7)    return { label: 'High',      bg: '#f97316', fg: '#fff' }
  if (v <= 10)   return { label: 'Very High', bg: '#ef4444', fg: '#fff' }
  return           { label: 'Extreme',       bg: '#7c3aed', fg: '#fff' }
}

// ── Weather data hook ──────────────────────────────────────────────────────
function useWeather(lat, lon) {
  const [data, setData] = useState(null)
  useEffect(() => {
    if (!lat || !lon) { setData(null); return }
    let cancelled = false
    const load = async () => {
      try {
        const [wRes, aqRes] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,uv_index&daily=sunrise,sunset&timezone=auto&forecast_days=1`),
          fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`),
        ])
        const w  = await wRes.json()
        const aq = await aqRes.json()
        if (cancelled) return
        setData({
          temp:      Math.round(w.current?.temperature_2m     ?? 0),
          feelsLike: Math.round(w.current?.apparent_temperature ?? 0),
          code:      w.current?.weather_code ?? 0,
          uv:        w.current?.uv_index     ?? null,
          sunrise:   w.daily?.sunrise?.[0]   ?? null,
          sunset:    w.daily?.sunset?.[0]    ?? null,
          aqi:       aq.current?.us_aqi      ?? null,
        })
      } catch (_) {}
    }
    load()
    const iv = setInterval(load, 10 * 60 * 1000)
    return () => { cancelled = true; clearInterval(iv) }
  }, [lat, lon])
  return data
}

// ── Particle generation (stable per animType) ──────────────────────────────
function genParticles(animType) {
  const r = (a, b) => a + Math.random() * (b - a)
  if (animType === 'stars') {
    return Array.from({ length: 14 }, (_, i) => ({
      id: i, left: r(4, 96), top: r(4, 75),
      size: r(1, 2.8), dur: r(1.5, 3.5), del: r(0, 3.5),
    }))
  }
  if (animType === 'rain' || animType === 'drizzle') {
    const n = animType === 'drizzle' ? 10 : 20
    return Array.from({ length: n }, (_, i) => ({
      id: i, left: r(0, 100), dur: r(0.55, 1.1),
      del: r(0, 1.8), opacity: animType === 'drizzle' ? r(0.2, 0.45) : r(0.35, 0.65),
    }))
  }
  if (animType === 'snow') {
    return Array.from({ length: 11 }, (_, i) => ({
      id: i, left: r(5, 95), size: r(3, 6), dur: r(2.2, 4), del: r(0, 3),
    }))
  }
  if (animType === 'thunder') {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i, left: r(0, 100), dur: r(0.5, 1.0), del: r(0, 1.8),
    }))
  }
  return []
}

// ── Particle renderer ──────────────────────────────────────────────────────
function Particles({ animType, particles }) {
  if (animType === 'sunny') {
    return (
      <>
        {/* Outer glow ring */}
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full anim-sun-glow"
          style={{ background: 'radial-gradient(circle, rgba(255,230,80,.55) 0%, rgba(255,180,0,.25) 50%, transparent 70%)' }}
        />
        {/* Inner core */}
        <div
          className="absolute -top-6 -right-6 w-20 h-20 rounded-full anim-sun-pulse"
          style={{ background: 'radial-gradient(circle, rgba(255,240,120,.8) 0%, rgba(255,200,50,.4) 55%, transparent 75%)' }}
        />
      </>
    )
  }

  if (animType === 'noon') {
    return (
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full anim-sun-pulse"
        style={{ background: 'radial-gradient(circle, rgba(255,240,100,.6) 0%, rgba(255,200,0,.25) 50%, transparent 70%)' }}
      />
    )
  }

  if (animType === 'stars') {
    return particles.map(p => (
      <div
        key={p.id}
        className="absolute rounded-full bg-white anim-twinkle"
        style={{
          left: `${p.left}%`, top: `${p.top}%`,
          width: p.size, height: p.size,
          '--dur': `${p.dur}s`, '--del': `${p.del}s`,
        }}
      />
    ))
  }

  if (animType === 'rain' || animType === 'drizzle') {
    return particles.map(p => (
      <div
        key={p.id}
        className="absolute anim-rain"
        style={{
          left: `${p.left}%`, top: '-16px',
          width: '1.5px', height: '13px',
          background: `rgba(180,215,255,${p.opacity})`,
          '--dur': `${p.dur}s`, '--del': `${p.del}s`,
        }}
      />
    ))
  }

  if (animType === 'snow') {
    return particles.map(p => (
      <div
        key={p.id}
        className="absolute rounded-full bg-white anim-snow"
        style={{
          left: `${p.left}%`, top: '-10px',
          width: p.size, height: p.size, opacity: 0.85,
          '--dur': `${p.dur}s`, '--del': `${p.del}s`,
        }}
      />
    ))
  }

  if (animType === 'thunder') {
    return (
      <>
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute anim-rain"
            style={{
              left: `${p.left}%`, top: '-16px',
              width: '1.5px', height: '12px',
              background: 'rgba(180,215,255,0.5)',
              '--dur': `${p.dur}s`, '--del': `${p.del}s`,
            }}
          />
        ))}
        {/* Lightning flash overlay */}
        <div
          className="absolute inset-0 anim-lightning"
          style={{ background: 'rgba(255,255,255,0.65)', '--dur': '5s', '--del': '0s' }}
        />
        <div
          className="absolute inset-0 anim-lightning"
          style={{ background: 'rgba(255,255,255,0.5)', '--dur': '7s', '--del': '2.3s' }}
        />
      </>
    )
  }

  if (animType === 'fog') {
    return (
      <>
        <div
          className="absolute inset-0 anim-fog"
          style={{ background: 'rgba(210,210,220,0.18)', filter: 'blur(5px)', '--dur': '9s', '--del': '0s' }}
        />
        <div
          className="absolute inset-0 anim-fog"
          style={{ background: 'rgba(210,210,220,0.14)', filter: 'blur(8px)', '--dur': '11s', '--del': '4s' }}
        />
      </>
    )
  }

  return null
}

// ── Single clock card ──────────────────────────────────────────────────────
function ClockCard({ user, accentColor }) {
  const [now, setNow] = useState(new Date())
  const weather = useWeather(user?.latitude, user?.longitude)

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Derive everything needed for animType before useMemo — using safe defaults when user is null
  const tz      = user?.timezone || 'UTC'
  const hour    = user ? parseInt(formatInTimeZone(now, tz, 'H')) : 12
  const theme   = getTimeTheme(hour)
  const isNight = theme.period === 'night' || theme.period === 'dusk'
  const meta    = weather ? weatherMeta(weather.code, isNight) : null
  const animType  = meta?.anim ?? (isNight ? 'stars' : 'sunny')

  // useMemo must be called unconditionally — before any early return
  const particles = useMemo(() => genParticles(animType), [animType]) // eslint-disable-line

  if (!user) {
    return (
      <div className="flex-1 rounded-2xl p-5 bg-gray-50 border border-gray-100 flex items-center justify-center min-h-[220px]">
        <p className="text-gray-300">—</p>
      </div>
    )
  }

  const time    = formatInTimeZone(now, tz, 'HH:mm:ss')
  const dateStr = formatInTimeZone(now, tz, 'EEE, d MMM')
  const city    = user.city || tz.split('/').pop().replace(/_/g, ' ')
  const moon    = getMoonPhase(now)

  const uvBadge = weather ? uvInfo(weather.uv)   : null
  const aqBadge = weather ? aqiInfo(weather.aqi) : null
  const sunProg = weather ? getSunProgress(weather.sunrise, weather.sunset, now, tz) : null

  // Text palette
  const T  = theme.light ? 'text-white'        : 'text-slate-800'
  const TM = theme.light ? 'text-white/70'     : 'text-slate-500'
  const TF = theme.light ? 'text-white/45'     : 'text-slate-400'
  const D  = theme.light ? 'border-white/20'   : 'border-slate-300/40'
  const trackBg  = theme.light ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'
  const trackFill = 'linear-gradient(90deg, #ffd60a, #f8961e)'

  return (
    <div
      className="flex-1 rounded-2xl overflow-hidden relative shadow-md"
      style={{ background: theme.bg }}
    >
      {/* Animated background layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Particles animType={animType} particles={particles} />
      </div>

      {/* Content */}
      <div className={`relative z-10 px-3 py-4 flex flex-col items-center gap-1 ${T}`}>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg mb-0.5"
          style={{ backgroundColor: accentColor }}
        >
          {(user.display_name || '?')[0].toUpperCase()}
        </div>

        {/* Name */}
        <p className={`text-xs font-bold tracking-wider uppercase ${TM}`}>{user.display_name}</p>

        {/* Clock */}
        <p className="text-3xl font-mono font-bold tracking-tight leading-none mt-0.5">{time}</p>
        <p className={`text-xs ${TM}`}>{dateStr}</p>
        <p className={`text-xs ${TF}`}>{city}</p>

        <div className={`w-full border-t ${D} mt-1 mb-0.5`} />

        {/* ── Weather section ── */}
        {meta ? (
          <>
            {/* Big weather icon + label */}
            <div className="flex flex-col items-center gap-0.5 my-0.5">
              <span
                className={`text-4xl leading-none ${
                  meta.anim === 'sunny' ? 'anim-sun-pulse'
                  : meta.anim === 'stars' ? 'anim-twinkle'
                  : 'anim-float'
                }`}
                style={{ '--dur': '2.5s', '--del': '0s' }}
              >
                {meta.emoji}
              </span>
              <p className={`text-xs font-semibold ${TM}`}>{meta.label}</p>
            </div>

            {/* Temperature */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold leading-none">{weather.temp}°C</span>
              <span className={`text-xs ${TF}`}>feels {weather.feelsLike}°</span>
            </div>

            {/* Sunrise → progress bar → Sunset */}
            {sunProg !== null && (
              <div className="w-full px-1 mt-1">
                <div className="flex justify-between mb-1">
                  <span className={`text-xs ${TF}`}>🌅 {fmtTime(weather.sunrise)}</span>
                  <span className={`text-xs ${TF}`}>🌇 {fmtTime(weather.sunset)}</span>
                </div>
                <div className="relative h-1.5 rounded-full overflow-visible" style={{ background: trackBg }}>
                  {/* Fill */}
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${sunProg * 100}%`, background: trackFill }}
                  />
                  {/* Sun dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full shadow-md"
                    style={{
                      left: `calc(${sunProg * 100}% - 7px)`,
                      background: '#ffd60a',
                      boxShadow: '0 0 6px 2px rgba(255,210,0,0.7)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* UV + AQI badges */}
            {(uvBadge || aqBadge) && (
              <div className="flex gap-1.5 flex-wrap justify-center mt-1">
                {uvBadge && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: uvBadge.bg, color: uvBadge.fg }}
                  >
                    ☀ UV {Math.round(weather.uv)} · {uvBadge.label}
                  </span>
                )}
                {aqBadge && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: aqBadge.bg, color: aqBadge.fg }}
                  >
                    💨 {weather.aqi} · {aqBadge.label}
                  </span>
                )}
              </div>
            )}
          </>
        ) : isNight ? (
          /* Night with no weather: show moon prominently */
          <div className="flex flex-col items-center gap-0.5 my-1">
            <span className="text-4xl anim-float">{moon.emoji}</span>
            <p className={`text-xs font-semibold ${TM}`}>{moon.name}</p>
            <p className={`text-xs ${TF}`}>{Math.round(moon.illum * 100)}% lit</p>
          </div>
        ) : (
          /* Day with no weather data yet */
          <p className={`text-xs text-center ${TF} my-1`}>Set city in Profile{'\n'}to see weather</p>
        )}

        <div className={`w-full border-t ${D} mt-1 mb-0.5`} />

        {/* Moon phase footer (always shown) */}
        <div className={`flex items-center gap-1.5 text-xs ${TF}`}>
          <span>{moon.emoji}</span>
          <span>{moon.name}</span>
          <span className={TF}>· {Math.round(moon.illum * 100)}%</span>
        </div>
      </div>
    </div>
  )
}

// ── Export ─────────────────────────────────────────────────────────────────
export default function DualClock({ meUser, partnerUser }) {
  return (
    <div className="flex gap-3 items-start">
      <ClockCard user={meUser}      accentColor="#7F77DD" />
      <ClockCard user={partnerUser} accentColor="#D85A30" />
    </div>
  )
}
