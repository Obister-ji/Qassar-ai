# AI Agent Backend Server

Backend server for AI Agent with Agora Conversational AI SDK integration, providing real-time voice communication and AI processing capabilities.

## 🚀 Features

### Core Functionality
- **Real-time Voice Processing**: Handles audio streams through Agora Conversational AI
- **LLM Integration**: Processes conversations with Large Language Models
- **Text-to-Speech**: Converts AI responses to natural voice audio
- **WebSocket Communication**: Real-time bidirectional communication
- **Session Management**: Manages multiple concurrent AI conversations
- **Token Generation**: Secure Agora token generation and management

### Technical Stack
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework and API server
- **WebSocket**: Real-time communication protocol
- **Agora Conversational AI SDK**: Voice processing and AI integration
- **Security**: Helmet, CORS, compression middleware

## 📋 Prerequisites

### Required Software
- Node.js 16.0.0 or higher
- npm or yarn package manager

### Required Services
- **Agora Account**: App ID, Certificate, Customer ID, and Customer Secret
- **LLM Provider**: OpenAI API key (or compatible provider)
- **TTS Provider**: Azure TTS credentials (or compatible provider)

## 🛠️ Installation

### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd ai-agent-backend

# Install dependencies
npm install

# Or with yarn
yarn install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env
```

### 3. Configure Environment Variables
```env
# Agora Configuration (Required)
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_app_certificate_here
AGORA_CUSTOMER_ID=your_agora_customer_id_here
AGORA_CUSTOMER_SECRET=your_agora_customer_secret_here

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# LLM Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# TTS Configuration (Optional)
AZURE_TTS_KEY=your_azure_tts_key_here
AZURE_TTS_REGION=your_azure_tts_region_here
```

## 🚀 Running the Server

### Development Mode
```bash
# Start with auto-reload
npm run dev

# Or with yarn
yarn dev
```

### Production Mode
```bash
# Start production server
npm start

# Or with yarn
yarn start
```

### Server will start on:
- **API Server**: http://localhost:3001
- **WebSocket Server**: ws://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "activeSessions": 2,
  "agoraService": "initialized"
}
```

### Token Generation
```http
POST /api/token
Content-Type: application/json
```

Request Body:
```json
{
  "channelName": "ai-assistant-channel",
  "uid": 12345
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "appId": "your_app_id",
  "channelName": "ai-assistant-channel",
  "uid": 12345
}
```

### Session Information
```http
GET /api/session/:sessionId
```

Response:
```json
{
  "sessionId": "session_123",
  "channelName": "ai-assistant-channel",
  "uid": 12345,
  "startTime": 1640995200000,
  "duration": 120000
}
```

## 🔌 WebSocket Events

### Client to Server Messages

#### Join Channel
```json
{
  "type": "join_channel",
  "channelName": "ai-assistant-channel",
  "token": "agora_token_here",
  "uid": 12345
}
```

#### Audio Data
```json
{
  "type": "audio_data",
  "audioData": "base64_encoded_audio",
  "isFinal": true
}
```

#### Text Message
```json
{
  "type": "text_message",
  "message": "Hello AI assistant"
}
```

#### Leave Channel
```json
{
  "type": "leave_channel",
  "channelName": "ai-assistant-channel",
  "uid": 12345
}
```

### Server to Client Messages

#### Channel Joined
```json
{
  "type": "channel_joined",
  "success": true,
  "sessionId": "session_123"
}
```

#### AI Response
```json
{
  "type": "ai_response",
  "text": "Hello! How can I help you today?",
  "audio": "base64_encoded_audio_response",
  "isFinal": true
}
```

#### Error Messages
```json
{
  "type": "error",
  "message": "Failed to process audio"
}
```

## 🧠 AI Configuration

### LLM Settings
The backend supports various LLM providers and configurations:

```javascript
llmSettings: {
  provider: 'openai',           // 'openai', 'anthropic', 'google'
  model: 'gpt-4',            // Model name based on provider
  maxTokens: 1000,             // Maximum response tokens
  temperature: 0.7,            // Creativity level (0-1)
  systemPrompt: `You are a helpful AI assistant...`
}
```

### TTS Settings
Configure voice output settings:

```javascript
voiceSettings: {
  provider: 'azure',            // 'azure', 'google', 'aws'
  voice: 'en-US-JennyNeural', // Voice name based on provider
  speed: 1.0,                  // Speech speed (0.5-2.0)
  pitch: 1.0                   // Voice pitch (0.5-2.0)
}
```

## 🔧 Configuration Options

### Server Settings
- **PORT**: Server port (default: 3001)
- **NODE_ENV**: Environment mode (development/production)
- **FRONTEND_URL**: Allowed CORS origin

### Agora Settings
- **AGORA_APP_ID**: Your Agora application ID
- **AGORA_APP_CERTIFICATE**: Your Agora app certificate
- **AGORA_CUSTOMER_ID**: Agora Conversational AI customer ID
- **AGORA_CUSTOMER_SECRET**: Agora Conversational AI customer secret

### AI Provider Settings
- **OPENAI_API_KEY**: OpenAI API key for LLM
- **AZURE_TTS_KEY**: Azure TTS service key
- **AZURE_TTS_REGION**: Azure TTS service region

## 🛡️ Security Features

### Built-in Security
- **Helmet.js**: Security headers and CSP
- **CORS**: Cross-origin resource sharing protection
- **Rate Limiting**: Request rate limiting (configurable)
- **Input Validation**: Request body validation and sanitization
- **Token Security**: Secure token generation and validation

### Best Practices
- **Environment Variables**: Sensitive data in .env files
- **HTTPS Required**: Production deployment requires SSL/TLS
- **Token Expiration**: Tokens have limited lifetime (1 hour default)
- **Session Cleanup**: Automatic cleanup of inactive sessions

## 📊 Monitoring and Logging

### Request Logging
Uses Morgan middleware for HTTP request logging:
```bash
# Development output
GET /api/health 200 5.123 ms - ::1

# Production format (JSON)
{"method":"GET","url":"/api/health","status":200,"response-time":"5.123","remote-addr":"::1"}
```

### Error Handling
- **Graceful Shutdown**: SIGTERM and SIGINT handling
- **Session Cleanup**: Automatic cleanup on connection loss
- **Error Logging**: Comprehensive error tracking
- **Health Monitoring**: Real-time service status

## 🚀 Deployment

### Production Setup
```bash
# Set production environment
export NODE_ENV=production

# Install production dependencies
npm ci

# Start production server
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables in Production
- Use secure secret management (AWS Secrets Manager, etc.)
- Enable HTTPS with valid SSL certificates
- Configure proper CORS origins
- Set up monitoring and alerting

## 🔍 Troubleshooting

### Common Issues

#### Connection Failed
```bash
# Check Agora credentials
echo $AGORA_APP_ID
echo $AGORA_CUSTOMER_ID

# Verify network connectivity
curl -I https://api.agora.io
```

#### Audio Processing Issues
```bash
# Check audio format support
node -e "console.log(require('agora-conversation-sdk').getSupportedFormats())"

# Verify TTS provider credentials
curl -H "Ocp-Apim-Subscription-Key: $AZURE_TTS_KEY" \
     https://$AZURE_TTS_REGION.tts.speech.microsoft.com/
```

#### WebSocket Connection Issues
```bash
# Test WebSocket connection
wscat -c ws://localhost:3001

# Check server logs
npm run dev 2>&1 | grep -i websocket
```

### Debug Mode
Enable detailed logging:
```bash
# Set debug environment
export DEBUG=ai-agent:*

# Run with verbose output
npm run dev
```

## 📝 Development

### Project Structure
```
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env.example          # Environment template
├── BACKEND_README.md     # This documentation
└── README.md            # Main project documentation
```

### Adding New Features
1. Update environment variables in `.env.example`
2. Add API routes in `server.js`
3. Implement WebSocket event handlers
4. Update documentation
5. Add tests in `tests/` directory

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check Agora documentation: https://docs.agora.io/
- Review server logs for error details