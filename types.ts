
// Using 'any' for Agora types as we are loading the SDK via a script tag
// and don't have the type definitions installed.
export type AgoraClient = any; 
export type LocalAudioTrack = any;
export type RemoteUser = any;

export enum AppState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTING = 'DISCONNECTING',
  ERROR = 'ERROR',
}
