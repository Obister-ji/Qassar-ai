# N8N Webhook Integration Documentation

## Complete Data Flow

```
User Microphone → Agora ASR → N8N Webhook → N8N AI Processing → Eleven Labs TTS → Agora Audio → User Speakers
```

## N8N Webhook Input (What Agora Sends to N8N)

### Request Format:
- **Method**: POST
- **Content-Type**: application/json
- **URL**: `https://n8n.srv970139.hstgr.cloud/webhook/voice-input`

### Request Body Structure:
```json
{
  "text": "Transcribed user speech from Agora ASR",
  "user_id": "unique_user_identifier",
  "channel": "channel_name",
  "timestamp": "2025-01-14T10:20:00Z",
  "session_id": "agent_session_identifier"
}
```

### Fields Explained:
- **text**: The transcribed speech from user (what user said)
- **user_id**: Unique identifier for the user session
- **channel**: Agora channel name for context
- **timestamp**: When the speech was captured
- **session_id**: Agent session identifier for tracking

## N8N Webhook Output (What N8N Sends Back)

### Response Format for Eleven Labs TTS:
```json
{
  "text": "AI response text to be converted to speech",
  "voice_id": "PAmWeNVsaTzquebdo8ay",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.75,
    "similarity_boost": 0.75,
    "style": "conversation",
    "use_speaker_boost": false
  },
  "audio_url": "https://optional-cdn.com/audio.mp3",
  "status": "success"
}
```

### Required Fields for Eleven Labs:
- **text**: The AI response text (required)
- **voice_id**: Your Eleven Labs voice ID (from .env: `PAmWeNVsaTzquebdo8ay`)
- **model_id**: Eleven Labs model (recommended: `eleven_multilingual_v2`)

### Optional Fields:
- **voice_settings**: Voice customization parameters
  - **stability**: Voice consistency [0.0-1.0]
  - **similarity_boost**: Voice clarity [0.0-1.0]
  - **style**: Voice style ("conversation", "narration", etc.)
  - **use_speaker_boost**: Enhance voice presence
- **audio_url**: Pre-generated audio file URL (if not using real-time TTS)

## Current Configuration

### Environment Variables:
```bash
N8N_WEBHOOK_URL=https://n8n.srv970139.hstgr.cloud/webhook/voice-input
ELEVENLABS_VOICE_ID=PAmWeNVsaTzquebdo8ay
```

### Agora Configuration (server.js):
```javascript
llm: {
    url: "https://n8n.srv970139.hstgr.cloud/webhook/voice-input",
    api_key: "dummy_key",
    system_messages: [{
        role: "system",
        content: "You are a helpful and friendly support assistant."
    }],
    greeting_message: "Hi, I am Optimus Prime from Quasar. How can I assist you today?",
    failure_message: "I'm sorry, I'm having a little trouble right now. Could you please repeat that?",
    max_history: 10,
    params: {
        model: "gpt-4"
    }
}
```

## Testing the Webhook

### Test Endpoint:
```bash
curl -X POST http://localhost:3000/test-n8n-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is test audio transcription",
    "user_id": "test_user_123",
    "channel": "test_channel",
    "timestamp": "2025-01-14T10:20:00Z"
  }'
```

### Expected Response:
```json
{
  "text": "This is a test response from N8N",
  "audio_url": null,
  "status": "success"
}
```

## Debug Panel Integration

The debug panel in the application shows:
1. **Active Workflows**: Real-time status of each connection
2. **Event Logs**: Detailed API calls and responses
3. **Data Flow**: Visual representation of where data is going
4. **N8N Integration**: Specific logging for webhook calls

## Monitoring Points

### In Terminal Logs:
- Look for `=== N8N WEBHOOK TEST ===` sections
- Check `=== AGENT START REQUEST ===` for Agora→N8N calls
- Monitor `=== AGENT STARTED SUCCESSFULLY ===` for agent status

### In Debug Panel:
- Click debug button (🐛) in top-right corner
- Expand to see live workflow status
- Watch for N8N webhook events in real-time
- Export logs for detailed analysis

## Troubleshooting

### Common Issues:
1. **N8N not receiving data**: Check webhook URL in Agora configuration
2. **Eleven Labs not working**: Verify voice_id and API key format
3. **No audio response**: Check N8N workflow response format

### Verification Steps:
1. Test webhook with `/test-n8n-webhook` endpoint
2. Check terminal logs for detailed request/response
3. Monitor debug panel for real-time events
4. Verify Eleven Labs voice ID matches configuration

This documentation provides complete visibility into the N8N integration and data flow throughout the AI Voice Support Assistant.