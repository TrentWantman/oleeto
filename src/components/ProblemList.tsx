import { useEffect, useState } from 'react'
import type { Problem } from '../types'
import { Trash2, Check, Upload, ExternalLink } from 'lucide-react'
import SyncButton from './SyncButton'

type Filter = 'all' | 'Easy' | 'Medium' | 'Hard'

interface Props {
  onRefresh: () => void
}

export default function ProblemList({ onRefresh }: Props) {
  const [problems, setProblems] = useState<Problem[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    window.api.problems.list().then(setProblems)
  }, [])

  const filtered = filter === 'all'
    ? problems
    : problems.filter(p => p.difficulty === filter)

  async function handleDelete(id: number) {
    await window.api.problems.delete(id)
    setProblems(prev => prev.filter(p => p.id !== id))
    onRefresh()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-100">Problems</h1>

        <div className="flex items-center gap-3">
          <SyncButton onSynced={() => window.api.problems.list().then(setProblems)} />

          <div className="flex gap-1 bg-surface rounded-lg p-1 border border-border">
            {(['all', 'Easy', 'Medium', 'Hard'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  filter === f
                    ? 'bg-neon/10 text-neon'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p className="font-mono">No problems yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(problem => (
            <div
              key={problem.id}
              className="bg-surface rounded-lg p-4 border border-border hover:border-neon/10 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-neon/60 text-sm w-12">
                    #{problem.number}
                  </span>

                  {problem.url ? (
                    <button
                      onClick={() => window.api.shell.openExternal(problem.url)}
                      className="text-gray-200 hover:text-neon transition-colors flex items-center gap-1.5"
                    >
                      {problem.title}
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-60" />
                    </button>
                  ) : (
                    <span className="text-gray-200">{problem.title}</span>
                  )}

                  <span className={`text-xs px-2 py-0.5 rounded ${
                    problem.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' :
                    problem.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {problem.difficulty}
                  </span>

                  {problem.topic && (
                    <span className="text-xs text-gray-500">{problem.topic}</span>
                  )}

                  <span className="text-xs text-gray-600 font-mono">{problem.language}</span>

                  {problem.time_complexity && (
                    <span className="text-[10px] text-gray-600 font-mono">
                      {problem.time_complexity}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {problem.synced ? (
                    <Check size={14} className="text-neon/40" />
                  ) : (
                    <Upload size={14} className="text-gray-600" />
                  )}
                  <span className="text-xs text-gray-600">{problem.solved_at}</span>
                  <button
                    onClick={() => handleDelete(problem.id)}
                    className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
