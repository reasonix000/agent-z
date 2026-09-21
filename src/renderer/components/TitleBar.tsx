import React from 'react';

interface TitleBarProps {
  onSettings: () => void;
}

declare global {
  interface Window {
    electronAPI: {
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
      };
    };
  }
}

export default function TitleBar({ onSettings }: TitleBarProps) {
  const handleMinimize = async () => {
    await window.electronAPI.window.minimize();
  };

  const handleMaximize = async () => {
    await window.electronAPI.window.maximize();
  };

  const handleClose = async () => {
    await window.electronAPI.window.close();
  };

  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect width="20" height="20" rx="4" fill="var(--z-brand-primary)"/>
          <path d="M5 14V6h3c2 0 3 1 3 2.5S10 11 8 11H7v3H5zm2-5h1c1 0 1.5-.5 1.5-1.5S9 7 8 7H7v2z" fill="white"/>
          <path d="M12 14V6h2v8h-2z" fill="white"/>
          <path d="M15 14V6h2v1.5h-1c-.5 0-1 .2-1 1v5.5h-2z" fill="white"/>
        </svg>
        <span className="title-bar-title">Z - 智能体Z</span>
      </div>
      <div className="title-bar-right">
        <button className="title-bar-button" onClick={onSettings} title="设置">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 10a2 2 0 100-4 2 2 0 000 4z"/>
            <path d="M9.4 1.1L8.7 0H7.3l-.7 1.1c-.3.4-.6.8-.9 1.2l-1.1-.4-1.4 1.4.4 1.1c-.4.3-.8.6-1.2.9L0 5.3v1.4l1.1.7c.4.3.8.6 1.2.9l-.4 1.1 1.4 1.4 1.1-.4c.3.4.6.8.9 1.2L7.3 13h1.4l.7-1.1c.3-.4.6-.8.9-1.2l1.1.4 1.4-1.4-.4-1.1c.4-.3.8-.6 1.2-.9L14 6.7V5.3l-1.1-.7c-.4-.3-.8-.6-.9-1.2l.4-1.1-1.4-1.4-1.1.4c-.3-.4-.6-.8-.9-1.2zM8 5.5c1.4 0 2.5 1.1 2.5 2.5S9.4 10.5 8 10.5 5.5 9.4 5.5 8 6.6 5.5 8 5.5z"/>
          </svg>
        </button>
        <button className="title-bar-button" onClick={handleMinimize} title="最小化">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 8h10v1H3z"/>
          </svg>
        </button>
        <button className="title-bar-button" onClick={handleMaximize} title="最大化">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 3h10v10H3V3zm1 1v8h8V4H4z"/>
          </svg>
        </button>
        <button className="title-bar-button close" onClick={handleClose} title="关闭">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
