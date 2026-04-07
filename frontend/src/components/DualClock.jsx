import { useState, useEffect } from 'react'
import { formatInTimeZone } from 'date-fns-tz'

function ClockCard({ user, color }) {
  const [now, setNow] = useState(new Date())

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
  const tzShort = tz.split('/').pop().replace(/_/g, ' ')

  return (
    <div className={`flex-1 bg-white rounded-2xl p-4 border border-gray-100 text-center`}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-2"
        style={{ backgroundColor: color }}
      >
        {(user.display_name || '?')[0].toUpperCase()}
      </div>
      <p className="text-xs font-semibold text-gray-500 mb-1">{user.display_name}</p>
      <p className="text-2xl font-mono font-bold text-gray-800">{time}</p>
      <p className="text-xs text-gray-400 mt-1">{date}</p>
      <p className="text-xs text-gray-300 mt-0.5">{tzShort}</p>
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
