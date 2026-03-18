import { useState } from 'react'
import { Github, Loader2 } from 'lucide-react'

interface Props {
  onSynced: () => void
}

export default function SyncButton({ onSynced }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleSync() {
    setSyncing(true)
    setMessage('')
    setIsError(false)

    try {
      const result = await window.api.github.sync()
      setMessage(result.message)
      if (result.synced > 0) onSynced()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed'
      setMessage(msg)
      setIsError(true)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className={`text-xs ${isError ? 'text-red-400' : 'text-neon/60'}`}>
          {message}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:border-neon/20 hover:text-neon transition-all disabled:opacity-50"
      >
        {syncing ? <Loader2 size={14} className="animate-spin" /> : <Github size={14} />}
        Sync to GitHub
      </button>
    </div>
  )
}
