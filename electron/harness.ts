export function extractMethodName(code: string, language: string): { name: string; isMethod: boolean } | null {
  if (language === 'Python') {
    const methodMatch = code.match(/def (\w+)\(self/)
    if (methodMatch) return { name: methodMatch[1], isMethod: true }
    const funcMatch = code.match(/def (\w+)\(/)
    if (funcMatch) return { name: funcMatch[1], isMethod: false }
  }
  if (language === 'JavaScript' || language === 'TypeScript') {
    const match = code.match(/var (\w+)\s*=\s*function/) || code.match(/(\w+)\s*=\s*function/)
    if (match) return { name: match[1], isMethod: false }
  }
  return null
}

export function wrapWithHarness(code: string, language: string): string | null {
  const info = extractMethodName(code, language)
  if (!info) return null

  if (language === 'Python') {
    const call = info.isMethod
      ? `Solution().${info.name}(*_args)`
      : `${info.name}(*_args)`

    return [
      'import json, sys',
      'from typing import List, Optional',
      '',
      code,
      '',
      '_input = sys.stdin.read().strip().split("\\n")',
      '_args = [json.loads(line) for line in _input if line]',
      `_result = ${call}`,
      'print(json.dumps(_result) if _result is not None else "null")',
    ].join('\n')
  }

  if (language === 'JavaScript' || language === 'TypeScript') {
    return [
      code,
      '',
      'const _lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n")',
      'const _args = _lines.filter(Boolean).map(l => JSON.parse(l))',
      `console.log(JSON.stringify(${info.name}(..._args)))`,
    ].join('\n')
  }

  return null
}
