import React from 'react';
import { AppState } from '../types';

interface StatusIndicatorProps {
  state: AppState;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state }) => {
  const getStatusClass = () => {
    switch (state) {
      case AppState.IDLE:
        return 'idle';
      case AppState.CONNECTING:
        return 'connecting';
      case AppState.CONNECTED:
        return 'connected';
      case AppState.DISCONNECTING:
        return 'disconnecting';
      case AppState.ERROR:
        return 'error';
      default:
        return 'idle';
    }
  };

  return (
    <div className={`status-dot ${getStatusClass()}`}></div>
  );
};

export default StatusIndicator;
