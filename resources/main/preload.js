"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    window: {
        minimize: () => electron_1.ipcRenderer.invoke('window:minimize'),
        maximize: () => electron_1.ipcRenderer.invoke('window:maximize'),
        close: () => electron_1.ipcRenderer.invoke('window:close')
    },
    models: {
        scan: () => electron_1.ipcRenderer.invoke('models:scan'),
        setFolder: (folderPath) => electron_1.ipcRenderer.invoke('models:setFolder', folderPath),
        getFolder: () => electron_1.ipcRenderer.invoke('models:getFolder'),
        select: (modelPath) => electron_1.ipcRenderer.invoke('models:select', modelPath),
        getStatus: () => electron_1.ipcRenderer.invoke('models:getStatus'),
        getList: () => electron_1.ipcRenderer.invoke('models:getList')
    },
    llama: {
        start: () => electron_1.ipcRenderer.invoke('llama:start'),
        stop: () => electron_1.ipcRenderer.invoke('llama:stop'),
        restart: () => electron_1.ipcRenderer.invoke('llama:restart')
    },
    backend: {
        start: () => electron_1.ipcRenderer.invoke('backend:start'),
        stop: () => electron_1.ipcRenderer.invoke('backend:stop'),
        getStatus: () => electron_1.ipcRenderer.invoke('backend:getStatus')
    },
    config: {
        get: (key) => electron_1.ipcRenderer.invoke('config:get', key),
        set: (key, value) => electron_1.ipcRenderer.invoke('config:set', key, value)
    },
    dialog: {
        openFolder: () => electron_1.ipcRenderer.invoke('dialog:openFolder')
    },
    shell: {
        openExternal: (url) => electron_1.ipcRenderer.invoke('shell:openExternal', url)
    }
});
//# sourceMappingURL=preload.js.map