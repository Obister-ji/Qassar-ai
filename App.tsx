import React, { useState, useEffect } from 'react';
import { useAgora } from './hooks/useAgora';
import { AppState } from './types';
import ControlButton from './components/ControlButton';
import StatusIndicator from './components/StatusIndicator';
import MicIcon from './components/MicIcon';
import PhoneIcon from './components/PhoneIcon';
import SettingsIcon from './components/SettingsIcon';
import SettingsPanel from './components/SettingsPanel';
import DebugPanel from './components/DebugPanel';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const { appState, statusText, join, leave, isMuted } = useAgora();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Debug event dispatcher
  useEffect(() => {
    // Override fetch to log API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const urlStr = url.toString();
      
      // Log fetch requests
      if (urlStr.includes('localhost:3000')) {
        const event = new CustomEvent('debug-event', {
          detail: {
            event: 'API_CALL',
            source: 'Frontend',
            destination: 'Backend',
            data: {
              url: urlStr,
              method: options?.method || 'GET',
              body: options?.body && typeof options.body === 'string' ? JSON.parse(options.body) : null
            }
          }
        });
        window.dispatchEvent(event);
      }

      try {
        const response = await originalFetch(...args);
        
        // Log responses
        if (urlStr.includes('localhost:3000')) {
          const clonedResponse = response.clone();
          const responseData = await clonedResponse.json();
          
          const event = new CustomEvent('debug-event', {
            detail: {
              event: 'API_RESPONSE',
              source: 'Backend',
              destination: 'Frontend',
              data: {
                url: urlStr,
                status: response.status,
                data: responseData
              }
            }
          });
          window.dispatchEvent(event);
        }
        
        return response;
      } catch (error: any) {
        const event = new CustomEvent('debug-event', {
          detail: {
            event: 'API_ERROR',
            source: 'Backend',
            destination: 'Frontend',
            data: {
              url: urlStr,
              error: error.message
            }
          }
        });
        window.dispatchEvent(event);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const isLoading = appState === AppState.CONNECTING || appState === AppState.DISCONNECTING;
  const isConnected = appState === AppState.CONNECTED;

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  const toggleChat = () => {
    setShowChat(!showChat);
  };

  const handleSendMessage = (message: string) => {
    // Log chat message
    const event = new CustomEvent('debug-event', {
      detail: {
        event: 'CHAT_MESSAGE',
        source: 'User',
        destination: 'AI Assistant',
        data: { message }
      }
    });
    window.dispatchEvent(event);
    
    // Here you would typically send the message to your backend/AI service
    console.log('Chat message:', message);
  };

  // Log user interactions
  const handleJoin = () => {
    const event = new CustomEvent('debug-event', {
      detail: {
        event: 'USER_ACTION',
        source: 'User',
        destination: 'Agora',
        data: { action: 'START_CONVERSATION' }
      }
    });
    window.dispatchEvent(event);
    join();
  };

  const handleLeave = () => {
    const event = new CustomEvent('debug-event', {
      detail: {
        event: 'USER_ACTION',
        source: 'User',
        destination: 'Agora',
        data: { action: 'END_CONVERSATION' }
      }
    });
    window.dispatchEvent(event);
    leave();
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="agent-info">
            <div className="agent-avatar">
              <div className="avatar-glow"></div>
              <svg className="agent-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
              </svg>
            </div>
            <div className="agent-details">
              <h1 className="agent-name">AI Assistant</h1>
              <span className="agent-status">Online</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="voice-call-btn" aria-label="Voice call">
              <svg className="voice-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" fill="currentColor"/>
              </svg>
            </button>
            <button className={`chat-btn ${showChat ? 'active' : ''}`} onClick={toggleChat} aria-label="Chat">
              <svg className="chat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/>
              </svg>
            </button>
            <button className="settings-btn" onClick={toggleSettings} aria-label="Settings">
              <SettingsIcon />
            </button>
            <button className="debug-btn" onClick={toggleDebug} aria-label="Debug">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0 2h-2v2h2v-2z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {showChat ? (
          <div className="chat-container">
            <ChatInterface
              onSendMessage={handleSendMessage}
              disabled={false}
            />
          </div>
        ) : (
          <div className="status-container">
            <div className="status-indicator">
              <StatusIndicator state={appState} />
            </div>
            
            <p className="status-text">
              {statusText}
            </p>

            {/* Voice Visualizer */}
            <div className={`voice-visualizer ${isConnected && !isMuted ? '' : 'inactive'}`}>
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
              <div className="visualizer-bar"></div>
            </div>

            {/* Microphone Visual Indicator */}
            <div className="mic-visual-container">
              <div className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-300 ${isConnected ? 'bg-blue-500/20' : 'bg-gray-800'}`}>
                {isConnected && !isMuted && (
                  <div className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping"></div>
                )}
                <div className={`relative flex items-center justify-center w-24 h-24 rounded-full ${isConnected ? 'bg-blue-500' : 'bg-gray-700'}`}>
                  <MicIcon className={`w-10 h-10 transition-colors duration-300 ${isConnected ? 'text-white' : 'text-gray-400'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="control-container">
          {showChat ? (
            <ControlButton onClick={toggleChat} variant="primary">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
              </svg>
              Back to Voice
            </ControlButton>
          ) : (
            <>
              {appState === AppState.IDLE || appState === AppState.ERROR ? (
                <ControlButton onClick={handleJoin} disabled={isLoading} variant="primary">
                  <PhoneIcon className="w-5 h-5"/>
                  Start Conversation
                </ControlButton>
              ) : (
                <ControlButton onClick={handleLeave} disabled={isLoading} variant="danger">
                  <PhoneIcon className="w-5 h-5 transform rotate-[135deg]"/>
                  End Conversation
                </ControlButton>
              )}
            </>
          )}
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
};

export default App;
