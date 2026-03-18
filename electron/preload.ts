import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  problems: {
    list: () => ipcRenderer.invoke('problems:list'),
    add: (problem: unknown) => ipcRenderer.invoke('problems:add', problem),
    delete: (id: number) => ipcRenderer.invoke('problems:delete', id),
    update: (id: number, data: unknown) => ipcRenderer.invoke('problems:update', id, data),
    unsynced: () => ipcRenderer.invoke('problems:unsynced'),
    markSynced: (ids: number[]) => ipcRenderer.invoke('problems:mark-synced', ids),
  },
  stats: {
    overview: () => ipcRenderer.invoke('stats:overview'),
    heatmap: (year: number) => ipcRenderer.invoke('stats:heatmap', year),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
  },
  github: {
    sync: () => ipcRenderer.invoke('github:sync'),
  },
})
