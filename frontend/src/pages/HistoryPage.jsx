import { useState, useEffect } from 'react'
import { getCheckIns } from '../api/checkins'
import { useAuthStore } from '../store/authStore'
import CheckInCard from '../components/CheckInCard'
import HistoryMap from '../components/HistoryMap'
import { format, subDays, addDays, isToday, isYesterday, parseISO } from 'date-fns'

function toDateStr(d) {
  return format(d, 'yyyy-MM-dd')
}

function dayLabel(d) {
  if (isToday(d))     return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, d MMM yyyy')
}

export default function HistoryPage() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab]       = useState('timeline')
  const [filter, setFilter] = useState('all')
  const [date, setDate]     = useState(new Date())
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading]   = useState(false)

  const isMe = (c) => c.user?.username === user?.username

  const fetch = async (d, f) => {
    setLoading(true)
    try {
      const params = { date: toDateStr(d) }
      if (f !== 'all') params.user = f
      // Fetch all for this day (no pagination — days are naturally bounded)
      const res = await getCheckIns({ ...params, page_size: 200 })
      // API may return paginated or plain array
      const data = res.data
      setCheckins(Array.isArray(data) ? data : data.results ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'timeline') fetch(date, filter)
  }, [date, filter, tab])

  const goBack    = () => setDate(d => subDays(d, 1))
  const goForward = () => { if (!isToday(date)) setDate(d => addDays(d, 1)) }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-lg mx-auto">
        <div className="px-4 pt-6 pb-2">
          <h1 className="text-xl font-bold text-gray-800 mb-4">History</h1>

          {/* Tab switcher */}
          <div className="flex gap-2 mb-4">
            {['timeline', 'map'].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${
                  tab === t ? 'bg-primary text-white' : 'bg-white text-gray-500 border border-gray-200'
                }`}>
                {t === 'timeline' ? 'Timeline' : 'Map'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'timeline' && (
          <div className="px-4 space-y-4 pb-6">
            {/* Day navigator */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-3 py-2.5">
              <button
                onClick={goBack}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-500 text-lg transition-colors"
              >
                ‹
              </button>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-800">{dayLabel(date)}</p>
                {!isToday(date) && (
                  <p className="text-xs text-gray-400">{format(date, 'd MMM yyyy')}</p>
                )}
              </div>
              <button
                onClick={goForward}
                disabled={isToday(date)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-500 text-lg transition-colors disabled:opacity-25"
              >
                ›
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2">
              {['all', 'me', 'partner'].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                    filter === f ? 'bg-primary text-white' : 'bg-white text-gray-500 border border-gray-200'
                  }`}>
                  {f === 'all' ? 'All' : f === 'me' ? 'Me' : 'Partner'}
                </button>
              ))}
            </div>

            {/* Check-in list */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : checkins.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm">No check-ins on {dayLabel(date).toLowerCase()}</p>
                <button onClick={goBack} className="mt-3 text-xs text-primary font-semibold">
                  ← Go to previous day
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {checkins.map((c) => <CheckInCard key={c.id} checkin={c} isMe={isMe(c)} />)}
                <p className="text-center text-xs text-gray-300 pt-2">
                  {checkins.length} check-in{checkins.length !== 1 ? 's' : ''} on {dayLabel(date).toLowerCase()}
                </p>
              </div>
            )}
          </div>
        )}

        {tab === 'map' && <HistoryMap />}
      </div>
    </div>
  )
}
