import { useEffect, useState } from 'react'
import type { Overview, HeatmapEntry, Problem } from '../types'
import Heatmap from './Heatmap'
import { Flame, Target, Calendar, TrendingUp, RotateCcw } from 'lucide-react'
import { formatDate } from '../date'

interface Props {
  onEdit?: (problem: Problem) => void
}

export default function Dashboard({ onEdit }: Props) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [endDate, setEndDate] = useState(new Date())
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([])
  const [review, setReview] = useState<Problem[]>([])

  useEffect(() => {
    window.api.stats.overview().then(setOverview)
    window.api.stats.review().then(setReview)
  }, [])

  useEffect(() => {
    const start = new Date(endDate)
    start.setFullYear(start.getFullYear() - 1)
    const startStr = formatDate(start)
    const endStr = formatDate(endDate)
    window.api.stats.heatmapRange(startStr, endStr).then(setHeatmap)
  }, [endDate])

  function shiftYear(delta: number) {
    const next = new Date(endDate)
    next.setFullYear(next.getFullYear() + delta)
    const today = new Date()
    if (next > today) {
      setEndDate(today)
    } else {
      setEndDate(next)
    }
  }

  if (!overview) return null

  const stats = [
    { label: 'Total Solved', value: overview.total, icon: Target },
    { label: 'Today', value: overview.today, icon: Calendar },
    { label: 'Day Streak', value: overview.streak, icon: Flame },
    { label: 'This Month', value: overview.month, icon: TrendingUp },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold text-gray-100">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-surface rounded-xl p-5 border border-border hover:border-neon/20 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <Icon size={16} className="text-neon" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-3xl font-semibold font-mono text-gray-100">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl p-6 border border-border">
        <Heatmap data={heatmap} endDate={endDate} onShift={shiftYear} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(['Easy', 'Medium', 'Hard'] as const).map(diff => (
          <div key={diff} className="bg-surface rounded-xl p-5 border border-border">
            <span className={`text-xs uppercase tracking-wider ${
              diff === 'Easy' ? 'text-green-400' :
              diff === 'Medium' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {diff}
            </span>
            <p className="text-2xl font-semibold font-mono text-gray-100 mt-2">
              {overview.byDifficulty[diff]}
            </p>
          </div>
        ))}
      </div>

      {review.length > 0 && (
        <div className="bg-surface rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <RotateCcw size={14} className="text-neon" />
            <h2 className="text-sm text-gray-500 uppercase tracking-wider">Due for Review</h2>
          </div>
          <div className="space-y-2">
            {review.map(p => {
              const days = Math.floor(
                (Date.now() - new Date(p.solved_at + 'T00:00:00').getTime()) / 86400000
              )
              return (
                <div
                  key={p.id}
                  onClick={() => onEdit?.(p)}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-neon/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-neon/50 text-sm">#{p.number}</span>
                    <span className="text-gray-300 text-sm">{p.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      p.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' :
                      p.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {p.difficulty}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">{days}d ago</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
