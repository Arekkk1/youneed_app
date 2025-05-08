import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user && !!token;

  // Set or remove Authorization header
  const setAuthHeader = useCallback((tokenValue) => {
    if (tokenValue) {
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenValue}`;
      console.log('[AuthContext DEBUG] Set Authorization header');
    } else {
      delete api.defaults.headers.common['Authorization'];
      console.log('[AuthContext DEBUG] Removed Authorization header');
    }
  }, []);

  // Fetch user profile
  const fetchUserProfile = useCallback(
    async (currentToken) => {
      console.log('[AuthContext DEBUG] fetchUserProfile: Token present:', !!currentToken);
      if (!currentToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get('/auth/me');
        console.log('[AuthContext DEBUG] fetchUserProfile: Response:', response.data);
        if (response.data.status === 'success' && response.data.data) {
          const fetchedUser = response.data.data;
          if (!fetchedUser.id || !fetchedUser.role) {
            throw new Error('Invalid user data: missing id or role');
          }
          setUser(fetchedUser);
          localStorage.setItem('role', fetchedUser.role);
          localStorage.setItem('userId', fetchedUser.id);
          console.log('[AuthContext DEBUG] fetchUserProfile: User set:', fetchedUser);
        } else {
          throw new Error('Invalid response structure');
        }
      } catch (error) {
        console.error('[AuthContext DEBUG] fetchUserProfile: Error:', error.message, error.response?.data);
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        setAuthHeader(null);
        navigate('/login?sessionExpired=true');
      } finally {
        setLoading(false);
      }
    },
    [setAuthHeader, navigate]
  );

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      console.log('[AuthContext DEBUG] initializeAuth: Stored token:', !!storedToken);
      if (storedToken) {
        setToken(storedToken);
        setAuthHeader(storedToken);
        await fetchUserProfile(storedToken);
      } else {
        setLoading(false);
      }
    };
    initializeAuth();
  }, [setAuthHeader, fetchUserProfile]);

  // Login function
  const login = useCallback(
    async (userData, tokenValue) => {
      console.log('[AuthContext DEBUG] login: UserData:', userData, 'Token:', !!tokenValue);
      if (!userData || !tokenValue || !userData.id || !userData.role) {
        console.error('[AuthContext DEBUG] login: Invalid userData or token');
        throw new Error('Invalid login data');
      }

      try {
        localStorage.setItem('token', tokenValue);
        localStorage.setItem('role', userData.role);
        localStorage.setItem('userId', userData.id);
        setToken(tokenValue);
        setUser(userData);
        setAuthHeader(tokenValue);
        setLoading(false);
        console.log('[AuthContext DEBUG] login: Success, user set:', userData);
      } catch (error) {
        console.error('[AuthContext DEBUG] login: Error:', error.message);
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        setAuthHeader(null);
        setLoading(false);
        throw error;
      }
    },
    [setAuthHeader]
  );

  // Logout function
  const logout = useCallback(() => {
    console.log('[AuthContext DEBUG] logout: Clearing auth state');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    setAuthHeader(null);
    setLoading(false);
    navigate('/login');
  }, [setAuthHeader, navigate]);

  // Debug state changes
  useEffect(() => {
    console.log('[AuthContext STATE] user:', user);
  }, [user]);
  useEffect(() => {
    console.log('[AuthContext STATE] token:', token);
  }, [token]);
  useEffect(() => {
    console.log('[AuthContext STATE] loading:', loading);
  }, [loading]);
  useEffect(() => {
    console.log('[AuthContext STATE] isAuthenticated:', isAuthenticated);
  }, [isAuthenticated]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
