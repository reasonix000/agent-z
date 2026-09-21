import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import RightPanel from './components/RightPanel';
import StatusBar from './components/StatusBar';
import ModelSettings from './components/ModelSettings';
import ThemeProvider from './components/ThemeProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ThinkingStep {
  stage: string;
  message: string;
  status: 'active' | 'complete' | 'pending';
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'search' | 'thinking' | 'status' | 'memory'>('search');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setThinkingSteps([
      { stage: '搜索', message: '正在搜索相关内容...', status: 'active' }
    ]);

    try {
      const response = await fetch('http://127.0.0.1:5588/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          'session-id': 'z-desktop-' + Date.now(),
          history: messages.slice(-6)
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let currentEvent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            }
            if (line.startsWith('data: ') && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));
                switch (currentEvent) {
                  case 'search':
                    if (data.results) {
                      setSearchResults(prev => [...prev, ...data.results]);
                    }
                    setThinkingSteps(prev => prev.map((step, i) =>
                      i === 0 ? { ...step, status: 'complete' } : step
                    ));
                    break;
                  case 'chunk':
                    assistantContent += data.content || '';
                    break;
                  case 'status':
                    if (data.stage === 'generating') {
                      setThinkingSteps(prev => prev.map((step, i) =>
                        i === 0 ? { ...step, status: 'complete', message: '搜索完成' } : step
                      ));
                    }
                    break;
                  case 'done':
                    break;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
            if (line === '') {
              currentEvent = '';
            }
          }
        }
      }

      if (assistantContent) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: assistantContent,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsStreaming(false);
      setThinkingSteps([]);
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider>
      <div className="app-container">
        <TitleBar onSettings={() => setShowSettings(true)} />
        <div className="app-content">
          <Sidebar
            messages={messages}
            onNewChat={() => setMessages([])}
          />
          <ChatArea
            messages={messages}
            isStreaming={isStreaming}
            onSendMessage={handleSendMessage}
          />
          <RightPanel
            activeTab={rightPanelTab}
            onTabChange={setRightPanelTab}
            searchResults={searchResults}
            thinkingSteps={thinkingSteps}
          />
        </div>
        <StatusBar />
        {showSettings && (
          <ModelSettings onClose={() => setShowSettings(false)} />
        )}
      </div>
    </ThemeProvider>
  );
}
