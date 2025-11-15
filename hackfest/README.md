# AI Agent - Premium Chat Interface with Backend

A minimalist, premium AI agent chat interface optimized for mobile devices with a sleek black theme and real-time voice communication backend.

## 🏗️ Architecture

### Frontend (Client)
- **Modern Web Interface**: Premium black theme with mobile optimization
- **Real-time Communication**: Agora RTC SDK for voice calls
- **WebSocket Client**: Connects to backend for AI processing
- **ES6 Modules**: Modern JavaScript with tree-shaking support

### Backend (Server)
- **Node.js Server**: Express.js with WebSocket support
- **Agora Conversational AI**: Real-time voice processing
- **LLM Integration**: Large Language Model for conversations
- **TTS Service**: Text-to-Speech for AI responses
- **Session Management**: Multi-user conversation handling

## Features

### 🎨 Frontend Design
- **Premium Black Theme**: Elegant dark color scheme with subtle gradients
- **Minimalist Interface**: Clean, distraction-free design
- **Mobile-First**: Fully responsive and optimized for touch devices
- **Smooth Animations**: Micro-interactions and transitions for enhanced UX

### 💬 Chat Functionality
- **Real-time Messaging**: Send and receive messages instantly
- **Typing Indicators**: Visual feedback when AI is responding
- **Message History**: Scrollable chat with smooth animations
- **Auto-resize Input**: Textarea that grows with content

### 🎤 Voice Features
- **Voice Input**: Built-in microphone support for speech-to-text
- **Recording Indicators**: Visual feedback during voice recording
- **Speech Recognition**: Web Speech API integration
- **Fallback Support**: MediaRecorder API as backup
- **Real-time Voice Calls**: Agora RTC integration for live voice communication
- **Call Controls**: Mute, speaker, and minimize functionality
- **Voice Visualizer**: Audio level visualization during calls

### 🔧 Backend Capabilities
- **Real-time Audio Processing**: Handles voice streams through Agora Conversational AI
- **LLM Integration**: Processes conversations with Large Language Models
- **Text-to-Speech**: Converts AI responses to natural voice audio
- **Session Management**: Manages multiple concurrent AI conversations
- **Token Generation**: Secure Agora token generation and management
- **WebSocket Communication**: Real-time bidirectional communication
- **REST API**: HTTP endpoints for configuration and monitoring

### 📱 Mobile Optimization
- **Touch-Friendly**: Large tap targets (minimum 44px)
- **Gesture Support**: Swipe gestures and touch interactions
- **Responsive Layout**: Adapts to all screen sizes
- **Performance**: Optimized for mobile browsers

## Quick Start

1. Open `index.html` in your web browser
2. Start typing your message or click the microphone button
3. Press Enter or click Send to send your message
4. The AI will respond with a simulated response
5. For voice calls, click the phone icon to start a real-time voice conversation

### Voice Call Setup

To enable voice calling functionality:

1. Get your Agora App ID from [Agora Console](https://console.agora.io/)
2. Replace `<YOUR_APP_ID>` in `script.js` with your actual App ID
3. For production, replace `<YOUR_TOKEN>` with a valid token
4. Configure the channel name if needed

```javascript
const AGORA_CONFIG = {
    appId: 'YOUR_ACTUAL_APP_ID',
    token: 'YOUR_ACTUAL_TOKEN', // null for development
    channel: 'ai-assistant-channel'
};
```

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Features Required**:
  - Web Speech API (for voice input)
  - MediaRecorder API (fallback)
  - Agora RTC SDK (for voice calls)
  - CSS Grid and Flexbox
  - ES6 JavaScript with module support
  - HTTPS (required for microphone access and Agora RTC)

## File Structure

```
├── index.html          # Main application
├── styles.css          # Premium styling and animations
├── script.js           # Chat functionality and interactions
├── test.html           # Responsiveness testing
└── README.md           # Documentation
```

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line in message
- **Ctrl/Cmd + K**: Focus input field
- **Escape**: Stop voice recording / Minimize call modal

## Mobile Features

### Touch Interactions
- Tap to focus input
- Long press for additional options
- Swipe gestures for navigation
- Haptic feedback support

### Responsive Breakpoints
- **Mobile**: < 480px
- **Tablet**: 481px - 768px
- **Desktop**: > 768px

### Performance Optimizations
- Debounced scroll events
- Lazy loading for future features
- Optimized animations
- Memory leak prevention

## Accessibility

- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user's motion preferences
- **Focus Management**: Proper focus handling

## Security

- **XSS Protection**: Safe HTML rendering
- **Input Sanitization**: User input validation
- **Secure Context**: HTTPS required for microphone access
- **Permission Handling**: Proper media permissions
- **Agora Security**: Token-based authentication for voice calls

## Customization

### Frontend Colors
Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-black: #000000;
    --secondary-black: #0a0a0a;
    --accent-gold: #d4af37;
    --accent-blue: #007aff;
    /* ... */
}
```

### Frontend Animations
Modify animation durations and easing:

```css
:root {
    --transition-fast: 0.2s ease;
    --transition-medium: 0.3s ease;
    --transition-slow: 0.5s ease;
}
```

### Backend Configuration
Customize AI behavior in `server.js`:

```javascript
// LLM Settings
llmSettings: {
    provider: 'openai',           // 'openai', 'anthropic', 'google'
    model: 'gpt-4',            // Model name based on provider
    maxTokens: 1000,             // Maximum response tokens
    temperature: 0.7,            // Creativity level (0-1)
    systemPrompt: `You are a helpful AI assistant...`
}

// TTS Settings
voiceSettings: {
    provider: 'azure',            // 'azure', 'google', 'aws'
    voice: 'en-US-JennyNeural', // Voice name based on provider
    speed: 1.0,                  // Speech speed (0.5-2.0)
    pitch: 1.0                   // Voice pitch (0.5-2.0)
}
```

## Testing

Open `test.html` to view the application in different screen sizes:

- iPhone SE (375x667)
- iPhone 11 (414x896)
- iPad (768x1024)
- Desktop (1200x600)

## Future Enhancements

### Frontend
- [ ] File upload support
- [ ] Message reactions
- [ ] Theme customization
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Push notifications
- [ ] End-to-end encryption

### Backend
- [ ] Video calling support
- [ ] Call recording
- [ ] Multiple participant calls
- [ ] Screen sharing
- [ ] Advanced AI personalities
- [ ] Conversation memory
- [ ] Analytics and metrics
- [ ] Load balancing

## Contributing

### Frontend
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Backend
1. Follow the same fork/branch workflow
2. Add tests for new functionality
3. Update API documentation
4. Test with different AI providers
5. Ensure security best practices

## License

This project is open source and available under the [MIT License](LICENSE).

## 📚 Documentation

- **Frontend Guide**: See main README for UI/UX features
- **Backend Guide**: See [BACKEND_README.md](BACKEND_README.md) for server setup
- **API Documentation**: See backend documentation for endpoint details
- **Deployment Guide**: See backend documentation for production setup

---

**Note**: This is a frontend demonstration. Voice recognition requires HTTPS in production environments.