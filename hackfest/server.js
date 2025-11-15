require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

// Note: Agora Conversational AI SDK is a placeholder for demonstration
// In production, you would integrate the actual Agora Conversational AI SDK
// For now, we'll simulate the AI processing

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, 'public')));

// Configuration
const PORT = process.env.PORT || 3001;
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const AGORA_CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID;
const AGORA_CUSTOMER_SECRET = process.env.AGORA_CUSTOMER_SECRET;

// Store active conversation sessions
const activeSessions = new Map();

// Simulated AI Service (replace with actual Agora Conversational AI SDK)
let conversationService = null;

async function initializeConversationService() {
    try {
        // Simulated initialization - replace with actual Agora Conversational AI SDK
        conversationService = {
            createSession: async (config) => {
                return {
                    sessionId: `session_${Date.now()}`,
                    processAudio: async (data) => {
                        return await simulateAIResponse(data.audio || data.text);
                    },
                    processText: async (data) => {
                        return await simulateAIResponse(data.text);
                    },
                    destroy: async () => {
                        console.log('🗑️ Session destroyed');
                    }
                };
            }
        };

        console.log('✅ Simulated AI service initialized');
        console.log('📝 Note: Replace with actual Agora Conversational AI SDK in production');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize AI service:', error);
        return false;
    }
}

// Simulated AI response function
async function simulateAIResponse(input) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const responses = [
        "I understand your question. Let me help you with that.",
        "That's an interesting point! Here's what I think...",
        "Based on what you've told me, I would suggest...",
        "I can definitely assist you with this. Let me explain...",
        "Great question! Here's my analysis...",
        "I see what you're asking. Let me provide some insights...",
        "That's a thoughtful inquiry. Here's my perspective...",
        "I appreciate you asking. Let me help you understand...",
        "Let me think about this and give you a comprehensive response..."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // In production, this would be actual LLM and TTS processing
    return {
        text: randomResponse,
        audio: null, // Would contain base64 audio in production
        isFinal: true
    };
}

// WebSocket server for real-time communication
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('🔗 New WebSocket connection established');
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'join_channel':
                    await handleJoinChannel(ws, data);
                    break;
                case 'leave_channel':
                    await handleLeaveChannel(ws, data);
                    break;
                case 'audio_data':
                    await handleAudioData(ws, data);
                    break;
                case 'text_message':
                    await handleTextMessage(ws, data);
                    break;
                default:
                    console.log('⚠️ Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('❌ Error processing WebSocket message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message'
            }));
        }
    });

    ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        cleanupSession(ws);
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        cleanupSession(ws);
    });
});

// Handle channel join
async function handleJoinChannel(ws, data) {
    try {
        const { channelName, token, uid } = data;
        
        if (!conversationService) {
            throw new Error('Conversation service not initialized');
        }

        // Create new conversation session
        const session = await conversationService.createSession({
            channelName,
            uid: uid.toString(),
            token: token,
            enableVoice: true,
            enableText: true,
            language: 'en-US',
            voiceSettings: {
                provider: 'azure',
                voice: 'en-US-JennyNeural',
                speed: 1.0,
                pitch: 1.0
            },
            llmSettings: {
                provider: 'openai',
                model: 'gpt-4',
                maxTokens: 1000,
                temperature: 0.7,
                systemPrompt: `You are a helpful AI assistant. Be concise, friendly, and professional. 
                Respond naturally and conversationally. Keep responses under 150 words unless more detail is needed.`
            }
        });

        // Store session
        activeSessions.set(ws, {
            session,
            channelName,
            uid,
            startTime: Date.now()
        });

        // Send success response
        ws.send(JSON.stringify({
            type: 'channel_joined',
            success: true,
            sessionId: session.sessionId
        }));

        console.log(`✅ User ${uid} joined channel ${channelName}`);

    } catch (error) {
        console.error('❌ Error joining channel:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to join channel: ' + error.message
        }));
    }
}

// Handle audio data from user
async function handleAudioData(ws, data) {
    try {
        const sessionData = activeSessions.get(ws);
        if (!sessionData || !sessionData.session) {
            throw new Error('No active session found');
        }

        const { audioData, isFinal } = data;
        
        // Send audio to conversation service
        const response = await sessionData.session.processAudio({
            audio: audioData,
            isFinal: isFinal,
            timestamp: Date.now()
        });

        // If AI has response, send back to client
        if (response && response.audio) {
            ws.send(JSON.stringify({
                type: 'ai_response',
                audio: response.audio,
                text: response.text,
                isFinal: response.isFinal
            }));
        }

    } catch (error) {
        console.error('❌ Error processing audio data:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process audio: ' + error.message
        }));
    }
}

// Handle text messages
async function handleTextMessage(ws, data) {
    try {
        const sessionData = activeSessions.get(ws);
        if (!sessionData || !sessionData.session) {
            throw new Error('No active session found');
        }

        const { message } = data;
        
        // Send text to conversation service
        const response = await sessionData.session.processText({
            text: message,
            timestamp: Date.now()
        });

        // Send AI response back to client
        ws.send(JSON.stringify({
            type: 'ai_response',
            text: response.text,
            audio: response.audio,
            isFinal: true
        }));

    } catch (error) {
        console.error('❌ Error processing text message:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message: ' + error.message
        }));
    }
}

// Handle channel leave
async function handleLeaveChannel(ws, data) {
    try {
        const sessionData = activeSessions.get(ws);
        if (sessionData && sessionData.session) {
            await sessionData.session.destroy();
            activeSessions.delete(ws);
            
            ws.send(JSON.stringify({
                type: 'channel_left',
                success: true
            }));

            console.log(`✅ User ${sessionData.uid} left channel ${sessionData.channelName}`);
        }
    } catch (error) {
        console.error('❌ Error leaving channel:', error);
    }
}

// Cleanup session
function cleanupSession(ws) {
    const sessionData = activeSessions.get(ws);
    if (sessionData && sessionData.session) {
        sessionData.session.destroy().catch(console.error);
        activeSessions.delete(ws);
        console.log(`🧹 Cleaned up session for user ${sessionData.uid}`);
    }
}


// N8N Webhook endpoint for voice input processing
app.post('/webhook/voice-input', async (req, res) => {
    try {
        console.log('🎤 Received N8N voice input webhook:', req.body);
        
        const { audioData, text, sessionId, userId, timestamp } = req.body;
        
        // Validate required fields
        if (!audioData && !text) {
            return res.status(400).json({
                error: 'Either audioData or text is required'
            });
        }
        
        if (!sessionId || !userId) {
            return res.status(400).json({
                error: 'sessionId and userId are required'
            });
        }
        
        // Process voice input through AI service
        let aiResponse;
        if (conversationService) {
            const session = conversationService.createSession({
                sessionId,
                userId,
                enableVoice: true,
                enableText: true,
                language: 'en-US',
                voiceSettings: {
                    provider: 'azure',
                    voice: 'en-US-JennyNeural',
                    speed: 1.0,
                    pitch: 1.0
                },
                llmSettings: {
                    provider: 'openai',
                    model: 'gpt-4',
                    maxTokens: 1000,
                    temperature: 0.7,
                    systemPrompt: `You are a helpful AI assistant. Be concise, friendly, and professional. 
                    Respond naturally and conversationally. Keep responses under 150 words unless more detail is needed.`
                }
            });
            
            if (audioData) {
                aiResponse = await session.processAudio({
                    audio: audioData,
                    isFinal: true,
                    timestamp: timestamp || Date.now()
                });
            } else if (text) {
                aiResponse = await session.processText({
                    text: text,
                    timestamp: timestamp || Date.now()
                });
            }
            
            // Clean up session
            await session.destroy();
        } else {
            // Fallback to simulated response
            aiResponse = await simulateAIResponse(text || 'voice input');
        }
        
        // Send response back to N8N
        const webhookResponse = {
            success: true,
            sessionId,
            userId,
            timestamp: Date.now(),
            response: {
                text: aiResponse.text,
                audio: aiResponse.audio,
                isFinal: aiResponse.isFinal,
                processingTime: Date.now() - (timestamp || Date.now())
            }
        };
        
        console.log('📤 Sending response to N8N:', webhookResponse);
        
        // Optionally, forward to connected WebSocket clients
        for (const [ws, sessionData] of activeSessions.entries()) {
            if (sessionData.uid === parseInt(userId)) {
                ws.send(JSON.stringify({
                    type: 'n8n_response',
                    data: webhookResponse
                }));
            }
        }
        
        res.json(webhookResponse);
        
    } catch (error) {
        console.error('❌ Error processing N8N webhook:', error);
        res.status(500).json({
            error: 'Failed to process voice input',
            details: error.message
        });
    }
});

// N8N Webhook status endpoint
app.get('/webhook/status', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'N8N Voice Input Webhook',
        timestamp: new Date().toISOString(),
        activeSessions: activeSessions.size,
        endpoints: {
            voiceInput: '/webhook/voice-input',
            status: '/webhook/status'
        }
    });
});
// REST API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        activeSessions: activeSessions.size,
        agoraService: conversationService ? 'initialized' : 'not initialized'
    });
});

// Get Agora token endpoint
app.post('/api/token', async (req, res) => {
    try {
        const { channelName, uid } = req.body;
        
        if (!channelName || !uid) {
            return res.status(400).json({
                error: 'channelName and uid are required'
            });
        }

        // Generate token (you might want to use Agora's token generation service)
        const token = await generateAgoraToken(channelName, uid);
        
        res.json({
            token,
            appId: AGORA_APP_ID,
            channelName,
            uid
        });

    } catch (error) {
        console.error('❌ Error generating token:', error);
        res.status(500).json({
            error: 'Failed to generate token'
        });
    }
});

// Get session info endpoint
app.get('/api/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Find session by ID
        let sessionInfo = null;
        for (const [ws, data] of activeSessions.entries()) {
            if (data.session.sessionId === sessionId) {
                sessionInfo = {
                    sessionId: data.session.sessionId,
                    channelName: data.channelName,
                    uid: data.uid,
                    startTime: data.startTime,
                    duration: Date.now() - data.startTime
                };
                break;
            }
        }

        if (!sessionInfo) {
            return res.status(404).json({
                error: 'Session not found'
            });
        }

        res.json(sessionInfo);

    } catch (error) {
        console.error('❌ Error getting session info:', error);
        res.status(500).json({
            error: 'Failed to get session info'
        });
    }
});

// Generate Agora token (simplified version)
async function generateAgoraToken(channelName, uid) {
    // In production, you should use Agora's token generation libraries
    // This is a simplified example
    const RtcTokenBuilder = require('agora-access-token').RtcTokenBuilder;
    
    const expirationTime = Date.now() + 3600 * 1000; // 1 hour
    
    const token = RtcTokenBuilder.buildTokenWithUid(
        AGORA_APP_ID,
        AGORA_APP_CERTIFICATE,
        channelName,
        uid,
        RtcTokenBuilder.Role.PUBLISHER,
        expirationTime
    );
    
    return token;
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    
    // Cleanup all sessions
    for (const [ws, sessionData] of activeSessions.entries()) {
        cleanupSession(ws);
    }
    
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    
    // Cleanup all sessions
    for (const [ws, sessionData] of activeSessions.entries()) {
        cleanupSession(ws);
    }
    
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Start server
async function startServer() {
    try {
        // Initialize conversation service
        const initialized = await initializeConversationService();
        if (!initialized) {
            console.error('❌ Failed to initialize conversation service');
            process.exit(1);
        }

        // Start server
        server.listen(PORT, () => {
            console.log(`🚀 AI Agent Backend Server running on port ${PORT}`);
            console.log(`📱 Frontend should be available at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            console.log(`🔗 WebSocket server ready for connections`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;