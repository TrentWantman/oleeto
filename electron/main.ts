import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { Database } from './database'
import { syncToGitHub } from './github'
import { runCode } from './runner'

let mainWindow: BrowserWindow | null = null
let db: Database

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function registerHandlers() {
  ipcMain.handle('problems:list', () => db.getProblems())
  ipcMain.handle('problems:add', (_, problem) => db.addProblem(problem))
  ipcMain.handle('problems:delete', (_, id) => db.deleteProblem(id))
  ipcMain.handle('problems:update', (_, id, data) => db.updateProblem(id, data))
  ipcMain.handle('problems:unsynced', () => db.getUnsyncedProblems())
  ipcMain.handle('problems:mark-synced', (_, ids) => db.markSynced(ids))

  ipcMain.handle('stats:overview', () => db.getOverview())
  ipcMain.handle('stats:heatmap', (_, year) => db.getHeatmapData(year))
  ipcMain.handle('stats:review', () => db.getReviewDue())

  ipcMain.handle('settings:get', (_, key) => db.getSetting(key))
  ipcMain.handle('settings:set', (_, key, value) => db.setSetting(key, value))

  ipcMain.handle('code:run', (_, code, language) => runCode(code, language))

  ipcMain.handle('shell:open-external', (_, url) => shell.openExternal(url))

  ipcMain.handle('leetcode:fetch', async (_, slug: string) => {
    try {
      const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com',
        },
        body: JSON.stringify({
          query: 'query($slug:String!){question(titleSlug:$slug){questionFrontendId title difficulty topicTags{name}}}',
          variables: { slug },
        }),
      })
      const json = await res.json() as { data?: { question?: unknown } }
      return json.data?.question ?? null
    } catch {
      return null
    }
  })

  ipcMain.handle('github:sync-one', async (_, id: number) => {
    const token = db.getSetting('github_token')
    const owner = db.getSetting('github_owner')
    const repo = db.getSetting('github_repo')

    if (!token || !owner || !repo) {
      throw new Error('Configure GitHub in Settings first')
    }

    const all = db.getProblems()
    const problem = all.find(p => p.id === id)
    if (!problem) throw new Error('Problem not found')

    await syncToGitHub({ token, owner, repo }, [problem], all)
    db.markSynced([id])

    return { synced: 1, message: 'Synced' }
  })

  ipcMain.handle('github:sync', async () => {
    const token = db.getSetting('github_token')
    const owner = db.getSetting('github_owner')
    const repo = db.getSetting('github_repo')

    if (!token || !owner || !repo) {
      throw new Error('Configure GitHub in Settings first')
    }

    const unsynced = db.getUnsyncedProblems()
    if (unsynced.length === 0) {
      return { synced: 0, message: 'Already up to date' }
    }

    const allProblems = db.getProblems()
    const count = await syncToGitHub({ token, owner, repo }, unsynced, allProblems)
    db.markSynced(unsynced.map(p => p.id))

    return {
      synced: count,
      message: `Synced ${count} solution${count > 1 ? 's' : ''}`,
    }
  })
}

app.whenReady().then(() => {
  db = new Database()
  registerHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
