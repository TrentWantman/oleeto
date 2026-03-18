import { Octokit } from '@octokit/rest'
import type { Problem } from '../src/types'

interface SyncConfig {
  token: string
  owner: string
  repo: string
}

const EXT_MAP: Record<string, string> = {
  Python: '.py',
  JavaScript: '.js',
  TypeScript: '.ts',
  Java: '.java',
  'C++': '.cpp',
  C: '.c',
  Go: '.go',
  Rust: '.rs',
  'C#': '.cs',
  Ruby: '.rb',
  Swift: '.swift',
  Kotlin: '.kt',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function syncToGitHub(config: SyncConfig, problems: Problem[]): Promise<number> {
  const octokit = new Octokit({ auth: config.token })

  for (const problem of problems) {
    const ext = EXT_MAP[problem.language] ?? '.txt'
    const slug = slugify(problem.title)
    const filePath = `${problem.number}-${slug}${ext}`
    const content = Buffer.from(problem.solution).toString('base64')

    let sha: string | undefined
    try {
      const existing = await octokit.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path: filePath,
      })
      if (!Array.isArray(existing.data) && 'sha' in existing.data) {
        sha = existing.data.sha
      }
    } catch {
      // file doesn't exist yet
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: config.owner,
      repo: config.repo,
      path: filePath,
      message: `add ${problem.number}: ${problem.title}`,
      content,
      sha,
    })
  }

  return problems.length
}
