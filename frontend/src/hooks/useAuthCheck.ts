import { useEffect, useState } from 'react';
import { apiClient } from '../api';
import { useAuthStore } from '../stores/auth-store';
import { ACCESS_TOKEN } from '../constants';

const useAuthCheck = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      // First, check if we already have a token and/or user in the store
      const token = localStorage.getItem(ACCESS_TOKEN);
      
      if (!token) {
        // If no token, we know user is not authenticated
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // If we already have user data from the store, use that
      if (user) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
      
      // Only make API call if we have a token but no user data
      try {
        const res = await apiClient.get('/api/user/current/');
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (error: any) {
        if (error.response?.status === 401) {
          // Silent handling for 401
          setIsAuthenticated(false);
          localStorage.removeItem(ACCESS_TOKEN);
        } else {
          console.error('Auth check error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [user, setUser]);

  return { isAuthenticated, user, isLoading };
};

export default useAuthCheck;