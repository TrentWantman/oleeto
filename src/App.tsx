import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProblemList from './components/ProblemList'
import AddProblem from './components/AddProblem'
import Settings from './components/Settings'

export type View = 'dashboard' | 'problems' | 'add' | 'settings'

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey(k => k + 1)

  return (
    <Layout view={view} onNavigate={setView}>
      {view === 'dashboard' && <Dashboard key={refreshKey} />}
      {view === 'problems' && <ProblemList key={refreshKey} onRefresh={refresh} />}
      {view === 'add' && <AddProblem onAdded={() => { refresh(); setView('problems') }} />}
      {view === 'settings' && <Settings />}
    </Layout>
  )
}
