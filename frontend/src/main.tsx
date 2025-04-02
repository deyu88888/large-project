import "./theme/globals.css";
import { App } from "./app.tsx";
import { createRoot } from "react-dom/client";
import { isAuthenticated, clearTokens } from './utils/auth';

// Import dev helpers in development environment
if (process.env.NODE_ENV === 'development') {
  import('./utils/dev-helpers');
}

// Handle unhandled errors that might be related to token issues
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('Unauthorized') || 
      event.error?.message?.includes('401')) {
    console.error('Authentication error detected:', event.error);
    
    if (isAuthenticated()) {
      console.warn('Clearing potentially corrupted tokens');
      clearTokens();
      window.location.href = '/login?error=session_expired';
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <App />
);