// Agora App ID provided by the user.
export const AGORA_APP_ID: string = import.meta.env.VITE_AGORA_APP_ID || '';

// IMPORTANT: This is the URL of the Node.js backend server.
// For development, it's assumed to be running locally on port 3000.
// If you have deployed your backend, replace this with your deployed URL.
export const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
