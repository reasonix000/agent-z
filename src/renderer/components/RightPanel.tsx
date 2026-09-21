import React, { useState, useEffect } from 'react';

interface ThinkingStep {
  stage: string;
  message: string;
  status: 'active' | 'complete' | 'pending';
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  engine: string;
}

interface SystemStatus {
  backend: { running: boolean; port: number };
  llama: { running: boolean; model: string; port: number };
}

interface MemoryFact {
  content: string;
  type: string;
}

interface RightPanelProps {
  activeTab: 'search' | 'thinking' | 'status' | 'memory';
  onTabChange: (tab: 'search' | 'thinking' | 'status' | 'memory') => void;
  searchResults: SearchResult[];
  thinkingSteps: ThinkingStep[];
}

declare global {
  interface Window {
    electronAPI: {
      backend: {
        getStatus: () => Promise<{ running: boolean; port: number }>;
      };
      models: {
        getStatus: () => Promise<{ running: boolean; model: string; port: number }>;
      };
      shell: {
        openExternal: (url: string) => Promise<void>;
      };
    };
  }
}

export default function RightPanel({
  activeTab,
  onTabChange,
  searchResults,
  thinkingSteps
}: RightPanelProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    backend: { running: false, port: 5588 },
    llama: { running: false, model: '', port: 8081 }
  });
  const [memoryFacts, setMemoryFacts] = useState<MemoryFact[]>([]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const backend = await window.electronAPI.backend.getStatus();
        const llama = await window.electronAPI.models.getStatus();
        setSystemStatus({ backend, llama });
      } catch (e) {
        // Ignore
      }
    };

    const fetchMemory = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5588/api/memory/search?q=');
        const data = await res.json();
        setMemoryFacts(data.results || []);
      } catch (e) {
        // Ignore
      }
    };

    fetchStatus();
    fetchMemory();
    const interval = setInterval(() => {
      fetchStatus();
      fetchMemory();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="right-panel">
      <div className="right-panel-tabs">
        <button
          className={`right-panel-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => onTabChange('search')}
        >
          搜索结果
        </button>
        <button
          className={`right-panel-tab ${activeTab === 'thinking' ? 'active' : ''}`}
          onClick={() => onTabChange('thinking')}
        >
          思考过程
        </button>
        <button
          className={`right-panel-tab ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => onTabChange('status')}
        >
          状态
        </button>
        <button
          className={`right-panel-tab ${activeTab === 'memory' ? 'active' : ''}`}
          onClick={() => onTabChange('memory')}
        >
          记忆
        </button>
      </div>
      <div className="right-panel-content">
        {activeTab === 'search' && (
          <div>
            {searchResults.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-description">暂无搜索结果</p>
              </div>
            ) : (
              [...searchResults].reverse().map((result, index) => (
                <div key={index} className="search-result-item">
                  <div className="search-result-title">{result.title}</div>
                  <div
                    className="search-result-url clickable"
                    onClick={() => result.url && window.electronAPI.shell.openExternal(result.url)}
                  >
                    {result.url}
                  </div>
                  <div className="search-result-snippet">{result.snippet}</div>
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === 'thinking' && (
          <div>
            {thinkingSteps.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-description">暂无思考过程</p>
              </div>
            ) : (
              thinkingSteps.map((step, index) => (
                <div key={index} className="thinking-step">
                  <div className={`thinking-step-indicator ${step.status}`}>
                    {step.status === 'complete' ? '✓' : step.status === 'active' ? '...' : (index + 1)}
                  </div>
                  <div className="thinking-step-content">
                    <div className="thinking-step-stage">{step.stage}</div>
                    <div className="thinking-step-message">{step.message}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === 'status' && (
          <div className="status-panel">
            <div className="status-item">
              <div className={`status-dot ${systemStatus.backend.running ? '' : 'disconnected'}`} />
              <div>
                <div className="status-label">后端服务器</div>
                <div className="status-value">
                  {systemStatus.backend.running ? `运行中 (端口 ${systemStatus.backend.port})` : '未连接'}
                </div>
              </div>
            </div>
            <div className="status-item">
              <div className={`status-dot ${systemStatus.llama.running ? '' : 'disconnected'}`} />
              <div>
                <div className="status-label">LLM 模型</div>
                <div className="status-value">
                  {systemStatus.llama.running
                    ? `${systemStatus.llama.model || '已加载'} (端口 ${systemStatus.llama.port})`
                    : '未加载'}
                </div>
              </div>
            </div>
            <div className="status-item">
              <div className="status-dot" />
              <div>
                <div className="status-label">版本</div>
                <div className="status-value">Z v1.0.0</div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'memory' && (
          <div>
            {memoryFacts.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-description">暂无记忆内容</p>
              </div>
            ) : (
              memoryFacts.map((fact, index) => (
                <div key={index} className="memory-item">
                  <div className="memory-content">{fact.content}</div>
                  <div className="memory-type">{fact.type}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
