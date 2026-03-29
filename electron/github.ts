import { Octokit } from '@octokit/rest'
import type { Problem } from '../src/types'
import { calculateStreak } from './streak'

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

export function solutionPath(p: Problem, allProblems: Problem[]): string {
  const ext = EXT_MAP[p.language] ?? '.txt'
  const num = String(p.number).padStart(4, '0')
  const slug = slugify(p.title)
  const prior = allProblems.filter(o => o.number === p.number && o.id < p.id).length
  const suffix = prior > 0 ? `-${prior + 1}` : ''
  return `solutions/${num}-${slug}${suffix}${ext}`
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

function buildHeatmapSvg(problems: Problem[]): string {
  const counts = new Map<string, number>()
  for (const p of problems) counts.set(p.solved_at, (counts.get(p.solved_at) ?? 0) + 1)
  const cell = 11, gap = 2, step = cell + gap, left = 4, top = 20
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const today = new Date()
  const start = new Date(today)
  start.setFullYear(start.getFullYear() - 1)
  start.setDate(start.getDate() + 1)
  const startDow = start.getDay()
  const rects: string[] = []
  const months: { label: string; x: number }[] = []
  let col = 0, row = startDow, lastMonth = -1
  const d = new Date(start)
  while (d <= today) {
    const month = d.getMonth()
    if (month !== lastMonth) {
      months.push({ label: monthNames[month], x: left + col * step })
      lastMonth = month
    }
    const count = counts.get(fmtDate(d)) ?? 0
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
    ...texts, ...rects, '</svg>',
  ].join('\n')
}

function buildReadme(problems: Problem[]): string {
  const sorted = [...problems].sort((a, b) => a.number - b.number)
  const easy = sorted.filter(p => p.difficulty === 'Easy').length
  const medium = sorted.filter(p => p.difficulty === 'Medium').length
  const hard = sorted.filter(p => p.difficulty === 'Hard').length
  const dates = [...new Set(problems.map(p => p.solved_at))].sort().reverse()
  const streak = calculateStreak(dates)
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthCount = problems.filter(p => p.solved_at.startsWith(thisMonth)).length
  let md = '# LeetCode Solutions\n\n'
  md += '![Activity](activity.svg)\n\n'
  md += `**${sorted.length}** solved | **${streak}** day streak | **${monthCount}** this month\n\n`
  md += `**${easy}** Easy | **${medium}** Medium | **${hard}** Hard\n\n`
  md += '---\n\n'
  md += '| # | Title | Difficulty | Topic | Solution |\n'
  md += '|---|-------|-----------|-------|----------|\n'
  for (const p of sorted) {
    const title = p.url ? `[${p.title}](${p.url})` : p.title
    const file = solutionPath(p, problems)
    md += `| ${p.number} | ${title} | ${p.difficulty} | ${p.topic || '-'} | [${p.language}](${file}) |\n`
  }
  return md
}

export async function syncToGitHub(
  config: SyncConfig,
  unsynced: Problem[],
  allProblems: Problem[],
  deletedPaths: string[],
): Promise<number> {
  const octokit = new Octokit({ auth: config.token })
  const { owner, repo } = config

  const { data: repoData } = await octokit.repos.get({ owner, repo })
  const branch = repoData.default_branch
  const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` })
  const headSha = ref.object.sha
  const { data: headCommit } = await octokit.git.getCommit({ owner, repo, commit_sha: headSha })

  const tree: { path: string; mode: '100644'; type: 'blob'; content?: string; sha?: string | null }[] = []
  for (const fp of deletedPaths) tree.push({ path: fp, mode: '100644', type: 'blob', sha: null })
  for (const p of unsynced) tree.push({ path: solutionPath(p, allProblems), mode: '100644', type: 'blob', content: buildFileContent(p) })
  tree.push({ path: 'activity.svg', mode: '100644', type: 'blob', content: buildHeatmapSvg(allProblems) })
  tree.push({ path: 'README.md', mode: '100644', type: 'blob', content: buildReadme(allProblems) })

  const parts: string[] = []
  if (deletedPaths.length) parts.push(`remove ${deletedPaths.length} solution${deletedPaths.length > 1 ? 's' : ''}`)
  if (unsynced.length) parts.push(`sync ${unsynced.length} solution${unsynced.length > 1 ? 's' : ''}`)
  const message = parts.join(', ') || 'update stats'

  const { data: newTree } = await octokit.git.createTree({ owner, repo, base_tree: headCommit.tree.sha, tree: tree as any })
  const { data: newCommit } = await octokit.git.createCommit({ owner, repo, message, tree: newTree.sha, parents: [headSha] })
  await octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: newCommit.sha })

  return unsynced.length
}
