import { useState, useEffect, useRef } from 'react'
import { getLetters, sendLetter, markLetterRead } from '../api/letters'
import { useAuthStore } from '../store/authStore'
import { useUnreadStore } from '../store/unreadStore'
import { formatDistanceToNow } from 'date-fns'

function LetterCard({ letter, onRead }) {
  const isUnread = !letter.is_mine && !letter.read_at

  useEffect(() => {
    if (isUnread) onRead(letter.id)
  }, [letter.id])

  return (
    <div className={`bg-white rounded-2xl border p-4 space-y-2 ${isUnread ? 'border-accent/40' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: letter.is_mine ? '#7F77DD' : '#D85A30' }}
          >
            {(letter.sender.display_name || '?')[0].toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-gray-700">{letter.sender.display_name}</span>
          {isUnread && <span className="text-xs bg-accent text-white px-1.5 py-0.5 rounded-full">New</span>}
        </div>
        <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(letter.sent_at), { addSuffix: true })}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{letter.body}</p>
      {letter.photo && (
        <img src={letter.photo} alt="letter attachment" className="rounded-xl w-full object-cover max-h-60" />
      )}
    </div>
  )
}

export default function LettersPage() {
  const user = useAuthStore((s) => s.user)
  const { clear: clearUnread } = useUnreadStore()
  const [letters, setLetters] = useState([])
  const [composing, setComposing] = useState(false)
  const [body, setBody] = useState('')
  const [photo, setPhoto] = useState(null)
  const [sending, setSending] = useState(false)
  const fileRef = useRef()

  useEffect(() => { clearUnread() }, [])

  const load = async () => {
    try {
      const res = await getLetters()
      setLetters(res.data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { load() }, [])

  const handleSend = async () => {
    if (!body.trim()) return
    setSending(true)
    try {
      const fd = new FormData()
      fd.append('body', body)
      if (photo) fd.append('photo', photo)
      await sendLetter(fd)
      setBody('')
      setPhoto(null)
      setComposing(false)
      await load()
    } catch (e) { console.error(e) }
    finally { setSending(false) }
  }

  const handleRead = async (id) => {
    try {
      const res = await markLetterRead(id)
      setLetters((prev) => prev.map((l) => l.id === id ? res.data : l))
    } catch (e) {}
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">💌 Love Letters</h1>
          <button
            onClick={() => setComposing(true)}
            className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl"
          >
            Write
          </button>
        </div>

        {composing && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 space-y-3">
            <p className="text-sm font-semibold text-gray-600">New Letter</p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Dear sayang..."
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()}
                className="text-sm text-gray-400 hover:text-primary transition-colors">
                📎 {photo ? photo.name : 'Attach photo'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => setPhoto(e.target.files[0])} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSend} disabled={sending || !body.trim()}
                className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-60">
                {sending ? 'Sending...' : '💌 Send'}
              </button>
              <button onClick={() => { setComposing(false); setBody(''); setPhoto(null) }}
                className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-semibold">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {letters.length === 0 && (
            <div className="text-center text-gray-300 py-16 text-sm">No letters yet. Write the first one!</div>
          )}
          {letters.map((l) => (
            <LetterCard key={l.id} letter={l} onRead={handleRead} />
          ))}
        </div>
      </div>
    </div>
  )
}
