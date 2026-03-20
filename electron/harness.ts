export function extractMethodName(code: string, language: string): string | null {
  if (language === 'Python') {
    const match = code.match(/def (\w+)\(self/)
    return match?.[1] ?? null
  }
  if (language === 'JavaScript' || language === 'TypeScript') {
    const match = code.match(/var (\w+)\s*=\s*function/) || code.match(/(\w+)\s*=\s*function/)
    return match?.[1] ?? null
  }
  return null
}

export function wrapWithHarness(code: string, language: string): string | null {
  const method = extractMethodName(code, language)
  if (!method) return null

  if (language === 'Python') {
    return [
      'import json, sys',
      'from typing import List, Optional',
      '',
      code,
      '',
      '_input = sys.stdin.read().strip().split("\\n")',
      '_args = [json.loads(line) for line in _input if line]',
      `_result = Solution().${method}(*_args)`,
      'print(json.dumps(_result) if _result is not None else "null")',
    ].join('\n')
  }

  if (language === 'JavaScript' || language === 'TypeScript') {
    return [
      code,
      '',
      'const _lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n")',
      'const _args = _lines.filter(Boolean).map(l => JSON.parse(l))',
      `console.log(JSON.stringify(${method}(..._args)))`,
    ].join('\n')
  }

  return null
}
