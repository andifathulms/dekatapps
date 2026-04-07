import { useState, useEffect, useRef } from 'react'
import { getJournal, createEntry, deleteEntry, getMemories, uploadMemory, deleteMemory } from '../api/journal'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'

function JournalEntryCard({ entry, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {entry.photo && (
        <img src={entry.photo} alt="" className="w-full object-cover max-h-48" />
      )}
      <div className="p-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: entry.is_mine ? '#7F77DD' : '#D85A30' }}>
              {(entry.author.display_name || '?')[0]}
            </div>
            <span className="text-xs text-gray-500">{entry.author.display_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</span>
            {entry.is_mine && (
              <button onClick={() => onDelete(entry.id)} className="text-gray-300 hover:text-red-400 text-sm">×</button>
            )}
          </div>
        </div>
        <p className="font-bold text-gray-800 text-sm">{entry.title}</p>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{entry.body}</p>
      </div>
    </div>
  )
}

function MemoryCard({ memory, onDelete }) {
  return (
    <div className="relative aspect-square rounded-xl overflow-hidden group">
      <img src={memory.photo} alt={memory.caption} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex flex-col justify-end p-2">
        {memory.caption && (
          <p className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{memory.caption}</p>
        )}
      </div>
      {memory.is_mine && (
        <button onClick={() => onDelete(memory.id)}
          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          ×
        </button>
      )}
    </div>
  )
}

export default function JournalPage() {
  const [tab, setTab] = useState('journal')
  const [entries, setEntries] = useState([])
  const [memories, setMemories] = useState([])
  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [photo, setPhoto] = useState(null)
  const [saving, setSaving] = useState(false)
  const photoRef = useRef()
  const memoryRef = useRef()

  useEffect(() => {
    getJournal().then((r) => setEntries(r.data)).catch(() => {})
    getMemories().then((r) => setMemories(r.data)).catch(() => {})
  }, [])

  const handleSaveEntry = async () => {
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('body', body)
      if (photo) fd.append('photo', photo)
      const res = await createEntry(fd)
      setEntries((prev) => [res.data, ...prev])
      setComposing(false); setTitle(''); setBody(''); setPhoto(null)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleDeleteEntry = async (id) => {
    await deleteEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const handleUploadMemory = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const caption = window.prompt('Add a caption (optional):') || ''
    const fd = new FormData()
    fd.append('photo', file)
    fd.append('caption', caption)
    try {
      const res = await uploadMemory(fd)
      setMemories((prev) => [res.data, ...prev])
    } catch (err) { console.error(err) }
  }

  const handleDeleteMemory = async (id) => {
    await deleteMemory(id)
    setMemories((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">
            {tab === 'journal' ? '📔 Journal' : '🖼️ Memories'}
          </h1>
          {tab === 'journal' ? (
            <button onClick={() => setComposing(true)}
              className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl">
              Write
            </button>
          ) : (
            <button onClick={() => memoryRef.current?.click()}
              className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl">
              Upload
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {['journal', 'memories'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === t ? 'bg-primary text-white' : 'bg-white text-gray-500 border border-gray-200'
              }`}>
              {t === 'journal' ? '📔 Journal' : '🖼️ Memories'}
            </button>
          ))}
        </div>

        <input ref={memoryRef} type="file" accept="image/*" className="hidden" onChange={handleUploadMemory} />

        {tab === 'journal' && (
          <div className="space-y-3">
            {composing && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary" />
                <textarea value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder="What's on your mind?" rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                <div className="flex items-center gap-2">
                  <button onClick={() => photoRef.current?.click()} className="text-sm text-gray-400 hover:text-primary">
                    📷 {photo ? photo.name : 'Add photo'}
                  </button>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files[0])} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveEntry} disabled={saving || !title.trim() || !body.trim()}
                    className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setComposing(false); setTitle(''); setBody(''); setPhoto(null) }}
                    className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {entries.length === 0 && !composing && (
              <div className="text-center text-gray-300 py-16 text-sm">No entries yet. Write something!</div>
            )}
            {entries.map((e) => <JournalEntryCard key={e.id} entry={e} onDelete={handleDeleteEntry} />)}
          </div>
        )}

        {tab === 'memories' && (
          <div>
            {memories.length === 0 && (
              <div className="text-center text-gray-300 py-16 text-sm">No memories yet. Upload a photo!</div>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              {memories.map((m) => <MemoryCard key={m.id} memory={m} onDelete={handleDeleteMemory} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
