import { useState, useEffect } from 'react'
import { getCheckIns } from '../api/checkins'
import { useAuthStore } from '../store/authStore'
import CheckInCard from '../components/CheckInCard'
import HistoryMap from '../components/HistoryMap'
import { format, isToday, isYesterday } from 'date-fns'

function groupByDate(checkins) {
  const groups = {}
  checkins.forEach((c) => {
    const date = new Date(c.checked_in_at)
    let label
    if (isToday(date)) label = 'Today'
    else if (isYesterday(date)) label = 'Yesterday'
    else label = format(date, 'EEEE, d MMM')
    if (!groups[label]) groups[label] = []
    groups[label].push(c)
  })
  return groups
}

export default function HistoryPage() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState('timeline')
  const [filter, setFilter] = useState('all')
  const [checkins, setCheckins] = useState([])
  const [nextUrl, setNextUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchCheckins = async (append = false) => {
    setLoading(true)
    try {
      const params = {}
      if (filter !== 'all') params.user = filter
      const res = await getCheckIns(params)
      const data = res.data
      setCheckins(append ? (prev) => [...prev, ...data.results] : data.results)
      setNextUrl(data.next)
    } catch (err) {
      console.error('Failed to fetch check-ins', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'timeline') fetchCheckins()
  }, [filter, tab])

  const grouped = groupByDate(checkins)

  const isMe = (checkin) => checkin.user?.username === user?.username

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-lg mx-auto">
        <div className="px-4 pt-6 pb-2">
          <h1 className="text-xl font-bold text-gray-800 mb-4">History</h1>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab('timeline')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === 'timeline' ? 'bg-primary text-white' : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setTab('map')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === 'map' ? 'bg-primary text-white' : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              Map
            </button>
          </div>
        </div>

        {tab === 'timeline' && (
          <div className="px-4">
            <div className="flex gap-2 mb-4">
              {['all', 'me', 'partner'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                    filter === f
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'me' ? 'Me' : 'Partner'}
                </button>
              ))}
            </div>

            <div className="space-y-6 pb-4">
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{date}</p>
                  <div className="space-y-3">
                    {items.map((c) => (
                      <CheckInCard key={c.id} checkin={c} isMe={isMe(c)} />
                    ))}
                  </div>
                </div>
              ))}

              {checkins.length === 0 && !loading && (
                <div className="text-center text-gray-400 py-12">No check-ins yet.</div>
              )}

              {nextUrl && (
                <button
                  onClick={() => fetchCheckins(true)}
                  disabled={loading}
                  className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'map' && <HistoryMap />}
      </div>
    </div>
  )
}
