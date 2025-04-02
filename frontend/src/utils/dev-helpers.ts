import { getAccessToken, getRefreshToken } from './auth';

// Only run in development
if (process.env.NODE_ENV === 'development') {
  // Check tokens periodically
  setInterval(() => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    
    console.group('Token Validation Check');
    console.log('Access Token Present:', !!accessToken);
    console.log('Refresh Token Present:', !!refreshToken);
    
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const expiresIn = (payload.exp * 1000 - Date.now()) / 1000;
        console.log('Access Token Expires In:', Math.round(expiresIn), 'seconds');
        
        if (expiresIn < 300) {
          console.warn('Access token expiring soon!');
        }
      } catch (e) {
        console.error('Access token invalid:', e);
      }
    }
    console.groupEnd();
  }, 60000); // Check every minute
}