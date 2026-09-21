import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
}

export default function ChatArea({ messages, isStreaming, onSendMessage }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-area">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 48 48" fill="currentColor">
              <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.82 0-16-7.18-16-16S15.18 8 24 8s16 7.18 16 16-7.18 16-16 16z"/>
              <path d="M24 12c-6.62 0-12 5.38-12 12s5.38 12 12 12 12-5.38 12-12-5.38-12-12-12zm0 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            <h3 className="empty-state-title">开始对话</h3>
            <p className="empty-state-description">
              输入问题，智能体Z将为你搜索互联网并提供答案
            </p>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className="message">
              <div className={`message-avatar ${message.role}`}>
                {message.role === 'user' ? '你' : 'Z'}
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}
        {isStreaming && (
          <div className="message">
            <div className="message-avatar assistant">Z</div>
            <div className="message-content">
              <div className="spinner" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-container">
        <form className="chat-input-wrapper" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题..."
            rows={1}
            disabled={isStreaming}
          />
          <button
            type="submit"
            className="chat-send-button"
            disabled={!input.trim() || isStreaming}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M15.854 8.354a.5.5 0 000-.708l-5-5a.5.5 0 10-.708.708L14.293 7.5H1a.5.5 0 000 1h13.293l-4.147 4.146a.5.5 0 00.708.708l5-5z"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
