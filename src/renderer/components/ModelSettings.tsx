import React, { useState, useEffect } from 'react';

interface ModelInfo {
  name: string;
  fileName: string;
  filePath: string;
  size: number;
  sizeFormatted: string;
  lastModified: string;
  isSelected: boolean;
}

interface ModelSettingsProps {
  onClose: () => void;
}

declare global {
  interface Window {
    electronAPI: {
      models: {
        scan: () => Promise<{ success: boolean; models: ModelInfo[]; error?: string }>;
        setFolder: (folder: string) => Promise<{ success: boolean; models: ModelInfo[]; error?: string }>;
        getFolder: () => Promise<string>;
        select: (modelPath: string) => Promise<{ success: boolean; error?: string }>;
        getStatus: () => Promise<{ running: boolean; model: string; port: number }>;
        getList: () => Promise<ModelInfo[]>;
      };
      llama: {
        start: () => Promise<{ success: boolean; error?: string }>;
        stop: () => Promise<{ success: boolean }>;
        restart: () => Promise<{ success: boolean; error?: string }>;
      };
      dialog: {
        openFolder: () => Promise<string | null>;
      };
      config: {
        get: (key: string) => Promise<unknown>;
        set: (key: string, value: unknown) => Promise<void>;
      };
    };
  }
}

export default function ModelSettings({ onClose }: ModelSettingsProps) {
  const [folderPath, setFolderPath] = useState('');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [llamaPort, setLlamaPort] = useState(8081);
  const [ctxSize, setCtxSize] = useState(32768);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const folder = await window.electronAPI.models.getFolder();
      setFolderPath(folder);

      const modelsList = await window.electronAPI.models.getList();
      setModels(modelsList);

      const status = await window.electronAPI.models.getStatus();
      setSelectedModel(status.model);

      const port = await window.electronAPI.config.get('llama.port');
      if (port) setLlamaPort(port as number);

      const ctx = await window.electronAPI.config.get('llama.ctxSize');
      if (ctx) setCtxSize(ctx as number);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const handleSelectFolder = async () => {
    const folder = await window.electronAPI.dialog.openFolder();
    if (folder) {
      setFolderPath(folder);
      await scanModels(folder);
    }
  };

  const scanModels = async (folder?: string) => {
    setScanning(true);
    setMessage('');
    try {
      const result = folder
        ? await window.electronAPI.models.setFolder(folder)
        : await window.electronAPI.models.scan();
      
      if (result.success) {
        setModels(result.models);
        setMessage(`扫描完成，找到 ${result.models.length} 个模型`);
      } else {
        setMessage(`扫描失败: ${result.error}`);
      }
    } catch (e) {
      setMessage(`扫描失败: ${e}`);
    } finally {
      setScanning(false);
    }
  };

  const handleSelectModel = (model: ModelInfo) => {
    setSelectedModel(model.fileName);
  };

  const handleApply = async () => {
    if (!selectedModel || !folderPath) {
      setMessage('请选择模型文件夹和模型');
      return;
    }

    setSwitching(true);
    setMessage('');
    try {
      const modelPath = `${folderPath}\\${selectedModel}`;
      const result = await window.electronAPI.models.select(modelPath);
      
      if (result.success) {
        setMessage('模型切换成功');
        await window.electronAPI.config.set('llama.port', llamaPort);
        await window.electronAPI.config.set('llama.ctxSize', ctxSize);
      } else {
        setMessage(`模型切换失败: ${result.error}`);
      }
    } catch (e) {
      setMessage(`模型切换失败: ${e}`);
    } finally {
      setSwitching(false);
    }
  };

  const handleRestartLlama = async () => {
    setSwitching(true);
    setMessage('');
    try {
      const result = await window.electronAPI.llama.restart();
      if (result.success) {
        setMessage('llama-server 重启成功');
      } else {
        setMessage(`重启失败: ${result.error}`);
      }
    } catch (e) {
      setMessage(`重启失败: ${e}`);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="model-settings-overlay" onClick={onClose}>
      <div className="model-settings" onClick={e => e.stopPropagation()}>
        <div className="model-settings-header">
          <h2 className="model-settings-title">模型设置</h2>
          <button className="icon-button" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
            </svg>
          </button>
        </div>
        <div className="model-settings-content">
          <div className="form-group">
            <label className="form-label">模型文件夹路径</label>
            <div className="form-row">
              <input
                type="text"
                className="form-input"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="选择包含 .gguf 模型文件的文件夹"
              />
              <button className="btn btn-secondary" onClick={handleSelectFolder}>
                浏览
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              已检测到的模型 ({models.length})
            </label>
            <div className="model-list">
              {models.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <p className="empty-state-description">
                    {folderPath ? '未找到 .gguf 模型文件' : '请先选择模型文件夹'}
                  </p>
                </div>
              ) : (
                models.map(model => (
                  <div
                    key={model.fileName}
                    className={`model-item ${selectedModel === model.fileName ? 'selected' : ''}`}
                    onClick={() => handleSelectModel(model)}
                  >
                    <div className="model-item-radio" />
                    <div className="model-item-info">
                      <div className="model-item-name">{model.name}</div>
                      <div className="model-item-size">{model.sizeFormatted}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">llama-server 端口</label>
            <input
              type="number"
              className="form-input"
              value={llamaPort}
              onChange={(e) => setLlamaPort(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">上下文大小</label>
            <input
              type="number"
              className="form-input"
              value={ctxSize}
              onChange={(e) => setCtxSize(Number(e.target.value))}
            />
          </div>

          {message && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: message.includes('失败') ? 'rgba(248, 81, 73, 0.1)' : 'rgba(63, 185, 80, 0.1)',
              color: message.includes('失败') ? 'var(--z-state-error)' : 'var(--z-state-success)',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {message}
            </div>
          )}
        </div>
        <div className="model-settings-footer">
          <button className="btn btn-secondary" onClick={() => scanModels()}>
            {scanning ? '扫描中...' : '重新扫描'}
          </button>
          <button className="btn btn-secondary" onClick={handleRestartLlama} disabled={switching}>
            {switching ? '重启中...' : '重启 llama-server'}
          </button>
          <button className="btn btn-primary" onClick={handleApply} disabled={switching || !selectedModel}>
            {switching ? '切换中...' : '应用设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
