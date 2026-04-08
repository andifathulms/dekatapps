import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTodayQuestion, answerQuestion, changeQuestion } from '../api/questions'

export default function DailyQuestionWidget() {
  const [question, setQuestion] = useState(null)
  const [answerText, setAnswerText] = useState('')
  const [customText, setCustomText] = useState('')
  const [editingQuestion, setEditingQuestion] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [changing, setChanging] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getTodayQuestion()
      setQuestion(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    if (!answerText.trim()) return
    setSubmitting(true)
    try {
      const res = await answerQuestion(answerText.trim())
      setQuestion(res.data)
      setAnswerText('')
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangeQuestion = async () => {
    if (!customText.trim()) return
    setChanging(true)
    try {
      const res = await changeQuestion(customText.trim())
      setQuestion(res.data)
      setEditingQuestion(false)
      setCustomText('')
    } catch (e) {
      console.error(e)
    } finally {
      setChanging(false)
    }
  }

  if (loading || !question) return null

  const { text, my_answer, partner_answer, can_change, is_custom } = question

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Daily Question</p>
          {is_custom && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Custom</span>}
        </div>
        <Link to="/questions" className="text-xs text-primary font-semibold">History →</Link>
      </div>

      {editingQuestion ? (
        <div className="space-y-2">
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Ask your partner something..."
            rows={2}
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleChangeQuestion} disabled={changing || !customText.trim()}
              className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-60">
              {changing ? 'Saving...' : 'Set Question'}
            </button>
            <button onClick={() => { setEditingQuestion(false); setCustomText('') }}
              className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-semibold">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-800 leading-snug">{text}</p>
          {can_change && (
            <button onClick={() => { setEditingQuestion(true); setCustomText(text) }}
              className="text-xs text-gray-400 hover:text-primary transition-colors">
              ✏️ Ask your own question
            </button>
          )}
        </div>
      )}

      {!editingQuestion && (
        <>
          {!my_answer ? (
            <div className="space-y-2">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Write your answer..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <button onClick={handleSubmit} disabled={submitting || !answerText.trim()}
                className="w-full bg-primary text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-60">
                {submitting ? 'Sending...' : 'Answer'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="bg-primary/5 rounded-xl p-3">
                <p className="text-xs font-semibold text-primary mb-1">You</p>
                <p className="text-sm text-gray-700">{my_answer.text}</p>
              </div>
              {partner_answer ? (
                <div className="bg-accent/5 rounded-xl p-3">
                  <p className="text-xs font-semibold text-accent mb-1">{partner_answer.user.display_name}</p>
                  <p className="text-sm text-gray-700">{partner_answer.text}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-1">Waiting for their answer... ✨</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
