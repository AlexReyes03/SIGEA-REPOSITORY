import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  const updateUser = useCallback((updates) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const payload = await authService.login(credentials);
      const token = payload.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(payload.user));
      setUser(payload.user);
      return payload.user;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && isTokenExpired(token)) logout();
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
