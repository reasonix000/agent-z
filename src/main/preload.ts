import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },
  models: {
    scan: () => ipcRenderer.invoke('models:scan'),
    setFolder: (folderPath: string) => ipcRenderer.invoke('models:setFolder', folderPath),
    getFolder: () => ipcRenderer.invoke('models:getFolder'),
    select: (modelPath: string) => ipcRenderer.invoke('models:select', modelPath),
    getStatus: () => ipcRenderer.invoke('models:getStatus'),
    getList: () => ipcRenderer.invoke('models:getList')
  },
  llama: {
    start: () => ipcRenderer.invoke('llama:start'),
    stop: () => ipcRenderer.invoke('llama:stop'),
    restart: () => ipcRenderer.invoke('llama:restart')
  },
  backend: {
    start: () => ipcRenderer.invoke('backend:start'),
    stop: () => ipcRenderer.invoke('backend:stop'),
    getStatus: () => ipcRenderer.invoke('backend:getStatus')
  },
  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value)
  },
  dialog: {
    openFolder: () => ipcRenderer.invoke('dialog:openFolder')
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url)
  }
});
