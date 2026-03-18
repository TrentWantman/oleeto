import { useState } from 'react'
import type { NewProblem } from '../types'

const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Java',
  'C++', 'C', 'Go', 'Rust', 'C#', 'Ruby', 'Swift', 'Kotlin',
]

interface Props {
  onAdded: () => void
}

export default function AddProblem({ onAdded }: Props) {
  const [form, setForm] = useState<NewProblem>({
    number: 0,
    title: '',
    difficulty: 'Easy',
    language: 'Python',
    solution: '',
    notes: '',
    solvedAt: new Date().toISOString().split('T')[0],
  })

  function update<K extends keyof NewProblem>(key: K, value: NewProblem[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.solution || form.number === 0) return
    await window.api.problems.add(form)
    onAdded()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-100">Add Solve</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Problem #">
            <input
              type="number"
              value={form.number || ''}
              onChange={e => update('number', parseInt(e.target.value) || 0)}
              placeholder="1"
              className="input-field font-mono"
            />
          </Field>
          <Field label="Title">
            <input
              type="text"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Two Sum"
              className="input-field"
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Difficulty">
            <select
              value={form.difficulty}
              onChange={e => update('difficulty', e.target.value as NewProblem['difficulty'])}
              className="input-field"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </Field>
          <Field label="Language">
            <select
              value={form.language}
              onChange={e => update('language', e.target.value)}
              className="input-field"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={form.solvedAt}
              onChange={e => update('solvedAt', e.target.value)}
              className="input-field"
            />
          </Field>
        </div>

        <Field label="Solution">
          <textarea
            value={form.solution}
            onChange={e => update('solution', e.target.value)}
            rows={12}
            placeholder="Paste your solution here..."
            className="input-field font-mono text-sm resize-none"
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            rows={3}
            placeholder="Optional notes..."
            className="input-field resize-none"
          />
        </Field>

        <button
          type="submit"
          className="w-full py-3 bg-neon/10 text-neon border border-neon/20 rounded-lg font-medium hover:bg-neon/20 hover:shadow-neon transition-all"
        >
          Save
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  )
}
