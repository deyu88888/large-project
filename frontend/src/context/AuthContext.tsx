import React, { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated, clearTokens, setAccessToken, setRefreshToken } from '../utils/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  login: () => {},
  logout: () => {}
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isAuthenticated());
  
  // Check auth status on initial load and token changes
  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(isAuthenticated());
    checkAuth();
    
    // Listen for storage events (for multi-tab support)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);
  
  const login = (accessToken: string, refreshToken: string) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setIsLoggedIn(true);
  };
  
  const logout = () => {
    clearTokens();
    setIsLoggedIn(false);
  };
  
  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);