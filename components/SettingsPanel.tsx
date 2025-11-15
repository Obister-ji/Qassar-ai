import React, { useState } from 'react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    audioQuality: 'high',
    noiseReduction: true,
    autoReconnect: true,
    notifications: true,
    theme: 'dark'
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close settings">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <div className="settings-content">
          {/* Audio Settings */}
          <div className="settings-section">
            <h3>Audio Settings</h3>
            
            <div className="setting-item">
              <label htmlFor="audioQuality">Audio Quality</label>
              <select 
                id="audioQuality"
                value={settings.audioQuality}
                onChange={(e) => handleSettingChange('audioQuality', e.target.value)}
                className="setting-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.noiseReduction}
                  onChange={(e) => handleSettingChange('noiseReduction', e.target.checked)}
                  className="setting-checkbox"
                />
                <span className="checkbox-custom"></span>
                Noise Reduction
              </label>
            </div>
          </div>

          {/* Connection Settings */}
          <div className="settings-section">
            <h3>Connection</h3>
            
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoReconnect}
                  onChange={(e) => handleSettingChange('autoReconnect', e.target.checked)}
                  className="setting-checkbox"
                />
                <span className="checkbox-custom"></span>
                Auto Reconnect
              </label>
            </div>

            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  className="setting-checkbox"
                />
                <span className="checkbox-custom"></span>
                Enable Notifications
              </label>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="settings-section">
            <h3>Appearance</h3>
            
            <div className="setting-item">
              <label htmlFor="theme">Theme</label>
              <select 
                id="theme"
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="setting-select"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="save-btn" onClick={onClose}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;