import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import type { Problem, NewProblem } from '../types'
import { analyzeComplexity } from '../analyze'
import { Play, Save, Loader2 } from 'lucide-react'

const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Java',
  'C++', 'C', 'Go', 'Rust', 'C#', 'Ruby', 'Swift', 'Kotlin',
]

const TOPICS = [
  'Array', 'String', 'Hash Table', 'Two Pointers', 'Binary Search',
  'Linked List', 'Tree', 'Graph', 'Dynamic Programming', 'Backtracking',
  'Stack', 'Queue', 'Heap', 'Greedy', 'Sliding Window',
  'Math', 'Bit Manipulation', 'Sorting', 'Recursion',
  'Trie', 'Union Find', 'Design',
]

const MONACO_LANG: Record<string, string> = {
  Python: 'python', JavaScript: 'javascript', TypeScript: 'typescript',
  Java: 'java', 'C++': 'cpp', C: 'c', Go: 'go', Rust: 'rust',
  'C#': 'csharp', Ruby: 'ruby', Swift: 'swift', Kotlin: 'kotlin',
}

const EDITOR_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '00ff41' },
    { token: 'string', foreground: '00cc33' },
    { token: 'number', foreground: '00ff41' },
    { token: 'comment', foreground: '3a3a3a', fontStyle: 'italic' },
    { token: 'type', foreground: '00cc33' },
  ],
  colors: {
    'editor.background': '#0d0d0d',
    'editor.foreground': '#e0e0e0',
    'editor.lineHighlightBackground': '#111111',
    'editor.selectionBackground': '#0a3d0a',
    'editorCursor.foreground': '#00ff41',
    'editorLineNumber.foreground': '#2a4a2a',
    'editorLineNumber.activeForeground': '#00ff41',
    'editor.selectionHighlightBackground': '#0a3d0a44',
    'editorWidget.background': '#111111',
    'editorWidget.border': '#1f2f1f',
    'input.background': '#1a1a1a',
    'input.border': '#1f2f1f',
    'dropdown.background': '#111111',
    'dropdown.border': '#1f2f1f',
  },
}

interface Props {
  problem?: Problem | null
  onSaved: () => void
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export default function AddProblem({ problem, onSaved }: Props) {
  const isEditing = !!problem

  const [number, setNumber] = useState(problem?.number ?? 0)
  const [title, setTitle] = useState(problem?.title ?? '')
  const [url, setUrl] = useState(problem?.url ?? '')
  const [difficulty, setDifficulty] = useState<NewProblem['difficulty']>(problem?.difficulty ?? 'Easy')
  const [topic, setTopic] = useState(problem?.topic ?? '')
  const [language, setLanguage] = useState(problem?.language ?? 'Python')
  const [solution, setSolution] = useState(problem?.solution ?? '')
  const [notes, setNotes] = useState(problem?.notes ?? '')
  const [solvedAt, setSolvedAt] = useState(problem?.solved_at ?? today())
  const [timeComplexity, setTimeComplexity] = useState(problem?.time_complexity ?? '')
  const [spaceComplexity, setSpaceComplexity] = useState(problem?.space_complexity ?? '')
  const [personalDifficulty, setPersonalDifficulty] = useState(problem?.personal_difficulty ?? 0)
  const [output, setOutput] = useState<{ stdout: string; stderr: string } | null>(null)
  const [running, setRunning] = useState(false)

  const manualTime = useRef(isEditing)
  const manualSpace = useRef(isEditing)
  const fetchedSlug = useRef('')

  useEffect(() => {
    if (!solution.trim()) return
    const timer = setTimeout(() => {
      const result = analyzeComplexity(solution)
      if (!manualTime.current) setTimeComplexity(result.time)
      if (!manualSpace.current) setSpaceComplexity(result.space)
    }, 500)
    return () => clearTimeout(timer)
  }, [solution])

  useEffect(() => {
    const match = url.match(/leetcode\.com\/problems\/([^/]+)/)
    if (!match) return
    const slug = match[1]
    if (slug === fetchedSlug.current) return
    fetchedSlug.current = slug

    window.api.leetcode.fetch(slug).then(q => {
      if (!q) return
      setNumber(n => n || parseInt(q.questionFrontendId))
      setTitle(t => t || q.title)
      setDifficulty(q.difficulty)
      setTopic(t => t || (q.topicTags[0]?.name ?? ''))
    })
  }, [url])

  async function handleRun() {
    if (!solution.trim()) return
    setRunning(true)
    setOutput(null)
    try {
      const result = await window.api.code.run(solution, language)
      setOutput({ stdout: result.stdout, stderr: result.stderr })
    } catch {
      setOutput({ stdout: '', stderr: 'Failed to run' })
    }
    setRunning(false)
  }

  async function handleSave() {
    if (!title || !solution.trim() || number === 0) return

    const data = {
      number, title, difficulty, language, solution, notes,
      url, topic, timeComplexity, spaceComplexity, personalDifficulty, solvedAt,
    }

    if (isEditing) {
      await window.api.problems.update(problem.id, data)
    } else {
      await window.api.problems.add(data)
    }

    onSaved()
  }

  const handleRunRef = useRef(handleRun)
  const handleSaveRef = useRef(handleSave)
  handleRunRef.current = handleRun
  handleSaveRef.current = handleSave

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleRunRef.current()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col gap-3">
      <div className="flex gap-3 shrink-0">
        <input
          type="number"
          value={number || ''}
          onChange={e => setNumber(parseInt(e.target.value) || 0)}
          placeholder="#"
          className="w-20 input-field font-mono"
        />
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Problem title"
          className="flex-1 input-field"
        />
        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value as NewProblem['difficulty'])}
          className="w-28 input-field"
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <div className="flex gap-3 shrink-0">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://leetcode.com/problems/..."
          className="flex-1 input-field font-mono text-sm"
        />
        <select
          value={topic}
          onChange={e => setTopic(e.target.value)}
          className="w-44 input-field"
        >
          <option value="">Topic</option>
          {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="w-32 input-field"
        >
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <input
          type="date"
          value={solvedAt}
          onChange={e => setSolvedAt(e.target.value)}
          className="w-40 input-field"
        />
      </div>

      <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border">
        <Editor
          language={MONACO_LANG[language] || 'plaintext'}
          value={solution}
          onChange={v => setSolution(v || '')}
          theme="oleeto"
          beforeMount={monaco => {
            monaco.editor.defineTheme('oleeto', EDITOR_THEME)
          }}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            tabSize: 4,
          }}
        />
      </div>

      {output && (
        <div className="max-h-40 shrink-0 bg-surface rounded-lg border border-border overflow-y-auto">
          <div className="flex justify-between items-center px-3 pt-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Output</span>
            <button
              onClick={() => setOutput(null)}
              className="text-[10px] text-gray-600 hover:text-gray-400"
            >
              Close
            </button>
          </div>
          <pre className="px-3 pb-3 pt-1 text-xs font-mono whitespace-pre-wrap">
            {output.stdout && <span className="text-gray-300">{output.stdout}</span>}
            {output.stderr && <span className="text-red-400">{output.stderr}</span>}
          </pre>
        </div>
      )}

      <div className="flex items-center justify-between shrink-0 pb-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 uppercase">Time</span>
            <input
              value={timeComplexity}
              onChange={e => { setTimeComplexity(e.target.value); manualTime.current = true }}
              placeholder="O(?)"
              className="w-24 bg-surface-raised border border-border rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:border-neon/30 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 uppercase">Space</span>
            <input
              value={spaceComplexity}
              onChange={e => { setSpaceComplexity(e.target.value); manualSpace.current = true }}
              placeholder="O(?)"
              className="w-24 bg-surface-raised border border-border rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:border-neon/30 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 uppercase">Effort</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPersonalDifficulty(personalDifficulty === n ? 0 : n)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    n <= personalDifficulty
                      ? 'bg-neon shadow-[0_0_4px_rgba(0,255,65,0.4)]'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes..."
            className="w-44 bg-surface-raised border border-border rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-neon/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600 mr-1">
            {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter run / +S save
          </span>
          <button
            onClick={handleRun}
            disabled={running || !solution.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:border-neon/20 hover:text-neon transition-all disabled:opacity-40"
          >
            {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            Run
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-neon/10 text-neon border border-neon/20 rounded-lg font-medium hover:bg-neon/20 hover:shadow-neon transition-all"
          >
            <Save size={12} />
            {isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
