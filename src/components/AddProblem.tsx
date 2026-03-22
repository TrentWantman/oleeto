import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type { Problem, NewProblem } from '../types'
import { analyzeComplexity } from '../analyze'
import { getCurrentTheme, isLightTheme } from '../themes'
import { Play, Save, Loader2, StickyNote, ArrowLeft } from 'lucide-react'

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

function buildEditorTheme(): editor.IStandaloneThemeData {
  const t = getCurrentTheme()
  const light = isLightTheme(t)
  return {
    base: light ? 'vs' : 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: t.accent.slice(1) },
      { token: 'comment', foreground: t.textDim.slice(1), fontStyle: 'italic' },
    ],
    colors: {
      'editor.background': t.bg,
      'editor.foreground': t.text,
      'editor.lineHighlightBackground': t.surfaceRaised,
      'editor.selectionBackground': t.accent + '30',
      'editorCursor.foreground': t.accent,
      'editorLineNumber.foreground': t.textDim,
      'editorLineNumber.activeForeground': t.accent,
      'editor.selectionHighlightBackground': t.accent + '15',
      'editorWidget.background': t.surface,
      'editorWidget.border': t.border,
      'input.background': t.surfaceRaised,
      'input.border': t.border,
      'dropdown.background': t.surface,
      'dropdown.border': t.border,
    },
  }
}

interface Props {
  problem?: Problem | null
  onSaved: () => void
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  const [notesOpen, setNotesOpen] = useState(false)
  const [testCases, setTestCases] = useState<string[]>([])
  const [activeTest, setActiveTest] = useState(0)
  const [testInput, setTestInput] = useState('')

  const themeCleanup = useRef<(() => void) | null>(null)
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
      if (q.exampleTestcaseList?.length) {
        setTestCases(q.exampleTestcaseList)
        setTestInput(q.exampleTestcaseList[0])
        setActiveTest(0)
      }
    })
  }, [url])

  async function handleRun() {
    if (!solution.trim()) return
    setRunning(true)
    setOutput(null)
    try {
      const input = testInput.trim() || undefined
      const result = await window.api.code.run(solution, language, input)
      setOutput({ stdout: result.stdout, stderr: result.stderr })
    } catch {
      setOutput({ stdout: '', stderr: 'Failed to run' })
    }
    setRunning(false)
  }

  function hasChanges(): boolean {
    if (!problem) return true
    return number !== problem.number
      || title !== problem.title
      || difficulty !== problem.difficulty
      || language !== problem.language
      || solution !== problem.solution
      || notes !== problem.notes
      || url !== problem.url
      || topic !== problem.topic
      || timeComplexity !== problem.time_complexity
      || spaceComplexity !== problem.space_complexity
      || personalDifficulty !== problem.personal_difficulty
      || solvedAt !== problem.solved_at
  }

  async function handleSave() {
    if (!title || !solution.trim() || number === 0) return

    const data = {
      number, title, difficulty, language, solution, notes,
      url, topic, timeComplexity, spaceComplexity, personalDifficulty, solvedAt,
    }

    if (isEditing) {
      if (!hasChanges()) { onSaved(); return }
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
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (themeCleanup.current) themeCleanup.current()
    }
  }, [])

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col gap-3">
      <div className="flex gap-3 shrink-0">
        <input
          type="number"
          value={number || ''}
          onChange={e => setNumber(parseInt(e.target.value) || 0)}
          placeholder="#"
          className="w-32 input-field font-mono shrink-0"
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
          className="w-24 input-field appearance-none"
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
          className="w-44 input-field appearance-none"
        >
          <option value="">Topic</option>
          {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="w-32 input-field appearance-none"
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

      <div className="flex-1 min-h-0 flex gap-3">
        <div className={`${notesOpen ? 'w-1/2' : 'w-full'} rounded-lg overflow-hidden border border-border transition-all`}>
          <Editor
            language={MONACO_LANG[language] || 'plaintext'}
            value={solution}
            onChange={v => setSolution(v || '')}
            theme="oleeto"
            beforeMount={monaco => {
              monaco.editor.defineTheme('oleeto', buildEditorTheme())
            }}
            onMount={(_, monaco) => {
              if (themeCleanup.current) themeCleanup.current()
              const update = () => {
                monaco.editor.defineTheme('oleeto', buildEditorTheme())
                monaco.editor.setTheme('oleeto')
              }
              window.addEventListener('theme-change', update)
              themeCleanup.current = () => window.removeEventListener('theme-change', update)
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

        {notesOpen && (
          <div className="w-1/2 flex flex-col rounded-lg border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Notes</span>
              <button
                onClick={() => setNotesOpen(false)}
                className="text-neon hover:text-neon-dim transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Write your notes here..."
              autoFocus
              className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-300 placeholder-gray-700 resize-none focus:outline-none font-mono"
            />
          </div>
        )}
      </div>

      {(testCases.length > 0 || output) && (
        <div className="max-h-48 shrink-0 bg-surface rounded-lg border border-border overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-3 pt-2 pb-1 shrink-0">
            {testCases.length > 0 && (
              <div className="flex gap-1">
                {testCases.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveTest(i); setTestInput(testCases[i]) }}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                      activeTest === i
                        ? 'bg-neon/10 text-neon'
                        : 'text-gray-600 hover:text-gray-400'
                    }`}
                  >
                    Test {i + 1}
                  </button>
                ))}
              </div>
            )}
            {output && (
              <span className="text-[10px] text-gray-500 uppercase tracking-wider ml-auto">Output</span>
            )}
          </div>
          <div className="flex flex-1 min-h-0">
            {testCases.length > 0 && (
              <textarea
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                className="w-1/2 bg-transparent px-3 pb-2 text-xs font-mono text-gray-300 resize-none focus:outline-none border-r border-border"
              />
            )}
            <pre className={`${testCases.length > 0 ? 'w-1/2' : 'w-full'} px-3 pb-2 text-xs font-mono whitespace-pre-wrap overflow-y-auto`}>
              {output?.stdout && <span className="text-gray-300">{output.stdout}</span>}
              {output?.stderr && <span className="text-red-400">{output.stderr}</span>}
              {!output && <span className="text-gray-700">Run to see output</span>}
            </pre>
          </div>
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
                      ? 'bg-neon shadow-neon'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
              notesOpen ? 'text-neon' : notes ? 'text-gray-400' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            <StickyNote size={12} />
            Notes{notes ? ' *' : ''}
          </button>
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
