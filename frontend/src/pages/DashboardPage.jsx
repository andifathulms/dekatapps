import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getLatest } from '../api/checkins'
import { getPartner } from '../api/auth'
import DualClock from '../components/DualClock'
import CheckInCard from '../components/CheckInCard'
import CheckInModal from '../components/CheckInModal'
import CountdownWidget from '../components/CountdownWidget'
import DailyQuestionWidget from '../components/DailyQuestionWidget'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [latest, setLatest] = useState({ me: null, partner: null })
  const [partner, setPartner] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    getPartner().then((res) => setPartner(res.data)).catch(() => {})
  }, [])

  const fetchLatest = async () => {
    try {
      const res = await getLatest()
      setLatest(res.data)
      // Update partner info from check-in data if richer
      if (res.data.partner?.user) setPartner(res.data.partner.user)
    } catch (err) {
      console.error('Failed to fetch latest check-ins', err)
    }
  }

  useEffect(() => {
    fetchLatest()
    const interval = setInterval(fetchLatest, 30000)
    return () => clearInterval(interval)
  }, [])

  const meUser = latest.me?.user || user

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-primary">Dekat</h1>
        </div>

        <DualClock meUser={meUser} partnerUser={partner} />

        <CountdownWidget />

        <DailyQuestionWidget />

        <button
          onClick={() => setModalOpen(true)}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-2xl transition-colors text-base shadow-sm"
        >
          📍 Check In Now
        </button>

        <div className="space-y-3">
          {partner && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 px-1">
                {partner.display_name}'s Last Check-in
              </p>
              <CheckInCard checkin={latest.partner} isMe={false} />
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1 px-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">My Last Check-in</p>
              <Link to="/history" className="text-xs text-primary font-semibold">View history →</Link>
            </div>
            <CheckInCard checkin={latest.me} isMe={true} />
          </div>
        </div>
      </div>

      <CheckInModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchLatest}
      />
    </div>
  )
}
