// Import Agora RTC SDK modules
import { createClient, createMicrophoneAudioTrack } from "https://download.agora.io/sdk/release/AgoraRTC_N-4.20.1.js";

// DOM Elements
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const chatMessages = document.getElementById('chatMessages');
const recordingIndicator = document.getElementById('recordingIndicator');

// Voice Call Elements
const voiceCallBtn = document.getElementById('voiceCallBtn');
const voiceCallModal = document.getElementById('voiceCallModal');
const minimizeBtn = document.getElementById('minimizeBtn');
const endCallBtn = document.getElementById('endCallBtn');
const muteBtn = document.getElementById('muteBtn');
const speakerBtn = document.getElementById('speakerBtn');
const callStatusText = document.getElementById('callStatusText');
const voiceVisualizer = document.getElementById('voiceVisualizer');

// State Management
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let recognition = null;

// Voice Call State
let isInCall = false;
let isMuted = false;
let isSpeakerOn = false;
let isMinimized = false;
let agoraClient = null;
let microphoneTrack = null;
let localAudioTrack = null;
let remoteUsers = {};

// Agora Configuration
const AGORA_CONFIG = {
    appId: '<YOUR_APP_ID>', // Replace with your Agora App ID
    token: '<YOUR_TOKEN>', // Use null for development, token for production
    channel: 'ai-assistant-channel', // Channel name
    uid: Math.floor(Math.random() * 10000) // Generate random UID
};

// Backend Configuration
const BACKEND_CONFIG = {
    wsUrl: 'ws://localhost:3001', // WebSocket server URL
    apiUrl: 'http://localhost:3001/api', // REST API URL
    n8nWebhook: 'https://n8n.srv970139.hstgr.cloud/webhook/voice-input' // N8N webhook URL
};

// WebSocket connection
let wsConnection = null;
let isConnected = false;

// Initialize Speech Recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        console.log('Speech recognition started');
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
        
        messageInput.value = transcript;
        adjustTextareaHeight();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
        showErrorMessage('Voice recognition failed. Please try again.');
    };

    recognition.onend = () => {
        stopRecording();
    };
}

// Initialize Media Recorder
async function initializeMediaRecorder() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioChunks = [];
            
            // Here you would typically send the audio to a speech-to-text service
            // For demo purposes, we'll simulate a response
            simulateVoiceResponse();
        };
        
        return true;
    } catch (error) {
        console.error('Error accessing microphone:', error);
        showErrorMessage('Microphone access denied. Please check your permissions.');
        return false;
    }
}

// Message Handling
function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Clear input
    messageInput.value = '';
    adjustTextareaHeight();
    
    // Disable send button temporarily
    setSendButtonState(false);
    
    // Send message to backend/N8N
    const messageSent = sendToBackend('text_message', {
        text: message,
        sessionId: `session_${Date.now()}`,
        userId: AGORA_CONFIG.uid,
        timestamp: Date.now()
    });
    
    if (MessageSent) {
        console.log('✅ Message sent to backend');
    } else {
        console.log('❌ Failed to send message to backend');
        showErrorMessage('Failed to send message. Please try again.');
        setSendButtonState(true);
    }
}

function addMessageToChat(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    if (sender === 'ai') {
        avatarDiv.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
        `;
    } else {
        avatarDiv.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
            </svg>
        `;
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    const paragraph = document.createElement('p');
    paragraph.textContent = message;
    contentDiv.appendChild(paragraph);
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-message';
    typingDiv.id = 'typingIndicator';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        </svg>
    `;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    typingDiv.appendChild(avatarDiv);
    typingDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Voice Recording Functions
async function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
}

async function startRecording() {
    if (recognition) {
        // Use Web Speech API if available
        try {
            recognition.start();
            isRecording = true;
            micBtn.classList.add('recording');
            messageInput.placeholder = 'Listening...';
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            showErrorMessage('Failed to start voice recognition. Please try again.');
        }
    } else {
        // Fallback to MediaRecorder
        const initialized = await initializeMediaRecorder();
        if (initialized) {
            mediaRecorder.start();
            isRecording = true;
            micBtn.classList.add('recording');
            messageInput.placeholder = 'Recording...';
        }
    }
}

function stopRecording() {
    if (recognition && isRecording) {
        recognition.stop();
    } else if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    
    isRecording = false;
    micBtn.classList.remove('recording');
    messageInput.placeholder = 'Type your message...';
}

// Simulation Functions
function simulateAIResponse(userMessage) {
    addTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        
        const responses = [
            "I understand your question. Let me help you with that.",
            "That's an interesting point! Here's what I think...",
            "Based on what you've told me, I would suggest...",
            "I can definitely assist you with this. Let me explain...",
            "Great question! Here's my analysis...",
            "I see what you're asking. Let me provide some insights...",
            "That's a thoughtful inquiry. Here's my perspective...",
            "I appreciate you asking. Let me help you understand..."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessageToChat(randomResponse, 'ai');
    }, 1500 + Math.random() * 2000);
}

function simulateVoiceResponse() {
    addTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        addMessageToChat("I received your voice message. How can I help you further?", 'ai');
    }, 2000);
}

// Utility Functions
function setSendButtonState(enabled) {
    sendBtn.disabled = !enabled;
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function adjustTextareaHeight() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showErrorMessage(message) {
    addMessageToChat(`Error: ${message}`, 'ai');
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Also handle Enter on the send button click
sendBtn.addEventListener('click', () => {
    sendMessage();
});

messageInput.addEventListener('input', adjustTextareaHeight);

micBtn.addEventListener('click', toggleRecording);

// Handle visibility change to stop recording when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRecording) {
        stopRecording();
    }
});

// Handle page unload to clean up media resources
window.addEventListener('beforeunload', () => {
    if (isRecording) {
        stopRecording();
    }
});

// WebSocket Functions
function initializeWebSocket() {
    try {
        wsConnection = new WebSocket(BACKEND_CONFIG.wsUrl);
        
        wsConnection.onopen = () => {
            console.log('Connected to backend WebSocket');
            isConnected = true;
        };
        
        wsConnection.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleBackendMessage(data);
        };
        
        wsConnection.onclose = () => {
            console.log('Disconnected from backend WebSocket');
            isConnected = false;
            wsConnection = null;
        };
        
        wsConnection.onerror = (error) => {
            console.error('WebSocket error:', error);
            isConnected = false;
            showErrorMessage('Connection to server lost. Please refresh.');
        };
        
    } catch (error) {
        console.error('Error initializing WebSocket:', error);
        showErrorMessage('Failed to connect to server.');
    }
}

function handleBackendMessage(data) {
    switch (data.type) {
        case 'channel_joined':
            handleChannelJoined(data);
            break;
        case 'ai_response':
            handleAIResponse(data);
            break;
        case 'n8n_response':
            handleN8NResponse(data);
            break;
        case 'error':
            showErrorMessage(data.message);
            break;
        default:
            console.log('Unknown backend message:', data);
    }
}

function handleN8NResponse(data) {
    if (data.data && data.data.text) {
        addMessageToChat(data.data.text, 'ai');
    }
    
    if (data.data && data.data.audio) {
        playAudioResponse(data.data.audio);
    }
}

function handleChannelJoined(data) {
    if (data.success) {
        updateCallStatus('Connected to AI');
        addMessageToChat('Connected to AI Assistant', 'ai');
    } else {
        showErrorMessage('Failed to join channel');
    }
}

function handleAIResponse(data) {
    if (data.text) {
        addMessageToChat(data.text, 'ai');
    }
    
    if (data.audio) {
        // Play AI audio response
        playAudioResponse(data.audio);
    }
}

async function playAudioResponse(audioData) {
    try {
        // Convert base64 audio to blob and play
        const audioBlob = base64ToBlob(audioData, 'audio/wav');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
    } catch (error) {
        console.error('Error playing audio response:', error);
    }
}

function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

function sendToBackend(type, data) {
    if (!isConnected || !wsConnection) {
        console.error('Not connected to backend');
        return false;
    }
    
    const message = {
        type,
        timestamp: Date.now(),
        ...data
    };
    
    try {
        wsConnection.send(JSON.stringify(message));
        console.log('✅ Message sent to backend:', type);
        return true;
    } catch (error) {
        console.error('❌ Error sending message to backend:', error);
        return false;
    }
}

// Agora RTC Functions
async function initializeAgora() {
    try {
        // Create Agora client using modern ES6 import
        agoraClient = createClient({ mode: "rtc", codec: "vp8" });
        
        // Set up event listeners
        agoraClient.on("user-published", handleUserPublished);
        agoraClient.on("user-unpublished", handleUserUnpublished);
        agoraClient.on("user-joined", handleUserJoined);
        agoraClient.on("user-left", handleUserLeft);
        
        return true;
    } catch (error) {
        console.error('Error initializing Agora:', error);
        showErrorMessage('Failed to initialize voice calling. Please try again.');
        return false;
    }
}

async function joinVoiceCall() {
    try {
        updateCallStatus('Connecting...');
        
        // Initialize Agora if not already done
        if (!agoraClient) {
            const initialized = await initializeAgora();
            if (!initialized) return;
        }
        
        // Join channel
        await agoraClient.join(
            AGORA_CONFIG.appId,
            AGORA_CONFIG.channel,
            AGORA_CONFIG.token || null,
            AGORA_CONFIG.uid
        );
        
        // Create and publish microphone track using modern ES6 import
        microphoneTrack = await createMicrophoneAudioTrack();
        await agoraClient.publish([microphoneTrack]);
        
        // Update UI
        isInCall = true;
        voiceCallBtn.classList.add('active');
        voiceCallModal.classList.add('active');
        updateCallStatus('Connected');
        startVoiceVisualizer();
        
        // Add system message
        addMessageToChat('Voice call started', 'ai');
        
    } catch (error) {
        console.error('Error joining voice call:', error);
        updateCallStatus('Connection failed');
        showErrorMessage('Failed to join voice call. Please check your microphone permissions.');
        leaveVoiceCall();
    }
}

async function leaveVoiceCall() {
    try {
        if (microphoneTrack) {
            microphoneTrack.close();
            microphoneTrack = null;
        }
        
        if (agoraClient) {
            await agoraClient.leave();
        }
        
        // Update UI
        isInCall = false;
        voiceCallBtn.classList.remove('active');
        voiceCallModal.classList.remove('active');
        voiceCallModal.classList.remove('minimized');
        updateCallStatus('Disconnected');
        stopVoiceVisualizer();
        
        // Add system message
        addMessageToChat('Voice call ended', 'ai');
        
    } catch (error) {
        console.error('Error leaving voice call:', error);
    }
}

function toggleMute() {
    if (!microphoneTrack) return;
    
    isMuted = !isMuted;
    microphoneTrack.setMuted(isMuted);
    muteBtn.classList.toggle('muted', isMuted);
    
    updateCallStatus(isMuted ? 'Muted' : 'Connected');
}

function toggleSpeaker() {
    isSpeakerOn = !isSpeakerOn;
    speakerBtn.classList.toggle('active', isSpeakerOn);
    
    // In a real implementation, you would control audio output here
    // For now, we'll just update the UI
}

function toggleMinimize() {
    isMinimized = !isMinimized;
    voiceCallModal.classList.toggle('minimized', isMinimized);
}

function updateCallStatus(status) {
    if (callStatusText) {
        callStatusText.textContent = status;
    }
}

// Agora Event Handlers
async function handleUserPublished(user, mediaType) {
    await agoraClient.subscribe(user, mediaType);
    
    if (mediaType === 'audio') {
        // Play remote audio
        user.audioTrack.play();
        remoteUsers[user.uid] = user;
        updateCallStatus('AI Assistant joined');
    }
}

function handleUserUnpublished(user) {
    delete remoteUsers[user.uid];
    updateCallStatus('AI Assistant left');
}

function handleUserJoined(user) {
    console.log('User joined:', user.uid);
}

function handleUserLeft(user) {
    console.log('User left:', user.uid);
    delete remoteUsers[user.uid];
}

// Voice Visualizer
function startVoiceVisualizer() {
    if (voiceVisualizer) {
        voiceVisualizer.classList.remove('inactive');
    }
}

function stopVoiceVisualizer() {
    if (voiceVisualizer) {
        voiceVisualizer.classList.add('inactive');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Focus on input
    messageInput.focus();
    
    // Set initial button state
    setSendButtonState(true);
    
    // Initialize voice visualizer as inactive
    stopVoiceVisualizer();
    
    // Add welcome animation
    setTimeout(() => {
        const welcomeMessage = chatMessages.querySelector('.ai-message');
        if (welcomeMessage) {
            welcomeMessage.style.opacity = '0';
            welcomeMessage.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                welcomeMessage.style.transition = 'all 0.5s ease';
                welcomeMessage.style.opacity = '1';
                welcomeMessage.style.transform = 'translateY(0)';
            }, 100);
        }
    }, 100);
});

// Handle network connectivity
window.addEventListener('online', () => {
    addMessageToChat('Connection restored. You can continue chatting.', 'ai');
});

window.addEventListener('offline', () => {
    addMessageToChat('Connection lost. Please check your internet connection.', 'ai');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        messageInput.focus();
    }
    
    // Escape to stop recording
    if (e.key === 'Escape' && isRecording) {
        stopRecording();
    }
});

// Touch gestures for mobile
let touchStartY = 0;
let touchEndY = 0;

chatMessages.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
});

chatMessages.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture();
});

function handleSwipeGesture() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe up - scroll to bottom
            scrollToBottom();
        }
    }
}

// Performance optimization - debounce scroll events
let scrollTimeout;
chatMessages.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        // Lazy loading or other scroll-based optimizations can go here
    }, 100);
});

// Voice Call Event Listeners
voiceCallBtn.addEventListener('click', () => {
    if (isInCall) {
        leaveVoiceCall();
    } else {
        joinVoiceCall();
    }
});

minimizeBtn.addEventListener('click', toggleMinimize);
endCallBtn.addEventListener('click', leaveVoiceCall);
muteBtn.addEventListener('click', toggleMute);
speakerBtn.addEventListener('click', toggleSpeaker);

// Handle escape key to close call modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isInCall && !isMinimized) {
        toggleMinimize();
    }
});

// Error handling for uncaught promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorMessage('An unexpected error occurred. Please refresh the page.');
});