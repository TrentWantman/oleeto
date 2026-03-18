export interface Problem {
  id: number
  number: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  language: string
  solution: string
  notes: string
  url: string
  topic: string
  time_complexity: string
  space_complexity: string
  solved_at: string
  synced: number
  created_at: string
}

export interface NewProblem {
  number: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  language: string
  solution: string
  notes: string
  url: string
  topic: string
  timeComplexity: string
  spaceComplexity: string
  solvedAt: string
}

export interface Overview {
  total: number
  today: number
  month: number
  streak: number
  byDifficulty: {
    Easy: number
    Medium: number
    Hard: number
  }
}

export interface HeatmapEntry {
  date: string
  count: number
}

export interface SyncResult {
  synced: number
  message: string
}

export interface RunResult {
  stdout: string
  stderr: string
  exitCode: number
}

export interface ElectronAPI {
  problems: {
    list: () => Promise<Problem[]>
    add: (problem: NewProblem) => Promise<Problem>
    delete: (id: number) => Promise<void>
    update: (id: number, data: Partial<NewProblem>) => Promise<void>
    unsynced: () => Promise<Problem[]>
    markSynced: (ids: number[]) => Promise<void>
  }
  stats: {
    overview: () => Promise<Overview>
    heatmap: (year: number) => Promise<HeatmapEntry[]>
  }
  settings: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<void>
  }
  github: {
    sync: () => Promise<SyncResult>
    syncOne: (id: number) => Promise<SyncResult>
  }
  code: {
    run: (code: string, language: string) => Promise<RunResult>
  }
  shell: {
    openExternal: (url: string) => Promise<void>
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
