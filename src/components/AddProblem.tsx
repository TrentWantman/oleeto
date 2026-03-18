import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import type { NewProblem } from '../types'
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
  onAdded: () => void
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export default function AddProblem({ onAdded }: Props) {
  const [number, setNumber] = useState(0)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [difficulty, setDifficulty] = useState<NewProblem['difficulty']>('Easy')
  const [topic, setTopic] = useState('')
  const [language, setLanguage] = useState('Python')
  const [solution, setSolution] = useState('')
  const [notes, setNotes] = useState('')
  const [solvedAt, setSolvedAt] = useState(today())
  const [timeComplexity, setTimeComplexity] = useState('')
  const [spaceComplexity, setSpaceComplexity] = useState('')
  const [output, setOutput] = useState<{ stdout: string; stderr: string } | null>(null)
  const [running, setRunning] = useState(false)

  const manualTime = useRef(false)
  const manualSpace = useRef(false)

  useEffect(() => {
    if (!solution.trim()) return
    const timer = setTimeout(() => {
      const result = analyzeComplexity(solution)
      if (!manualTime.current) setTimeComplexity(result.time)
      if (!manualSpace.current) setSpaceComplexity(result.space)
    }, 500)
    return () => clearTimeout(timer)
  }, [solution])

  async function handleRun() {
    if (!solution.trim()) return
    setRunning(true)
    setOutput(null)
    try {
      const result = await window.api.code.run(solution, language)
      setOutput({ stdout: result.stdout, stderr: result.stderr })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to run'
      setOutput({ stdout: '', stderr: msg })
    }
    setRunning(false)
  }

  async function handleSave() {
    if (!title || !solution.trim() || number === 0) return
    await window.api.problems.add({
      number, title, difficulty, language, solution, notes,
      url, topic, timeComplexity, spaceComplexity, solvedAt,
    })
    onAdded()
  }

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
        <div className="flex items-center gap-3">
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
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes..."
            className="w-52 bg-surface-raised border border-border rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-neon/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
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
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
