import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    electronAPI: {
      backend: {
        getStatus: () => Promise<{ running: boolean; port: number }>;
      };
      llama: {
        start: () => Promise<{ success: boolean; error?: string }>;
        stop: () => Promise<{ success: boolean }>;
      };
      models: {
        getStatus: () => Promise<{ running: boolean; model: string; port: number }>;
      };
    };
  }
}

export default function StatusBar() {
  const [backendStatus, setBackendStatus] = useState<{ running: boolean; port: number }>({
    running: false,
    port: 0
  });
  const [llamaStatus, setLlamaStatus] = useState<{ running: boolean; model: string }>({
    running: false,
    model: ''
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const backend = await window.electronAPI.backend.getStatus();
        setBackendStatus(backend);
        
        const llama = await window.electronAPI.models.getStatus();
        setLlamaStatus(llama);
      } catch (e) {
        // Ignore errors
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <div className="status-indicator">
          <div className={`status-dot ${backendStatus.running ? '' : 'disconnected'}`} />
          <span>服务器 {backendStatus.running ? '已连接' : '未连接'}</span>
        </div>
        <div className="status-indicator">
          <div className={`status-dot ${llamaStatus.running ? '' : 'disconnected'}`} />
          <span>模型 {llamaStatus.running ? (llamaStatus.model || '已加载') : '未加载'}</span>
        </div>
      </div>
      <div className="status-bar-right">
        <span>端口 {backendStatus.port || 5588}</span>
        <span>Z v1.0.0</span>
      </div>
    </div>
  );
}
