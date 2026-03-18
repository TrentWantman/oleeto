import { LayoutDashboard, List, Plus, Settings } from 'lucide-react'
import type { View } from '../App'

const nav: { view: View; icon: typeof LayoutDashboard; label: string }[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { view: 'problems', icon: List, label: 'Problems' },
  { view: 'add', icon: Plus, label: 'Add Solve' },
  { view: 'settings', icon: Settings, label: 'Settings' },
]

interface Props {
  active: View
  onNavigate: (view: View) => void
}

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside className="w-16 bg-surface flex flex-col items-center py-6 gap-2 border-r border-border">
      {nav.map(({ view, icon: Icon, label }) => (
        <button
          key={view}
          onClick={() => onNavigate(view)}
          title={label}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            active === view
              ? 'bg-neon/10 text-neon shadow-neon'
              : 'text-gray-500 hover:text-neon/70 hover:bg-neon/5'
          }`}
        >
          <Icon size={20} />
        </button>
      ))}
    </aside>
  )
}
