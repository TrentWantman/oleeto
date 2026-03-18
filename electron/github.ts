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

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

function calculateStreak(problems: Problem[]): number {
  const dates = [...new Set(problems.map(p => p.solved_at))].sort().reverse()
  if (dates.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const mostRecent = new Date(dates[0] + 'T00:00:00')
  const gap = Math.floor((today.getTime() - mostRecent.getTime()) / 86400000)
  if (gap > 1) return 0

  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const curr = new Date(dates[i - 1] + 'T00:00:00')
    const prev = new Date(dates[i] + 'T00:00:00')
    if (Math.floor((curr.getTime() - prev.getTime()) / 86400000) === 1) streak++
    else break
  }
  return streak
}

function buildHeatmapSvg(problems: Problem[]): string {
  const year = new Date().getFullYear()
  const counts = new Map<string, number>()
  for (const p of problems) {
    if (p.solved_at.startsWith(String(year))) {
      counts.set(p.solved_at, (counts.get(p.solved_at) ?? 0) + 1)
    }
  }

  const cell = 11
  const gap = 2
  const step = cell + gap
  const left = 4
  const top = 20
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const jan1 = new Date(year, 0, 1)
  const today = new Date()
  const startDow = jan1.getDay()

  const rects: string[] = []
  const months: { label: string; x: number }[] = []
  let col = 0
  let row = startDow
  let lastMonth = -1

  const d = new Date(jan1)
  while (d <= today && d.getFullYear() === year) {
    const month = d.getMonth()
    if (month !== lastMonth) {
      months.push({ label: monthNames[month], x: left + col * step })
      lastMonth = month
    }

    const ds = fmtDate(d)
    const count = counts.get(ds) ?? 0
    const fill = count === 0 ? '#161b16'
      : count === 1 ? '#00401a'
      : count === 2 ? '#006628'
      : count <= 4 ? '#009926'
      : '#00ff41'

    rects.push(`<rect x="${left + col * step}" y="${top + row * step}" width="${cell}" height="${cell}" fill="${fill}" rx="2"/>`)

    row++
    if (row === 7) { row = 0; col++ }
    d.setDate(d.getDate() + 1)
  }

  const w = left + (col + 1) * step + 4
  const h = top + 7 * step + 4

  const texts = months.map(m =>
    `<text x="${m.x}" y="12" fill="#4a4a4a" font-family="Arial,sans-serif" font-size="10">${m.label}</text>`
  )

  return [
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="${w}" height="${h}" fill="#0a0a0a" rx="6"/>`,
    ...texts,
    ...rects,
    '</svg>',
  ].join('\n')
}

function buildReadme(problems: Problem[]): string {
  const sorted = [...problems].sort((a, b) => a.number - b.number)
  const easy = sorted.filter(p => p.difficulty === 'Easy').length
  const medium = sorted.filter(p => p.difficulty === 'Medium').length
  const hard = sorted.filter(p => p.difficulty === 'Hard').length
  const streak = calculateStreak(problems)

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthCount = problems.filter(p => p.solved_at.startsWith(thisMonth)).length

  let md = '# LeetCode Solutions\n\n'
  md += '![Activity](activity.svg)\n\n'
  md += `**${sorted.length}** solved`
  md += ` | **${streak}** day streak`
  md += ` | **${monthCount}** this month\n\n`
  md += `**${easy}** Easy | **${medium}** Medium | **${hard}** Hard\n\n`
  md += '---\n\n'
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
  } catch {}

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

  const svg = buildHeatmapSvg(allProblems)
  await upsertFile(octokit, config, 'activity.svg', svg, 'update activity')

  const readme = buildReadme(allProblems)
  await upsertFile(octokit, config, 'README.md', readme, 'update readme')

  return unsynced.length
}
