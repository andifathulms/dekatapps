import { useEffect, useState } from 'react'
import { getMoods } from '../api/mood'
import { useAuthStore } from '../store/authStore'
import { format, subDays, parseISO } from 'date-fns'

const MOOD_COLORS = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#7F77DD',
}

const MOOD_LABELS = { 1: 'Very Bad', 2: 'Bad', 3: 'Okay', 4: 'Good', 5: 'Great' }

export default function MoodCalendar() {
  const user = useAuthStore((s) => s.user)
  const [moods, setMoods] = useState([])
  const [hoveredDay, setHoveredDay] = useState(null)

  useEffect(() => {
    getMoods().then((r) => setMoods(r.data)).catch(() => {})
  }, [])

  // Build a map: date -> { me, partner }
  const today = new Date()
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = subDays(today, 27 - i)
    return format(d, 'yyyy-MM-dd')
  })

  const moodMap = {}
  moods.forEach((m) => {
    if (!moodMap[m.date]) moodMap[m.date] = {}
    if (m.user?.username === user?.username) moodMap[m.date].me = m
    else moodMap[m.date].partner = m
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-600">Mood History (28 days)</p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Me
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent inline-block" /> Partner
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-xs text-gray-300 font-semibold pb-0.5">{d}</div>
        ))}
        {days.map((date) => {
          const entry = moodMap[date]
          const myMood = entry?.me
          const partnerMood = entry?.partner
          const isToday = date === format(today, 'yyyy-MM-dd')

          return (
            <div key={date} className="relative flex flex-col items-center"
              onMouseEnter={() => setHoveredDay(date)}
              onMouseLeave={() => setHoveredDay(null)}>
              <div className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 relative ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                style={{ backgroundColor: '#f5f5f4' }}>
                {myMood && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MOOD_COLORS[myMood.mood] }} />
                )}
                {partnerMood && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MOOD_COLORS[partnerMood.mood], opacity: 0.6 }} />
                )}
                {!myMood && !partnerMood && (
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                )}
              </div>

              {hoveredDay === date && (entry?.me || entry?.partner) && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap z-10 shadow-lg">
                  <p className="font-semibold mb-0.5">{format(parseISO(date), 'd MMM')}</p>
                  {myMood && <p>Me: {myMood.emoji} {MOOD_LABELS[myMood.mood]}</p>}
                  {partnerMood && <p>Partner: {partnerMood.emoji} {MOOD_LABELS[partnerMood.mood]}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
