import { useEffect, useState } from 'react'

export default function Settings() {
  const [token, setToken] = useState('')
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      window.api.settings.get('github_token'),
      window.api.settings.get('github_owner'),
      window.api.settings.get('github_repo'),
    ]).then(([t, o, r]) => {
      if (t) setToken(t)
      if (o) setOwner(o)
      if (r) setRepo(r)
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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-100">Settings</h1>

      <div className="bg-surface rounded-xl p-6 border border-border space-y-5">
        <h2 className="text-sm text-gray-400 font-medium">GitHub Sync</h2>

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
