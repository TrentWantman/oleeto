export function analyzeComplexity(code: string): { time: string; space: string } {
  const stripped = code
    .replace(/\/\/.*$/gm, '')
    .replace(/#.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')

  return {
    time: guessTime(stripped),
    space: guessSpace(stripped),
  }
}

function maxLoopDepth(code: string): number {
  const lines = code.split('\n')
  let max = 0
  let depth = 0
  const depthStack: number[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const indent = line.length - line.trimStart().length
    const isLoop = /^(for\s|for\(|while\s|while\()/.test(trimmed)

    while (depthStack.length > 0 && indent <= depthStack[depthStack.length - 1]) {
      depthStack.pop()
      depth--
    }

    if (isLoop) {
      depth++
      depthStack.push(indent)
      max = Math.max(max, depth)
    }
  }

  return max
}

function guessTime(code: string): string {
  const depth = maxLoopDepth(code)
  const hasSort = /\.sort\b|sorted\(|Arrays\.sort|sort\.Slice/i.test(code)
  const hasBinarySearch = /\b(lo|low|left)\b[\s\S]{0,300}\b(hi|high|right)\b[\s\S]{0,300}\bmid\b/i.test(code)
  const hasRecursion = /\bself\.\w+\(|\bdfs\(|\bhelper\(|\bsolve\(|\bbacktrack\(/i.test(code)
  const hasMemo = /\bmemo\b|\bcache\b|\bdp\[|\blru_cache|\b@cache/i.test(code)

  if (hasBinarySearch) return 'O(log n)'
  if (hasSort && depth <= 1) return 'O(n log n)'
  if (hasRecursion && hasMemo) return 'O(n)'
  if (hasRecursion && !hasMemo && depth === 0) return 'O(2^n)'
  if (depth === 0) return 'O(1)'
  if (depth === 1) return 'O(n)'
  if (depth === 2) return 'O(n^2)'
  return `O(n^${depth})`
}

function guessSpace(code: string): string {
  const has2D = /\[\s*\[|\bnew\s+\w+\[.*\]\[|vec!\s*\[.*vec!/i.test(code)
  const hasLinear = /\bdict\(|\bMap\(|\bSet\(|\bset\(|\bHashMap|\bHashSet|\bdefaultdict|\bCounter|\bArrayList|\bvector<|\bVec::new|\bmake\(\[\]|\bnew Array/i.test(code)
  const hasRecursion = /\bself\.\w+\(|\bdfs\(|\bhelper\(|\bsolve\(|\bbacktrack\(/i.test(code)

  if (has2D) return 'O(n^2)'
  if (hasLinear || hasRecursion) return 'O(n)'
  return 'O(1)'
}
