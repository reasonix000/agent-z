"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const llama_manager_1 = require("./llama-manager");
const model_scanner_1 = require("./model-scanner");
const config_manager_1 = require("./config-manager");
const backend_manager_1 = require("./backend-manager");
let mainWindow = null;
let llamaManager = null;
let modelScanner = null;
let configManager = null;
let backendManager = null;
let isQuitting = false;
const isDev = process.env.NODE_ENV === 'development';
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: true,
        titleBarStyle: 'default',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        backgroundColor: '#0f1115',
        show: false
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    }
    else {
        const htmlPath = path.join(__dirname, '../renderer/index.html');
        console.log('[Z] Loading:', htmlPath);
        mainWindow.loadFile(htmlPath).catch((err) => {
            console.error('[Z] Failed to load renderer:', err.message);
        });
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('[Z] Renderer failed to load:', errorCode, errorDescription);
        });
    }
    mainWindow.once('ready-to-show', () => {
        console.log('[Z] Window ready to show');
        mainWindow?.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
async function initializeServices() {
    configManager = new config_manager_1.ConfigManager();
    await configManager.load();
    modelScanner = new model_scanner_1.ModelScanner();
    llamaManager = new llama_manager_1.LlamaManager();
    backendManager = new backend_manager_1.BackendManager();
    const modelsFolder = configManager.get('models.folderPath');
    if (modelsFolder && fs.existsSync(modelsFolder)) {
        modelScanner.setFolder(modelsFolder);
    }
    const llamaPort = configManager.get('llama.port');
    llamaManager.setPort(llamaPort);
    const serverPort = configManager.get('server.port');
    backendManager.setPort(serverPort);
}
function setupIPC() {
    electron_1.ipcMain.handle('window:minimize', () => mainWindow?.minimize());
    electron_1.ipcMain.handle('window:maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow?.maximize();
        }
    });
    electron_1.ipcMain.handle('window:close', () => mainWindow?.close());
    electron_1.ipcMain.handle('models:scan', async () => {
        if (!modelScanner)
            return { success: false, error: '服务未初始化' };
        const folder = modelScanner.getFolder();
        if (!folder)
            return { success: false, error: '未设置模型文件夹' };
        const models = await modelScanner.scan();
        return { success: true, models };
    });
    electron_1.ipcMain.handle('models:setFolder', async (_event, folderPath) => {
        if (!modelScanner)
            return { success: false, error: '服务未初始化' };
        modelScanner.setFolder(folderPath);
        configManager?.set('models.folderPath', folderPath);
        const models = await modelScanner.scan();
        return { success: true, models };
    });
    electron_1.ipcMain.handle('models:getFolder', () => {
        return modelScanner?.getFolder() || '';
    });
    electron_1.ipcMain.handle('models:select', async (_event, modelPath) => {
        if (!llamaManager || !configManager)
            return { success: false, error: '服务未初始化' };
        try {
            await llamaManager.switchModel(modelPath);
            configManager.set('models.selectedModel', path.basename(modelPath));
            return { success: true };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    });
    electron_1.ipcMain.handle('models:getStatus', () => {
        return llamaManager?.getStatus() || { running: false, model: '' };
    });
    electron_1.ipcMain.handle('models:getList', () => {
        return modelScanner?.getCachedModels() || [];
    });
    electron_1.ipcMain.handle('config:get', (_event, key) => {
        return configManager?.get(key);
    });
    electron_1.ipcMain.handle('config:set', (_event, key, value) => {
        configManager?.set(key, value);
    });
    electron_1.ipcMain.handle('llama:start', async () => {
        const selectedModel = configManager?.get('models.selectedModel');
        const folder = modelScanner?.getFolder();
        if (!selectedModel || !folder) {
            return { success: false, error: '未选择模型' };
        }
        const modelPath = path.join(folder, selectedModel);
        try {
            await llamaManager?.start(modelPath);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    });
    electron_1.ipcMain.handle('llama:stop', async () => {
        await llamaManager?.stop();
        return { success: true };
    });
    electron_1.ipcMain.handle('llama:restart', async () => {
        const selectedModel = configManager?.get('models.selectedModel');
        const folder = modelScanner?.getFolder();
        if (!selectedModel || !folder) {
            return { success: false, error: '未选择模型' };
        }
        const modelPath = path.join(folder, selectedModel);
        try {
            await llamaManager?.restart(modelPath);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    });
    electron_1.ipcMain.handle('dialog:openFolder', async () => {
        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        if (result.canceled)
            return null;
        return result.filePaths[0];
    });
    electron_1.ipcMain.handle('shell:openExternal', async (_event, url) => {
        await electron_1.shell.openExternal(url);
    });
    electron_1.ipcMain.handle('backend:start', async () => {
        try {
            await backendManager?.start();
            return { success: true };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    });
    electron_1.ipcMain.handle('backend:stop', async () => {
        await backendManager?.stop();
        return { success: true };
    });
    electron_1.ipcMain.handle('backend:getStatus', async () => {
        return await backendManager?.getStatusAsync() || { running: false, port: 0 };
    });
}
electron_1.app.whenReady().then(async () => {
    console.log('[Z] App ready');
    await initializeServices();
    setupIPC();
    createWindow();
    backendManager?.start().catch((err) => {
        if (err.message?.includes('EADDRINUSE')) {
            console.log('[Z] Backend already running on port', backendManager?.getPort());
        }
        else {
            console.error('[Z] Backend auto-start failed:', err.message);
        }
    });
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', async () => {
    console.log('[Z] All windows closed');
    await llamaManager?.stop();
    await backendManager?.stop();
    if (process.platform !== 'darwin') {
        isQuitting = true;
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', async () => {
    console.log('[Z] App quitting');
    isQuitting = true;
    await llamaManager?.stop();
    await backendManager?.stop();
});
process.on('uncaughtException', (err) => {
    console.error('[Z] Uncaught exception:', err.stack || err.message);
});
process.on('unhandledRejection', (reason) => {
    console.error('[Z] Unhandled rejection:', reason);
});
//# sourceMappingURL=index.js.map