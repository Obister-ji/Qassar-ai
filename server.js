// Load environment variables
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const fetch = require('node-fetch');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- AGORA CONFIGURATION ---
// You can get these values from your Agora project dashboard.
const APP_ID = process.env.AGORA_APP_ID;
// IMPORTANT: You MUST fill in your App Certificate here for token generation.
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID;
const CUSTOMER_SECRET = process.env.AGORA_CUSTOMER_SECRET;

// --- N8N WEBHOOK URL ---
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// --- ELEVEN LABS TTS CONFIGURATION ---
// Eleven Labs API Key - valid format starting with sk-
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;


// Generate Base64 credentials for Agora RESTful API authentication.
const credentials = Buffer.from(`${CUSTOMER_ID}:${CUSTOMER_SECRET}`).toString('base64');

// --- API ENDPOINTS ---

/**
 * @name /generate-token
 * @description Generates an Agora RTC token for the client to join a channel.
 */
app.post('/generate-token', (req, res) => {
    const { channelName } = req.body;
    
    if (!APP_CERTIFICATE || APP_CERTIFICATE === 'your_agora_app_certificate_here') {
        return res.status(500).json({ error: 'Agora App Certificate is not configured in server.js.' });
    }
    
    // Use a fixed UID for the user or generate one. Using 0 allows any UID.
    const uid = 0; 
    const role = RtcRole.PUBLISHER;
    // Token validity period in seconds.
    const expirationTimeInSeconds = 3600; 
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    console.log(`Generating token for channel: ${channelName}`);
    
    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            role,
            privilegeExpiredTs
        );
        
        console.log('Token generated successfully.');
        res.json({ token });
    } catch (error) {
        console.error('Token generation failed:', error);
        res.status(500).json({ error: 'Failed to generate RTC token.' });
    }
});

/**
 * @name /start-agent
 * @description Starts the Agora Conversational AI agent and connects it to the channel.
 */
app.post('/start-agent', async (req, res) => {
    const { channelName, token } = req.body;
    
    // Log incoming request details
    console.log('=== AGENT START REQUEST ===');
    console.log('Channel Name:', channelName);
    console.log('Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'Missing');
    console.log('N8N Webhook URL:', N8N_WEBHOOK_URL);
    console.log('Eleven Labs Voice ID:', ELEVENLABS_VOICE_ID);
    
    const agentConfig = {
        name: `agent_elevenlabs_${Date.now()}`,
        properties: {
            channel: channelName,
            token: token,
            // The UID for the AI agent. Use a unique value not used by users.
            agent_rtc_uid: "1",
            remote_rtc_uids: ["0"], // Listen to the user (UID 0)
            enable_string_uid: false,
            idle_timeout: 300,
            // Explicitly set agent to not be muted
            mute_agent: false,
            llm: {
                // Point to your N8N webhook.
                url: N8N_WEBHOOK_URL,
                api_key: "dummy_key", // Required by Agora, but not used by N8N.
                system_messages: [{
                    role: "system",
                    content: "You are a helpful and friendly support assistant."
                }],
                greeting_message: "Hi, I am Shopi from Flame AI. How can I assist you today?",
                failure_message: "I'm sorry, I'm having a little trouble right now. Could you please repeat that?",
                max_history: 10,
                params: {
                    model: "gpt-4" // Required by Agora, even for custom endpoints.
                }
            },
            asr: {
                language: "en-US"
            },
            tts: {
                vendor: "elevenlabs",
                params: {
                    key: ELEVENLABS_API_KEY,
                    voice_id: ELEVENLABS_VOICE_ID,
                }
            }
        }
    };

    try {
        console.log('Starting AI agent...');
        console.log('Agent configuration:', JSON.stringify(agentConfig, null, 2));
        console.log('Raw API Key:', JSON.stringify(ELEVENLABS_API_KEY));
        console.log('API Key type:', typeof ELEVENLABS_API_KEY);
        console.log('API Key length:', ELEVENLABS_API_KEY ? ELEVENLABS_API_KEY.length : 'undefined');
        // Simple format check - Eleven Labs API key should start with 'sk_'
        const isValidFormat = ELEVENLABS_API_KEY && ELEVENLABS_API_KEY.length > 10 && ELEVENLABS_API_KEY.substring(0, 3) === 'sk_';
        console.log('Eleven Labs API Key format check:', isValidFormat ? 'Valid format' : 'Invalid format - should start with sk_');
        console.log('API Key first 10 characters:', ELEVENLABS_API_KEY ? ELEVENLABS_API_KEY.substring(0, 10) + '...' : 'Missing');
        
        console.log('=== CALLING AGORA API ===');
        console.log('API Endpoint:', `https://api.agora.io/api/conversational-ai-agent/v2/projects/${APP_ID}/join`);
        console.log('Agent Name:', agentConfig.name);
        console.log('LLM URL (N8N Webhook):', agentConfig.properties.llm.url);
        
        const response = await fetch(
            `https://api.agora.io/api/conversational-ai-agent/v2/projects/${APP_ID}/join`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(agentConfig)
            }
        );
        
        const responseData = await response.json();

        if (!response.ok) {
            console.error('=== AGORA API ERROR ===');
            console.error('Status:', response.status);
            console.error('Response:', responseData);
            throw new Error(`Agora API responded with status ${response.status}: ${responseData.message || 'Unknown error'}`);
        }
        
        console.log('=== AGENT STARTED SUCCESSFULLY ===');
        console.log('Agent ID:', responseData.agent_id);
        console.log('Agent Status:', responseData.status);
        console.log('N8N Webhook URL:', agentConfig.properties.llm.url);
        console.log('Eleven Labs Voice ID:', agentConfig.properties.tts.params.voice_id);
        console.log('NOTE: Audio will be processed: User Speech → Agora ASR → N8N → N8N AI → Eleven Labs TTS → Agora → User Speakers');
        res.status(response.status).json(responseData);
        
    } catch (error) {
        console.error('Failed to start agent:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @name /stop-agent
 * @description Stops the AI agent and removes it from the channel.
 */
app.post('/stop-agent', async (req, res) => {
    const { agentId } = req.body;
    
    try {
        console.log(`Stopping agent with ID: ${agentId}`);
        const response = await fetch(
            `https://api.agora.io/api/conversational-ai-agent/v2/projects/${APP_ID}/agents/${agentId}/leave`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error stopping agent from Agora API:', errorData);
            throw new Error(`Agora API responded with status ${response.status}`);
        }

        console.log('Agent stopped successfully.');
        res.json({ success: true });
        
    } catch (error) {
        console.error('Failed to stop agent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test endpoint to simulate N8N webhook data
app.post('/test-n8n-webhook', (req, res) => {
    console.log('=== N8N WEBHOOK TEST ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Raw Body:', JSON.stringify(req.body, null, 2));
    
    // Simulate what N8N would receive and send to Eleven Labs
    console.log('=== N8N WEBHOOK RESPONSE FORMAT FOR ELEVEN LABS ===');
    console.log('Eleven Labs expects this format from N8N:');
    console.log(JSON.stringify({
        text: "Response text to be converted to speech",
        voice_id: "PAmWeNVsaTzquebdo8ay", // Your configured voice ID
        model_id: "eleven_multilingual_v2", // Optional: model for voice generation
        voice_settings: {
            stability: 0.75, // Optional: voice stability [0-1]
            similarity_boost: 0.75, // Optional: voice clarity [0-1]
            style: "conversation", // Optional: voice style
            use_speaker_boost: false // Optional: speaker boost
        }
    }, null, 2));
    
    // Simulate what N8N would receive
    const n8nResponse = {
        text: "This is a test response from N8N",
        audio_url: null,
        status: "success"
    };
    
    console.log('=== SENDING RESPONSE BACK ===');
    console.log('Response:', n8nResponse);
    
    res.json(n8nResponse);
});

/**
 * @name /chat-message
 * @description Handles chat messages from the frontend and sends them to N8N
 */
app.post('/chat-message', async (req, res) => {
    console.log('=== CHAT MESSAGE RECEIVED ===');
    console.log('Message:', req.body.text);
    console.log('User ID:', req.body.user_id);
    console.log('Timestamp:', req.body.timestamp);
    
    try {
        // Send the chat message to your N8N webhook
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: req.body.text,
                user_id: req.body.user_id,
                channel: req.body.channel || 'chat_channel',
                timestamp: req.body.timestamp,
                session_id: req.body.session_id || 'chat_session_' + Date.now()
            })
        });

        if (n8nResponse.ok) {
            const n8nData = await n8nResponse.json();
            console.log('=== N8N RESPONSE ===');
            console.log('Response:', n8nData);
            
            // Return the N8N response to the frontend
            res.json({
                text: n8nData.text || 'I received your message.',
                status: n8nData.status || 'success',
                audio_url: n8nData.audio_url || null
            });
        } else {
            console.error('N8N webhook error:', n8nResponse.status);
            const errorText = await n8nResponse.text();
            console.error('Error response:', errorText);
            
            // Fallback response for now - return a simple AI-like response
            res.json({
                text: `I understand you said: "${req.body.text}". I'm your AI assistant and I'm here to help you!`,
                status: 'success',
                audio_url: null
            });
        }
    } catch (error) {
        console.error('Error sending chat message to N8N:', error);
        res.status(500).json({
            text: 'Sorry, I encountered an error while processing your message.',
            status: 'error'
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`Test N8N webhook at: http://localhost:${PORT}/test-n8n-webhook`);
    console.log(`Chat message endpoint: http://localhost:${PORT}/chat-message`);
});
