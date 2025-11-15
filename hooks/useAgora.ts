import { useState, useRef, useCallback, useEffect } from 'react';
import { AppState, AgoraClient, LocalAudioTrack, RemoteUser } from '../types';
import { BACKEND_URL, AGORA_APP_ID } from '../constants';

// This declaration informs TypeScript that AgoraRTC is a global variable
// provided by the script tag in index.html.
declare const AgoraRTC: any;

export const useAgora = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [statusText, setStatusText] = useState('Status: Disconnected');
  const [isMuted, setIsMuted] = useState(true);

  const client = useRef<AgoraClient | null>(null);
  const localAudioTrack = useRef<LocalAudioTrack | null>(null);
  const agentId = useRef<string | null>(null);
  const channelName = useRef<string | null>(null);

  const handleUserPublished = useCallback(async (user: RemoteUser, mediaType: 'audio' | 'video') => {
    try {
      await client.current.subscribe(user, mediaType);
      if (mediaType === 'audio') {
        user.audioTrack.play();
        setAppState(AppState.CONNECTED);
        setStatusText('Status: AI Agent connected');
        console.log('Subscribed to and playing AI agent audio:', user.uid);

        // Log audio connection
        const audioEvent = new CustomEvent('debug-event', {
          detail: {
            event: 'AUDIO_CONNECTED',
            source: 'Agora',
            destination: 'Frontend',
            data: {
              userId: user.uid,
              mediaType: 'audio',
              state: 'CONNECTED'
            }
          }
        });
        window.dispatchEvent(audioEvent);
      }
    } catch (error) {
      console.error('Failed to subscribe to remote user', error);
      setAppState(AppState.ERROR);
      setStatusText('Error: Could not connect to agent');
    }
  }, []);

  const join = useCallback(async () => {
    if (appState !== AppState.IDLE && appState !== AppState.ERROR) return;
    
    setAppState(AppState.CONNECTING);
    setStatusText('Status: Initializing...');

    try {
      if (!AGORA_APP_ID) {
         throw new Error("Agora App ID is not configured. Please set it in constants.ts.");
      }
      if (!BACKEND_URL || BACKEND_URL === 'https://your-backend-server.com') {
         throw new Error("Backend URL is not configured. Please update it in constants.ts.");
      }

      channelName.current = `support_session_${Date.now()}`;
      setStatusText('Status: Getting token...');

      const tokenResponse = await fetch(`${BACKEND_URL}/generate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: channelName.current, uid: null }),
      });

      // Log token request
      const event = new CustomEvent('debug-event', {
        detail: {
          event: 'TOKEN_REQUEST',
          source: 'Frontend',
          destination: 'Backend',
          data: { channelName: channelName.current }
        }
      });
      window.dispatchEvent(event);

      if (!tokenResponse.ok) throw new Error('Failed to fetch token from backend.');
      const { token } = await tokenResponse.json();

      client.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      client.current.on('user-published', handleUserPublished);

      setStatusText('Status: Joining channel...');
      await client.current.join(AGORA_APP_ID, channelName.current, token, null);

      setStatusText('Status: Starting microphone...');
      localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
      
      // Monitor volume to provide visual feedback
      localAudioTrack.current.on("volume-indicator", (result: { level: number }) => {
          setIsMuted(result.level === 0);
      });
      
      await client.current.publish([localAudioTrack.current]);
      setIsMuted(false);

      setStatusText('Status: Starting AI agent...');
      const agentResponse = await fetch(`${BACKEND_URL}/start-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: channelName.current, token }),
      });

      // Log agent start request
      const startEvent = new CustomEvent('debug-event', {
        detail: {
          event: 'AGENT_START_REQUEST',
          source: 'Frontend',
          destination: 'Backend',
          data: { channelName: channelName.current, token: token.substring(0, 20) + '...' }
        }
      });
      window.dispatchEvent(startEvent);
      
      if (!agentResponse.ok) throw new Error('Failed to start AI agent.');
      const agentData = await agentResponse.json();
      agentId.current = agentData.agent_id;

      console.log('AI Agent started with ID:', agentId.current);
      setStatusText('Status: Waiting for AI Agent to join...');

      // Log agent started
      const startedEvent = new CustomEvent('debug-event', {
        detail: {
          event: 'AGENT_STARTED',
          source: 'Backend',
          destination: 'Agora',
          data: {
            agentId: agentData.agent_id,
            status: agentData.status,
            n8nWebhook: `${process.env.N8N_WEBHOOK_URL || 'configured'}`,
            elevenLabsVoice: process.env.ELEVENLABS_VOICE_ID || 'configured'
          }
        }
      });
      window.dispatchEvent(startedEvent);

    } catch (error: any) {
      console.error('Error during connection process:', error);
      setAppState(AppState.ERROR);
      setStatusText(`Error: ${error.message}`);
      await leave(); // Attempt to clean up resources on failure
    }
  }, [appState, handleUserPublished]);

  const leave = useCallback(async () => {
    setAppState(AppState.DISCONNECTING);
    setStatusText('Status: Disconnecting...');

    try {
      if (agentId.current) {
        if (BACKEND_URL && BACKEND_URL !== 'https://your-backend-server.com') {
            await fetch(`${BACKEND_URL}/stop-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: agentId.current }),
            });

            // Log agent stop request
            const stopEvent = new CustomEvent('debug-event', {
              detail: {
                event: 'AGENT_STOP_REQUEST',
                source: 'Frontend',
                destination: 'Backend',
                data: { agentId: agentId.current }
              }
            });
            window.dispatchEvent(stopEvent);
        }
        agentId.current = null;
        console.log('AI Agent stopped.');
      }
    } catch (error) {
      console.error('Error stopping agent:', error);
      // Don't halt the leave process, just log the error
    }

    if (localAudioTrack.current) {
      localAudioTrack.current.stop();
      localAudioTrack.current.close();
      localAudioTrack.current = null;
      setIsMuted(true);
    }
    
    if (client.current) {
      client.current.off('user-published', handleUserPublished);
      await client.current.leave();
      client.current = null;
    }
    
    setAppState(AppState.IDLE);
    setStatusText('Status: Disconnected');
    console.log('Successfully disconnected.');
  }, [handleUserPublished]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (client.current) {
        leave();
      }
    };
  }, [leave]);

  return { appState, statusText, isMuted, join, leave };
};
