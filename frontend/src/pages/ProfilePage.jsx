import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate, Link } from 'react-router-dom'
import { getTodayMood, logMood } from '../api/mood'
import { updateMe } from '../api/auth'
import MoodCalendar from '../components/MoodCalendar'

const MOOD_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Very Bad' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🥰', label: 'Great' },
]

function MoodTracker() {
  const [todayMood, setTodayMood] = useState({ me: null, partner: null })
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res = await getTodayMood()
      setTodayMood(res.data)
      if (res.data.me) setSelected(res.data.me.mood)
    } catch (e) {}
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const option = MOOD_OPTIONS.find((o) => o.value === selected)
      await logMood({ mood: selected, emoji: option.emoji, note })
      await load()
      setNote('')
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-600">Today's Mood</p>
      <div className="flex justify-between">
        {MOOD_OPTIONS.map((o) => (
          <button key={o.value} onClick={() => !todayMood.me && setSelected(o.value)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              selected === o.value ? 'bg-primary/10 ring-2 ring-primary' : todayMood.me ? 'opacity-50' : 'hover:bg-gray-50'
            }`}>
            <span className="text-2xl">{o.emoji}</span>
            <span className="text-xs text-gray-400">{o.label}</span>
          </button>
        ))}
      </div>
      {!todayMood.me && selected && (
        <div className="space-y-2">
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-primary text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving...' : 'Log Mood'}
          </button>
        </div>
      )}
      {todayMood.partner && (
        <div className="flex items-center gap-2 bg-accent/5 rounded-xl px-3 py-2">
          <span className="text-lg">{todayMood.partner.emoji}</span>
          <div>
            <span className="text-xs text-gray-500 font-semibold">{todayMood.partner.user?.display_name}</span>
            <span className="text-xs text-gray-400 ml-1">
              is feeling {MOOD_OPTIONS.find(o => o.value === todayMood.partner.mood)?.label?.toLowerCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const avatarRef = useRef()
  const [uploading, setUploading] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const res = await updateMe(fd)
      setUser(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const initial = (user?.display_name || user?.username || '?')[0].toUpperCase()

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">Profile</h1>

        {/* Avatar + identity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center gap-3">
          <button onClick={() => avatarRef.current?.click()} className="relative group">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                {initial}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
              <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100">
                {uploading ? '...' : '📷'}
              </span>
            </div>
          </button>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div className="text-center">
            <p className="text-xl font-bold text-gray-800">{user?.display_name}</p>
            <p className="text-sm text-gray-400">@{user?.username}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {user?.city && (
              <div className="bg-surface rounded-xl px-3 py-1.5 text-sm text-gray-500 flex items-center gap-1.5">
                <span>📍</span>
                <span>{user.city}</span>
              </div>
            )}
            <div className="bg-surface rounded-xl px-3 py-1.5 text-sm text-gray-500 flex items-center gap-1.5">
              <span>🕐</span>
              <span>{user?.timezone}</span>
            </div>
          </div>
        </div>

        <MoodTracker />

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <MoodCalendar />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
          <Link to="/history" className="flex items-center gap-3 px-5 py-4 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <span className="text-lg">📋</span>
            <span className="font-semibold">Check-in History</span>
            <span className="ml-auto text-gray-300">›</span>
          </Link>
          <Link to="/questions" className="flex items-center gap-3 px-5 py-4 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <span className="text-lg">💬</span>
            <span className="font-semibold">Question History</span>
            <span className="ml-auto text-gray-300">›</span>
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 text-red-500 hover:bg-red-50 transition-colors text-sm font-semibold">
            <span className="text-lg">👋</span>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
