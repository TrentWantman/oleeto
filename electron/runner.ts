import { exec } from 'child_process'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import path from 'path'
import os from 'os'
import { wrapWithHarness, prependIncludes } from './harness'

const TIMEOUT = 10000

const EXT: Record<string, string> = {
  Python: '.py', JavaScript: '.js', TypeScript: '.ts',
  Java: '.java', 'C++': '.cpp', C: '.c', Go: '.go',
  Rust: '.rs', 'C#': '.cs', Ruby: '.rb', Swift: '.swift', Kotlin: '.kt',
}

export function runCode(
  code: string,
  language: string,
  testInput?: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise(resolve => {
    const ext = EXT[language]
    if (!ext) {
      resolve({ stdout: '', stderr: `No runner for ${language}`, exitCode: 1 })
      return
    }

    const id = Date.now().toString(36)
    const dir = path.join(os.tmpdir(), `oleeto_${id}`)
    mkdirSync(dir, { recursive: true })

    let finalCode = prependIncludes(code, language)
    let inputRedirect = ''

    if (testInput) {
      const wrapped = wrapWithHarness(code, language)
      if (wrapped) {
        finalCode = wrapped
      }
      const inputPath = path.join(dir, 'input.txt')
      writeFileSync(inputPath, testInput)
      inputRedirect = ` < "${inputPath}"`
    }

    const filename = language === 'Java' ? 'Solution.java' : `solution${ext}`
    const filePath = path.join(dir, filename)
    writeFileSync(filePath, finalCode)

    const baseCmd = buildCommand(language, filePath, dir)
    if (!baseCmd) {
      cleanup(dir)
      resolve({ stdout: '', stderr: `No runner for ${language}`, exitCode: 1 })
      return
    }

    const cmd = baseCmd + inputRedirect

    exec(cmd, { timeout: TIMEOUT, cwd: dir }, (error, stdout, stderr) => {
      cleanup(dir)
      const timedOut = error?.killed || error?.signal === 'SIGTERM'
      resolve({
        stdout: stdout?.toString() ?? '',
        stderr: timedOut ? 'Timed out (10s limit)' : (stderr?.toString() ?? ''),
        exitCode: error ? 1 : 0,
      })
    })
  })
}

function buildCommand(language: string, file: string, dir: string): string | null {
  const bin = path.join(dir, 'solution')
  switch (language) {
    case 'Python': return `python3 "${file}"`
    case 'JavaScript': return `node "${file}"`
    case 'TypeScript': return `npx tsx "${file}"`
    case 'Go': return `go run "${file}"`
    case 'Ruby': return `ruby "${file}"`
    case 'Swift': return `swift "${file}"`
    case 'C++': return `g++ -std=c++17 -o "${bin}" "${file}" && "${bin}"`
    case 'C': return `gcc -o "${bin}" "${file}" && "${bin}"`
    case 'Rust': return `rustc -o "${bin}" "${file}" && "${bin}"`
    case 'Java': return `javac "${file}" && java -cp "${dir}" Solution`
    case 'Kotlin': return `kotlinc "${file}" -include-runtime -d "${bin}.jar" 2>/dev/null && java -jar "${bin}.jar"`
    case 'C#': return `dotnet-script "${file}"`
    default: return null
  }
}

function cleanup(dir: string) {
  try { rmSync(dir, { recursive: true, force: true }) } catch {}
}
