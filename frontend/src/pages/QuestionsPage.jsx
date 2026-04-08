import { useState, useEffect } from 'react'
import { getQuestionHistory } from '../api/questions'
import { format, parseISO } from 'date-fns'

function QuestionCard({ question }) {
  const { text, date, my_answer, partner_answer, both_answered, is_custom } = question

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {is_custom && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Custom</span>}
            <span className="text-xs text-gray-400">{format(parseISO(date), 'EEE, d MMM yyyy')}</span>
          </div>
          <p className="text-sm font-semibold text-gray-800 leading-snug">{text}</p>
        </div>
        {both_answered && <span className="text-lg flex-shrink-0">✅</span>}
      </div>

      {(my_answer || partner_answer) ? (
        <div className="space-y-2">
          {my_answer && (
            <div className="bg-primary/5 rounded-xl p-3">
              <p className="text-xs font-semibold text-primary mb-1">You</p>
              <p className="text-sm text-gray-700">{my_answer.text}</p>
            </div>
          )}
          {partner_answer && (
            <div className="bg-accent/5 rounded-xl p-3">
              <p className="text-xs font-semibold text-accent mb-1">{partner_answer.user.display_name}</p>
              <p className="text-sm text-gray-700">{partner_answer.text}</p>
            </div>
          )}
          {my_answer && !partner_answer && (
            <p className="text-xs text-gray-400 text-center">Waiting for their answer...</p>
          )}
          {!my_answer && (
            <p className="text-xs text-gray-400 text-center italic">You didn't answer this one.</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-300 text-center italic">No answers yet.</p>
      )}
    </div>
  )
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getQuestionHistory()
      .then((r) => setQuestions(r.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4">💬 Question History</h1>

        {loading && (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        )}

        <div className="space-y-3">
          {questions.map((q) => <QuestionCard key={q.id} question={q} />)}
          {!loading && questions.length === 0 && (
            <div className="text-center text-gray-300 py-16 text-sm">No questions yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
