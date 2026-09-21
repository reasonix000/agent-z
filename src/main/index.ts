import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { LlamaManager } from './llama-manager';
import { ModelScanner } from './model-scanner';
import { ConfigManager } from './config-manager';
import { BackendManager } from './backend-manager';

let mainWindow: BrowserWindow | null = null;
let llamaManager: LlamaManager | null = null;
let modelScanner: ModelScanner | null = null;
let configManager: ConfigManager | null = null;
let backendManager: BackendManager | null = null;
let isQuitting = false;

const isDev = process.env.NODE_ENV === 'development';

function createWindow(): void {
  mainWindow = new BrowserWindow({
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
  } else {
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

async function initializeServices(): Promise<void> {
  configManager = new ConfigManager();
  await configManager.load();

  modelScanner = new ModelScanner();
  llamaManager = new LlamaManager();
  backendManager = new BackendManager();

  const modelsFolder = configManager.get('models.folderPath') as string;
  if (modelsFolder && fs.existsSync(modelsFolder)) {
    modelScanner.setFolder(modelsFolder);
  }

  const llamaPort = configManager.get('llama.port') as number;
  llamaManager.setPort(llamaPort);

  const serverPort = configManager.get('server.port') as number;
  backendManager.setPort(serverPort);
}

function setupIPC(): void {
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle('window:close', () => mainWindow?.close());

  ipcMain.handle('models:scan', async () => {
    if (!modelScanner) return { success: false, error: '服务未初始化' };
    const folder = modelScanner.getFolder();
    if (!folder) return { success: false, error: '未设置模型文件夹' };
    const models = await modelScanner.scan();
    return { success: true, models };
  });

  ipcMain.handle('models:setFolder', async (_event, folderPath: string) => {
    if (!modelScanner) return { success: false, error: '服务未初始化' };
    modelScanner.setFolder(folderPath);
    configManager?.set('models.folderPath', folderPath);
    const models = await modelScanner.scan();
    return { success: true, models };
  });

  ipcMain.handle('models:getFolder', () => {
    return modelScanner?.getFolder() || '';
  });

  ipcMain.handle('models:select', async (_event, modelPath: string) => {
    if (!llamaManager || !configManager) return { success: false, error: '服务未初始化' };
    try {
      await llamaManager.switchModel(modelPath);
      configManager.set('models.selectedModel', path.basename(modelPath));
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('models:getStatus', () => {
    return llamaManager?.getStatus() || { running: false, model: '' };
  });

  ipcMain.handle('models:getList', () => {
    return modelScanner?.getCachedModels() || [];
  });

  ipcMain.handle('config:get', (_event, key: string) => {
    return configManager?.get(key);
  });

  ipcMain.handle('config:set', (_event, key: string, value: unknown) => {
    configManager?.set(key, value);
  });

  ipcMain.handle('llama:start', async () => {
    const selectedModel = configManager?.get('models.selectedModel') as string;
    const folder = modelScanner?.getFolder();
    if (!selectedModel || !folder) {
      return { success: false, error: '未选择模型' };
    }
    const modelPath = path.join(folder, selectedModel);
    try {
      await llamaManager?.start(modelPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('llama:stop', async () => {
    await llamaManager?.stop();
    return { success: true };
  });

  ipcMain.handle('llama:restart', async () => {
    const selectedModel = configManager?.get('models.selectedModel') as string;
    const folder = modelScanner?.getFolder();
    if (!selectedModel || !folder) {
      return { success: false, error: '未选择模型' };
    }
    const modelPath = path.join(folder, selectedModel);
    try {
      await llamaManager?.restart(modelPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('shell:openExternal', async (_event, url: string) => {
    await shell.openExternal(url);
  });

  ipcMain.handle('backend:start', async () => {
    try {
      await backendManager?.start();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('backend:stop', async () => {
    await backendManager?.stop();
    return { success: true };
  });

  ipcMain.handle('backend:getStatus', async () => {
    return await backendManager?.getStatusAsync() || { running: false, port: 0 };
  });
}

app.whenReady().then(async () => {
  console.log('[Z] App ready');
  await initializeServices();
  setupIPC();
  createWindow();

  backendManager?.start().catch((err: Error) => {
    if (err.message?.includes('EADDRINUSE')) {
      console.log('[Z] Backend already running on port', backendManager?.getPort());
    } else {
      console.error('[Z] Backend auto-start failed:', err.message);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  console.log('[Z] All windows closed');
  await llamaManager?.stop();
  await backendManager?.stop();
  if (process.platform !== 'darwin') {
    isQuitting = true;
    app.quit();
  }
});

app.on('before-quit', async () => {
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
