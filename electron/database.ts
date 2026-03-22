import BetterSqlite3 from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import type { Problem, NewProblem, Overview, HeatmapEntry } from '../src/types'
import { calculateStreak } from './streak'

export class Database {
  private db: BetterSqlite3.Database

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'oleeto.db')
    this.db = new BetterSqlite3(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.migrate()
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS problems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number INTEGER NOT NULL,
        title TEXT NOT NULL,
        difficulty TEXT NOT NULL CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
        language TEXT NOT NULL,
        solution TEXT NOT NULL,
        notes TEXT DEFAULT '',
        url TEXT DEFAULT '',
        topic TEXT DEFAULT '',
        time_complexity TEXT DEFAULT '',
        space_complexity TEXT DEFAULT '',
        solved_at TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_solved_at ON problems(solved_at);
      CREATE INDEX IF NOT EXISTS idx_synced ON problems(synced);

      CREATE TABLE IF NOT EXISTS deleted_syncs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL
      );
    `)

    const columns = this.db.prepare('PRAGMA table_info(problems)').all() as { name: string }[]
    const existing = new Set(columns.map(c => c.name))

    const additions: [string, string][] = [
      ['url', "TEXT DEFAULT ''"],
      ['topic', "TEXT DEFAULT ''"],
      ['time_complexity', "TEXT DEFAULT ''"],
      ['space_complexity', "TEXT DEFAULT ''"],
      ['personal_difficulty', 'INTEGER DEFAULT 0'],
    ]

    for (const [name, type] of additions) {
      if (!existing.has(name)) {
        this.db.exec(`ALTER TABLE problems ADD COLUMN ${name} ${type}`)
      }
    }
  }

  getProblems(): Problem[] {
    return this.db
      .prepare('SELECT * FROM problems ORDER BY solved_at DESC, id DESC')
      .all() as Problem[]
  }

  addProblem(p: NewProblem): Problem {
    const result = this.db.prepare(`
      INSERT INTO problems (number, title, difficulty, language, solution, notes, url, topic, time_complexity, space_complexity, personal_difficulty, solved_at)
      VALUES (@number, @title, @difficulty, @language, @solution, @notes, @url, @topic, @timeComplexity, @spaceComplexity, @personalDifficulty, @solvedAt)
    `).run(p)

    return this.db
      .prepare('SELECT * FROM problems WHERE id = ?')
      .get(result.lastInsertRowid) as Problem
  }

  deleteProblem(id: number) {
    this.db.prepare('DELETE FROM problems WHERE id = ?').run(id)
  }

  updateProblem(id: number, data: Partial<NewProblem>) {
    const columnMap: Record<string, string> = {
      number: 'number', title: 'title', difficulty: 'difficulty',
      language: 'language', solution: 'solution', notes: 'notes',
      url: 'url', topic: 'topic',
      timeComplexity: 'time_complexity', spaceComplexity: 'space_complexity',
      personalDifficulty: 'personal_difficulty', solvedAt: 'solved_at',
    }

    const entries = Object.entries(data).filter(([k]) => k in columnMap)
    if (entries.length === 0) return

    const sets = entries.map(([k]) => `${columnMap[k]} = ?`).join(', ') + ', synced = 0'
    const values = entries.map(([, v]) => v)

    this.db.prepare(`UPDATE problems SET ${sets} WHERE id = ?`).run(...values, id)
  }

  getOverview(): Overview {
    const total = this.db
      .prepare('SELECT COUNT(*) as count FROM problems')
      .get() as { count: number }

    const byDifficulty = this.db
      .prepare('SELECT difficulty, COUNT(*) as count FROM problems GROUP BY difficulty')
      .all() as { difficulty: string; count: number }[]

    const today = new Date().toISOString().split('T')[0]
    const monthStart = `${today.substring(0, 7)}-01`

    const todayCount = this.db
      .prepare('SELECT COUNT(*) as count FROM problems WHERE solved_at = ?')
      .get(today) as { count: number }

    const monthCount = this.db
      .prepare('SELECT COUNT(*) as count FROM problems WHERE solved_at >= ?')
      .get(monthStart) as { count: number }

    const dates = this.db
      .prepare('SELECT DISTINCT solved_at FROM problems ORDER BY solved_at DESC')
      .all() as { solved_at: string }[]

    return {
      total: total.count,
      today: todayCount.count,
      month: monthCount.count,
      streak: calculateStreak(dates.map(d => d.solved_at)),
      byDifficulty: {
        Easy: byDifficulty.find(d => d.difficulty === 'Easy')?.count ?? 0,
        Medium: byDifficulty.find(d => d.difficulty === 'Medium')?.count ?? 0,
        Hard: byDifficulty.find(d => d.difficulty === 'Hard')?.count ?? 0,
      },
    }
  }

  getHeatmapData(year: number): HeatmapEntry[] {
    return this.db.prepare(`
      SELECT solved_at as date, COUNT(*) as count
      FROM problems
      WHERE solved_at BETWEEN ? AND ?
      GROUP BY solved_at
    `).all(`${year}-01-01`, `${year}-12-31`) as HeatmapEntry[]
  }

  getHeatmapRange(start: string, end: string): HeatmapEntry[] {
    return this.db.prepare(`
      SELECT solved_at as date, COUNT(*) as count
      FROM problems
      WHERE solved_at BETWEEN ? AND ?
      GROUP BY solved_at
    `).all(start, end) as HeatmapEntry[]
  }

  getUnsyncedProblems(): Problem[] {
    return this.db
      .prepare('SELECT * FROM problems WHERE synced = 0 ORDER BY number')
      .all() as Problem[]
  }

  markSynced(ids: number[]) {
    const stmt = this.db.prepare('UPDATE problems SET synced = 1 WHERE id = ?')
    const run = this.db.transaction((ids: number[]) => {
      for (const id of ids) stmt.run(id)
    })
    run(ids)
  }

  getSetting(key: string): string | null {
    const row = this.db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as { value: string } | undefined
    return row?.value ?? null
  }

  setSetting(key: string, value: string) {
    this.db
      .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run(key, value)
  }

  getReviewDue(): Problem[] {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    return this.db
      .prepare('SELECT * FROM problems WHERE solved_at <= ? ORDER BY solved_at ASC LIMIT 5')
      .all(cutoffStr) as Problem[]
  }

  trackDeletion(filePath: string) {
    this.db.prepare('INSERT INTO deleted_syncs (file_path) VALUES (?)').run(filePath)
  }

  getDeletedSyncs(): string[] {
    const rows = this.db.prepare('SELECT file_path FROM deleted_syncs').all() as { file_path: string }[]
    return rows.map(r => r.file_path)
  }

  clearDeletedSyncs() {
    this.db.exec('DELETE FROM deleted_syncs')
  }

  getProblemById(id: number): Problem | undefined {
    return this.db.prepare('SELECT * FROM problems WHERE id = ?').get(id) as Problem | undefined
  }
}
