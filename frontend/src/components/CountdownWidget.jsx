import { useState, useEffect } from 'react'
import { getMeetup, saveMeetup, deleteMeetup } from '../api/mood'
import { format } from 'date-fns'

export default function CountdownWidget() {
  const [meetup, setMeetup] = useState(null)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getMeetup().then((res) => setMeetup(res.data)).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!title.trim() || !date) return
    setLoading(true)
    try {
      const res = await saveMeetup({ title, date })
      setMeetup(res.data)
      setEditing(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    await deleteMeetup()
    setMeetup(null)
  }

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-600">Set Next Meetup</p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Finally together in Bali!"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={loading}
            className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-60">
            Save
          </button>
          <button onClick={() => setEditing(false)}
            className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-semibold">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (!meetup) {
    return (
      <button onClick={() => { setEditing(true); setTitle(''); setDate('') }}
        className="w-full bg-white rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-400 hover:border-primary hover:text-primary transition-colors">
        ✈️ Set a meetup countdown
      </button>
    )
  }

  const days = meetup.days_until
  const isPast = days < 0

  return (
    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-4 text-white relative">
      <button onClick={handleDelete}
        className="absolute top-3 right-3 text-white/50 hover:text-white text-lg leading-none">×</button>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-1">Next Meetup</p>
      <p className="font-bold text-base mb-2">{meetup.title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-black">{isPast ? 0 : days}</span>
        <span className="text-lg font-semibold text-white/80">
          {isPast ? 'days ago 🎉' : days === 0 ? 'Today! 🎉' : 'days to go ✈️'}
        </span>
      </div>
      <p className="text-xs text-white/60 mt-1">{format(new Date(meetup.date + 'T00:00:00'), 'EEEE, d MMMM yyyy')}</p>
      <button onClick={() => { setEditing(true); setTitle(meetup.title); setDate(meetup.date) }}
        className="mt-3 text-xs text-white/60 hover:text-white underline">Edit</button>
    </div>
  )
}
