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

function guessTime(code: string): string {
  const loops = (code.match(/\b(for|while)\b/g) || []).length
  const hasSort = /\.sort\b|sorted\(|Arrays\.sort|sort\.Slice/i.test(code)
  const hasBinarySearch = /\b(lo|low|left)\b[\s\S]{0,300}\b(hi|high|right)\b[\s\S]{0,300}\bmid\b/i.test(code)
  const hasRecursion = /\bself\.\w+\(|\bdfs\(|\bhelper\(|\bsolve\(|\bbacktrack\(/i.test(code)
  const hasMemo = /\bmemo\b|\bcache\b|\bdp\[|\blru_cache|\b@cache/i.test(code)

  if (hasBinarySearch) return 'O(log n)'
  if (hasSort && loops <= 1) return 'O(n log n)'
  if (hasRecursion && hasMemo) return 'O(n)'
  if (hasRecursion && !hasMemo && loops === 0) return 'O(2^n)'
  if (loops === 0) return 'O(1)'
  if (loops === 1) return 'O(n)'
  if (loops === 2) return 'O(n^2)'
  return `O(n^${loops})`
}

function guessSpace(code: string): string {
  const has2D = /\[\s*\[|\bnew\s+\w+\[.*\]\[|vec!\s*\[.*vec!/i.test(code)
  const hasLinear = /\bdict\(|\bMap\(|\bSet\(|\bset\(|\bHashMap|\bHashSet|\bdefaultdict|\bCounter|\bArrayList|\bvector<|\bVec::new|\bmake\(\[\]|\bnew Array/i.test(code)
  const hasRecursion = /\bself\.\w+\(|\bdfs\(|\bhelper\(|\bsolve\(|\bbacktrack\(/i.test(code)

  if (has2D) return 'O(n^2)'
  if (hasLinear || hasRecursion) return 'O(n)'
  return 'O(1)'
}
