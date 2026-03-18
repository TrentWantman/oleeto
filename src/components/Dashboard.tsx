import { useEffect, useState } from 'react'
import type { Overview, HeatmapEntry } from '../types'
import Heatmap from './Heatmap'
import { Flame, Target, Calendar, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([])

  useEffect(() => {
    window.api.stats.overview().then(setOverview)
    window.api.stats.heatmap(new Date().getFullYear()).then(setHeatmap)
  }, [])

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
        <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Activity</h2>
        <Heatmap data={heatmap} />
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
    </div>
  )
}
