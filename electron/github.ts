import { Octokit } from '@octokit/rest'
import type { Problem } from '../src/types'

interface SyncConfig {
  token: string
  owner: string
  repo: string
}

const EXT_MAP: Record<string, string> = {
  Python: '.py', JavaScript: '.js', TypeScript: '.ts',
  Java: '.java', 'C++': '.cpp', C: '.c', Go: '.go',
  Rust: '.rs', 'C#': '.cs', Ruby: '.rb', Swift: '.swift', Kotlin: '.kt',
}

const LINE_COMMENT: Record<string, string> = {
  Python: '#', Ruby: '#',
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function solutionPath(p: Problem): string {
  const ext = EXT_MAP[p.language] ?? '.txt'
  const num = String(p.number).padStart(4, '0')
  return `solutions/${num}-${slugify(p.title)}${ext}`
}

function buildFileContent(p: Problem): string {
  const c = LINE_COMMENT[p.language] ?? '//'
  const lines: string[] = []

  lines.push(`${c} ${p.number}. ${p.title}`)

  const meta: string[] = [p.difficulty]
  if (p.topic) meta.push(p.topic)
  lines.push(`${c} ${meta.join(' | ')}`)

  if (p.url) lines.push(`${c} ${p.url}`)

  const cx: string[] = []
  if (p.time_complexity) cx.push(`Time: ${p.time_complexity}`)
  if (p.space_complexity) cx.push(`Space: ${p.space_complexity}`)
  if (cx.length) lines.push(`${c} ${cx.join(' | ')}`)

  lines.push('')
  lines.push(p.solution)

  return lines.join('\n')
}

function buildReadme(problems: Problem[]): string {
  const sorted = [...problems].sort((a, b) => a.number - b.number)
  const easy = sorted.filter(p => p.difficulty === 'Easy').length
  const medium = sorted.filter(p => p.difficulty === 'Medium').length
  const hard = sorted.filter(p => p.difficulty === 'Hard').length

  let md = '# LeetCode Solutions\n\n'
  md += `**${sorted.length}** problems solved`
  md += ` | **${easy}** Easy | **${medium}** Medium | **${hard}** Hard\n\n`
  md += '| # | Title | Difficulty | Topic | Language |\n'
  md += '|---|-------|-----------|-------|----------|\n'

  for (const p of sorted) {
    const title = p.url ? `[${p.title}](${p.url})` : p.title
    md += `| ${p.number} | ${title} | ${p.difficulty} | ${p.topic || '-'} | ${p.language} |\n`
  }

  return md
}

async function upsertFile(
  octokit: Octokit,
  config: SyncConfig,
  path: string,
  content: string,
  message: string,
) {
  const encoded = Buffer.from(content).toString('base64')

  let sha: string | undefined
  try {
    const existing = await octokit.repos.getContent({
      owner: config.owner, repo: config.repo, path,
    })
    if (!Array.isArray(existing.data) && 'sha' in existing.data) {
      sha = existing.data.sha
    }
  } catch {
    // file doesn't exist yet
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: config.owner, repo: config.repo,
    path, message, content: encoded, sha,
  })
}

export async function syncToGitHub(
  config: SyncConfig,
  unsynced: Problem[],
  allProblems: Problem[],
): Promise<number> {
  const octokit = new Octokit({ auth: config.token })

  for (const problem of unsynced) {
    const path = solutionPath(problem)
    const content = buildFileContent(problem)
    await upsertFile(octokit, config, path, content, `add ${problem.number}: ${problem.title}`)
  }

  const readme = buildReadme(allProblems)
  await upsertFile(octokit, config, 'README.md', readme, 'update readme')

  return unsynced.length
}
