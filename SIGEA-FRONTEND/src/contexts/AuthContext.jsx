import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as authService from '../api/authService';

export const AuthContext = createContext();

function decodeJWT(token) {
  try {
    const part = token.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const decoded = decodeJWT(token);
  return !decoded || !decoded.exp || decoded.exp * 1000 < Date.now();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const logoutInProgressRef = useRef(false);

  const updateUser = useCallback((updates) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const logout = useCallback(async (reason = null) => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;

    try {
      if (reason !== 'auth_error') {
        try {
          await authService.logout();
        } catch (error) {
          console.warn('Error durante logout del servidor:', error);
        }
      }
    } catch {}

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    logoutInProgressRef.current = false;

    return reason;
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const payload = await authService.login(credentials);
      const token = payload.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(payload.user));
      setUser(payload.user);
      logoutInProgressRef.current = false;
      return payload.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAuthError = useCallback(
    async (status, message) => {
      if (logoutInProgressRef.current) return;
      await logout('auth_error');
      return {
        status,
        message: 'Tu sesión ha sido invalidada y se cerró la sesión de forma automática.',
        shouldShowError: true,
      };
    },
    [logout]
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && isTokenExpired(token)) {
      logout('token_expired');
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        login,
        logout,
        loading,
        handleAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
