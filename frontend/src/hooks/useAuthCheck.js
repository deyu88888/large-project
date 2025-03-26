import { useEffect, useState } from 'react';
import { apiClient } from '../api';
const useAuthCheck = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [user, setUser] = useState(null);
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await apiClient.get('/api/user/current/');
                setUser(res.data);
                setIsAuthenticated(true);
            }
            catch (error) {
                if (error.response?.status === 401) {
                    setIsAuthenticated(false);
                }
                console.error('Auth check failed:', error);
            }
        };
        checkAuth();
    }, []);
    return { isAuthenticated, user };
};
export default useAuthCheck;
