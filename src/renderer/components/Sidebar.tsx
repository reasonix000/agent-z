import React from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface SidebarProps {
  messages: Message[];
  onNewChat: () => void;
}

export default function Sidebar({ messages, onNewChat }: SidebarProps) {
  const conversations = [
    { id: '1', title: '新对话', active: true },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">会话列表</span>
        <button className="icon-button" onClick={onNewChat} title="新建对话">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z"/>
          </svg>
        </button>
      </div>
      <div className="sidebar-content">
        {conversations.map(conv => (
          <div
            key={conv.id}
            className={`sidebar-item ${conv.active ? 'active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 12, opacity: 0.5 }}>
              <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v8h8V4H4z"/>
            </svg>
            <span className="sidebar-item-text">{conv.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
