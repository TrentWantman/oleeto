import { useEffect, useState } from 'react'
import { themes, applyTheme, getTheme } from '../themes'

export default function Settings() {
  const [token, setToken] = useState('')
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [saved, setSaved] = useState(false)
  const [activeTheme, setActiveTheme] = useState('midnight')

  useEffect(() => {
    Promise.all([
      window.api.settings.get('github_token'),
      window.api.settings.get('github_owner'),
      window.api.settings.get('github_repo'),
      window.api.settings.get('theme'),
    ]).then(([t, o, r, th]) => {
      if (t) setToken(t)
      if (o) setOwner(o)
      if (r) setRepo(r)
      if (th) setActiveTheme(th)
    })
  }, [])

  async function handleSave() {
    await Promise.all([
      window.api.settings.set('github_token', token),
      window.api.settings.set('github_owner', owner),
      window.api.settings.set('github_repo', repo),
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function selectTheme(id: string) {
    setActiveTheme(id)
    applyTheme(getTheme(id))
    window.api.settings.set('theme', id)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-100">Settings</h1>

      <div className="bg-surface rounded-xl p-6 border border-border space-y-5">
        <h2 className="text-sm font-medium text-gray-500">GitHub Sync</h2>

        <Field label="Personal Access Token">
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="ghp_..."
            className="input-field font-mono text-sm"
          />
        </Field>

        <Field label="Repository Owner">
          <input
            type="text"
            value={owner}
            onChange={e => setOwner(e.target.value)}
            placeholder="username"
            className="input-field"
          />
        </Field>

        <Field label="Repository Name">
          <input
            type="text"
            value={repo}
            onChange={e => setRepo(e.target.value)}
            placeholder="leetcode-solutions"
            className="input-field"
          />
        </Field>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-neon/10 text-neon border border-neon/20 rounded-lg text-sm font-medium hover:bg-neon/20 hover:shadow-neon transition-all"
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="bg-surface rounded-xl p-6 border border-border space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Theme</h2>

        <div className="grid grid-cols-2 gap-3">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => selectTheme(theme.id)}
              className="rounded-lg p-3 text-left transition-all"
              style={{
                background: theme.bg,
                border: activeTheme === theme.id
                  ? `2px solid ${theme.accent}`
                  : `1px solid ${theme.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: theme.accent }} />
                <span className="text-xs font-medium" style={{ color: theme.text }}>{theme.name}</span>
              </div>
              <div className="flex gap-1">
                <div className="w-6 h-3 rounded-sm" style={{ background: theme.surface }} />
                <div className="w-6 h-3 rounded-sm" style={{ background: theme.surfaceRaised }} />
                <div className="w-6 h-3 rounded-sm" style={{ background: theme.border }} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  )
}
