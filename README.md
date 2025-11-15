# AI Voice Support Assistant

A real-time voice support assistant powered by Agora's Conversational AI, ElevenLabs TTS, and N8N workflow integration. This prototype demonstrates a complete voice-based customer support system with AI-powered conversation capabilities.

## 🚀 Features

- **Real-time Voice Communication**: Low-latency audio streaming using Agora RTC
- **AI-Powered Conversations**: Intelligent responses via N8N workflow integration
- **Natural Voice Synthesis**: High-quality text-to-speech using ElevenLabs
- **Modern React Interface**: Clean, responsive UI with real-time status indicators
- **TypeScript Support**: Fully typed frontend for better development experience
- **Visual Feedback**: Audio level monitoring and connection status indicators

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js Server │    │  Agora AI Agent │
│                 │    │                 │    │                 │
│  - Voice UI     │◄──►│  - Token Gen    │◄──►│  - ASR/TTS      │
│  - Audio Stream │    │  - Agent Mgmt   │    │  - LLM Integration│
│  - Status Ind.  │    │  - API Proxy    │    │  - Voice Synthesis│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  N8N Workflow   │
                       │                 │
                       │  - LLM Processing│
                       │  - Response Gen │
                       │  - Custom Logic │
                       └─────────────────┘
```

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **Agora Account** with:
  - App ID
  - App Certificate
  - Customer ID and Secret
- **ElevenLabs Account** with API key
- **N8N Instance** with voice processing workflow

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd ai-voice-support-assistant
npm install
```

### 2. Environment Configuration

#### Agora Setup
1. Log in to your [Agora Console](https://console.agora.io/)
2. Create a new project or use an existing one
3. Get your **App ID** and **App Certificate**
4. Find your **Customer ID** and **Customer Secret**

#### Update Configuration Files

**In `constants.ts`:**
```typescript
export const AGORA_APP_ID: string = 'your_agora_app_id_here';
export const BACKEND_URL: string = 'http://localhost:3000';
```

**In `server.js`:**
```javascript
const APP_ID = 'your_agora_app_id_here';
const APP_CERTIFICATE = 'your_agora_app_certificate_here';
const CUSTOMER_ID = 'your_customer_id_here';
const CUSTOMER_SECRET = 'your_customer_secret_here';
```

#### ElevenLabs Setup
1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Get your API key from the dashboard
3. Choose a voice ID for your agent

**Update in `server.js`:**
```javascript
const ELEVENLABS_API_KEY = 'sk_your_elevenlabs_api_key_here';
const ELEVENLABS_VOICE_ID = 'your_chosen_voice_id_here';
```

#### N8N Workflow Setup
1. Set up your N8N instance
2. Create a webhook endpoint for voice input processing
3. Configure your LLM integration (OpenAI, Claude, etc.)

**Update in `server.js`:**
```javascript
const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/voice-input';
```

### 3. Start the Application

#### Terminal 1: Start Backend Server
```bash
node server.js
```
You should see: `Backend server running on port 3000`

#### Terminal 2: Start Frontend Development Server
```bash
npm run dev
```

#### Access the Application
Open your browser and navigate to `http://localhost:5173` (or the URL shown in the terminal)

## 🎯 Usage

1. **Start Conversation**: Click the "Start Conversation" button to initiate a voice session
2. **Grant Permissions**: Allow browser microphone access when prompted
3. **Speak Naturally**: Talk to the AI assistant as you would with a human agent
4. **Visual Feedback**: 
   - Green indicator = Connected and active
   - Yellow/pulsing = Connecting or disconnecting
   - Red = Error occurred
   - Gray = Idle/disconnected
5. **End Conversation**: Click "End Conversation" to terminate the session

## 🔧 Technical Details

### Frontend Components

- **App.tsx**: Main application component with UI layout
- **useAgora.ts**: Custom hook managing Agora RTC connection and agent lifecycle
- **ControlButton.tsx**: Reusable button component for actions
- **StatusIndicator.tsx**: Visual status indicator
- **MicIcon.tsx**: Microphone icon component
- **PhoneIcon.tsx**: Phone icon component

### Backend Endpoints

- `POST /generate-token`: Generates Agora RTC token for secure connections
- `POST /start-agent`: Initializes and starts the AI agent
- `POST /stop-agent`: Stops and cleans up the AI agent

### Key Technologies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Real-time Communication**: Agora RTC SDK
- **Voice Processing**: ElevenLabs TTS, Agora ASR
- **AI Integration**: N8N workflows, LLM APIs

## 🐛 Troubleshooting

### Common Issues

#### "Failed to fetch" Error
- **Cause**: Backend server not running or incorrect URL configuration
- **Solution**: Ensure backend server is running on port 3000 and `BACKEND_URL` is correctly set

#### Agent Not Speaking
- **Cause**: ElevenLabs API key issues or voice configuration problems
- **Solution**: 
  - Verify API key is valid and starts with "sk_"
  - Check voice ID exists in your ElevenLabs account
  - Monitor server logs for TTS errors

#### Connection Issues
- **Cause**: Agora configuration problems or network issues
- **Solution**:
  - Verify App ID and Certificate are correct
  - Check firewall settings
  - Ensure proper token generation

#### N8N Integration Problems
- **Cause**: Webhook URL incorrect or N8N workflow issues
- **Solution**:
  - Verify webhook URL is accessible
  - Check N8N workflow is properly configured
  - Monitor N8N execution logs

### Debug Mode

Enable detailed logging by checking the browser console and server terminal output:

```bash
# Server logs show detailed agent configuration
node server.js

# Browser console shows RTC connection status
# Open Developer Tools → Console tab
```

## 🔒 Security Considerations

- **API Keys**: Never commit API keys to version control
- **Token Generation**: Use proper App Certificate for production
- **CORS**: Configure appropriate CORS policies for production
- **Rate Limiting**: Implement rate limiting for API endpoints
- **Input Validation**: Validate all user inputs and API responses

## 🚀 Deployment

### Production Deployment

1. **Environment Variables**: Use environment variables for all sensitive data
2. **HTTPS**: Ensure all endpoints use HTTPS in production
3. **Domain Configuration**: Update `BACKEND_URL` to your production domain
4. **Build Frontend**: 
   ```bash
   npm run build
   ```
5. **Serve Static Files**: Use a web server like Nginx to serve the built frontend

### Docker Deployment

```dockerfile
# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the [Agora Documentation](https://docs.agora.io/en/)
3. Consult [ElevenLabs API Docs](https://elevenlabs.io/docs)
4. Check [N8N Documentation](https://docs.n8n.io/)

## 🔄 Version History

- **v1.0.0**: Initial prototype release
  - Basic voice communication
  - Agora integration
  - ElevenLabs TTS
  - N8N workflow support
  - React frontend with TypeScript

---

**Note**: This is a prototype implementation. For production use, ensure proper security measures, error handling, and scalability considerations are implemented.
