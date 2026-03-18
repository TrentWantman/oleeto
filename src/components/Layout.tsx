import type { ReactNode } from 'react'
import type { View } from '../App'
import Sidebar from './Sidebar'
import TitleBar from './TitleBar'

interface Props {
  view: View
  onNavigate: (view: View) => void
  children: ReactNode
}

export default function Layout({ view, onNavigate, children }: Props) {
  return (
    <div className="flex flex-col h-screen">
      <TitleBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar active={view} onNavigate={onNavigate} />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
