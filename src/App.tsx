import { useState } from 'react'
import type { Problem } from './types'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProblemList from './components/ProblemList'
import AddProblem from './components/AddProblem'
import Settings from './components/Settings'

export type View = 'dashboard' | 'problems' | 'add' | 'settings'

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editing, setEditing] = useState<Problem | null>(null)

  const refresh = () => setRefreshKey(k => k + 1)

  function navigate(v: View) {
    if (v === 'add') setEditing(null)
    setView(v)
  }

  function openEditor(problem: Problem) {
    setEditing(problem)
    setView('add')
  }

  function onSaved() {
    setEditing(null)
    refresh()
    setView('problems')
  }

  return (
    <Layout view={view} onNavigate={navigate}>
      {view === 'dashboard' && <Dashboard key={refreshKey} />}
      {view === 'problems' && (
        <ProblemList
          key={refreshKey}
          onRefresh={refresh}
          onEdit={openEditor}
          onNavigate={navigate}
        />
      )}
      {view === 'add' && (
        <AddProblem
          key={editing?.id ?? 'new'}
          problem={editing}
          onSaved={onSaved}
        />
      )}
      {view === 'settings' && <Settings />}
    </Layout>
  )
}
