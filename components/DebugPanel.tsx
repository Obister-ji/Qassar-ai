import React, { useState, useEffect } from 'react';

interface DebugData {
  timestamp: string;
  event: string;
  source: string;
  destination: string;
  data: any;
}

const DebugPanel: React.FC = () => {
  const [debugLogs, setDebugLogs] = useState<DebugData[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Listen for debug events from window
    const handleDebugEvent = (event: CustomEvent) => {
      const newLog: DebugData = {
        timestamp: new Date().toLocaleTimeString(),
        event: event.detail.event,
        source: event.detail.source,
        destination: event.detail.destination,
        data: event.detail.data
      };
      
      setDebugLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
    };

    window.addEventListener('debug-event', handleDebugEvent as EventListener);
    
    return () => {
      window.removeEventListener('debug-event', handleDebugEvent as EventListener);
    };
  }, []);

  const clearLogs = () => {
    setDebugLogs([]);
  };

  const exportLogs = () => {
    const logsText = debugLogs.map(log => 
      `${log.timestamp} - ${log.event} | ${log.source} → ${log.destination}\n  Data: ${JSON.stringify(log.data, null, 2)}`
    ).join('\n\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>Debug & Testing Panel</h3>
        <div className="debug-controls">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="debug-toggle"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <button onClick={clearLogs} className="debug-clear">Clear</button>
          <button onClick={exportLogs} className="debug-export">Export</button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="debug-content">
          <div className="debug-workflows">
            <h4>Active Workflows</h4>
            <div className="workflow-item">
              <span className="workflow-name">Voice Input → Agora</span>
              <span className="workflow-status active">Active</span>
            </div>
            <div className="workflow-item">
              <span className="workflow-name">Agora → N8N Webhook</span>
              <span className="workflow-status active">Active</span>
            </div>
            <div className="workflow-item">
              <span className="workflow-name">N8N → Eleven Labs TTS</span>
              <span className="workflow-status active">Active</span>
            </div>
            <div className="workflow-item">
              <span className="workflow-name">Eleven Labs → Agora</span>
              <span className="workflow-status active">Active</span>
            </div>
          </div>
          
          <div className="debug-logs">
            <h4>Event Logs</h4>
            <div className="logs-container">
              {debugLogs.length === 0 ? (
                <div className="no-logs">No events logged yet. Start a conversation to see the data flow.</div>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className="log-entry">
                    <div className="log-header">
                      <span className="log-time">{log.timestamp}</span>
                      <span className="log-event">{log.event}</span>
                    </div>
                    <div className="log-flow">
                      <span className="log-source">{log.source}</span>
                      <span className="log-arrow">→</span>
                      <span className="log-destination">{log.destination}</span>
                    </div>
                    <div className="log-data">
                      <pre>{JSON.stringify(log.data, null, 2)}</pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;